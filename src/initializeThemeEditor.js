import { renderSelectedVars } from './renderSelectedVars';
import { getMatchingVars } from './functions/getMatchingVars';
import { addHighlight, removeHighlight } from './functions/highlight';
import { groupVars } from './functions/groupVars';
import { extractPageVariables } from './functions/extractPageVariables';
import { filterMostSpecific } from './functions/getOnlyMostSpecific';
import {getLocalStorageNamespace, setLocalStorageNamespace} from './functions/getLocalStorageNamespace';
import {initializeConsumer} from './sourcemap';
import { getAllDefaultValues } from './functions/getAllDefaultValues';
import { deriveUtilitySelectors, parseCss } from './functions/parseCss';
import { toNode } from './functions/nodePath';
import { restoreHistory } from './_unstable/historyStore';
import { makeCourses } from './_unstable/courses';
import { setServerConfig } from './hooks/useServerThemes';
import { balancedVar } from './functions/balancedVar';
import { definedValues } from './functions/collectRuleVars';
import { furthest } from './functions/furthest';

export function nukePointerEventsNone(target) {
  // Quick fix, disable pointer-events: none rule on all children
  [...target.children].forEach(el => {
    const comp = getComputedStyle(el).pointerEvents;
    if (comp === 'none') {
      el.style.pointerEvents = 'auto';
    }
  });
}


export const LOCAL_STORAGE_KEY = `${getLocalStorageNamespace()}theme`;
const isRunningAsFrame = window.self !== window.top;
const dependencyReady = initializeConsumer();

const toggleStylesheets = (disabledSheets) => {
  [...document.styleSheets].forEach(sheet => {
    if (!sheet.href) {
      return;
    }
    const id = sheet.href.replace(/\?.*/, '');
    sheet.disabled = !!disabledSheets[id];
  });
};

let scopesStyleElement = document.createElement('style');
document.head.appendChild(scopesStyleElement);
export const styleId = '__forced-styles__'
scopesStyleElement.id = styleId;

let ruleIndexes = {};

document.title = `🖌${document.title}`;

function toPropertyString(properties) {
    let propertyString = '';
    for (const prop in properties) {
      // Leading space on first is needed to match CSS formated by the browser.
      propertyString += ` ${prop}: ${properties[prop]} !important;`
    }
    return propertyString;
}

// To guarantee a consistent index, rules are not deleted, but emptied instead.
function updateRule(selector, properties) {
  // Leading space is included in first property. Trailing here to ensure right empty behavior of 1 space.
  const cssText = `${selector} {${toPropertyString(properties)} }`;

  if (!(selector in ruleIndexes)) {
    // New rule
    ruleIndexes[selector] = scopesStyleElement.sheet.insertRule(cssText, Object.keys(ruleIndexes).length);
    return;
  }

  const ruleIndex = ruleIndexes[selector];

  if (scopesStyleElement.sheet.cssRules[ruleIndex].cssText === cssText) {
    // Nothing to update.
    return;
  }
  // Add new rule.
  scopesStyleElement.sheet.insertRule(cssText, ruleIndex);
  // Remove previous, thereby restoring precarious order.
  scopesStyleElement.sheet.deleteRule(ruleIndex + 1);
}

// Throw away previous style elements and reconstruct new ones with the right values.
export function updateScopedVars(scopes, resetAll = false) {
  if (resetAll) {
    [...scopesStyleElement.sheet.cssRules].forEach(() => scopesStyleElement.sheet.deleteRule(0))
    ruleIndexes = {};
  }
  Object.entries(scopes).forEach( ([selector, scopeVars]) => {
    updateRule(selector, scopeVars);
 });
}

function destroyDoc() {
  [...document.body.childNodes].forEach(el => {
    if (['STYLE', 'LINK', 'SCRIPT', ].includes(el.nodeName)) {
      return;
    }
    document.body.removeChild(el);
  });
}

// WIP, not used in the app yet.
let rulesWithMap = [], rogueAtRules = [], comments = [], keyframesRules = [], selectorRules = [], testSelectors = new Map();

function extractionResults() {
  return {rulesWithMap, rogueAtRules, comments, keyframesRules, selectorRules, testSelectors};
}

let cssVars;
let lastGroups = [];


const groupCache = new WeakMap();

export function getGroupsForElement(element) {
  if (groupCache.has(element)) {
    return groupCache.get(element);
  }
  const matchedVars = getMatchingVars({ cssVars, target: element });
  const rawGroups = groupVars(matchedVars, element, cssVars);
  const groups = filterMostSpecific(rawGroups, element);

  groupCache.set(element, groups);

  return groups;
}


// References in base files used on the page, not accounting for modifications.
export const sourceRefs = new Map();

function mappedSet(varName, selector) {
  let selectors = sourceRefs.get(varName);
  if (!selectors) {
    selectors = new Map();
    sourceRefs.set(varName, selectors);
  }
  let properties = selectors.get(selector);
  if (!properties) {
    properties = new Set();
    selectors.set(selector, properties);
  }
  return properties;
}

// Not yet used.
function initiateReferences(vars, defaultValues) {
  // console.log(definedValues);
  let match;
  for (const [scope, properties] of Object.entries(definedValues)) {
    for (const [name, value] of Object.entries(properties)) {
      if (!value.includes('var(')) {
        continue;
      }
      let tmp = value;
      while (match = balancedVar(tmp)) {
        // console.log(name, value, match);
        tmp = match.post;
        const set = mappedSet(match.body, scope);
        set.add(name);
      }
    }
  }
  console.log(sourceRefs);
}

let defaultValues;

export function getDefaults() {
  return defaultValues;
}

export const setupThemeEditor = async (config) => {
  setLocalStorageNamespace(config.localStorageNamespace || '');


  // 🐢
  if (!isRunningAsFrame) {
    await dependencyReady;
    setServerConfig(config.serverThemes);
    // updateScopedVars(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'));

    cssVars = await extractPageVariables();
    const defaults = getAllDefaultValues(cssVars);
    defaultValues = defaults;

    const sheets = [...document.styleSheets].filter(s=>s.ownerNode?.id!==styleId);

    // console.time('new')
    for (const sheet of sheets) {
      let text;
      if (sheet.href) {
        try {
          text = (await (await fetch(sheet.href)).text());
        } catch(e) {
          continue;
        }
      } else {
        text = sheet.ownerNode?.innerHTML;
        if (!text) {
          continue;
        };
      }

      parseCss(text, {
        comments,
        rulesWithMap,
        rogueAtRules,
        sheet,
      });
    }
    // console.timeEnd('new')

    // console.time('derive');
    deriveUtilitySelectors({rulesWithMap, keyframesRules, selectorRules, testSelectors})
    // console.timeEnd('derive');

    // Quick fix because both frames are sending the same message.
    let didRestoreHistory = false;
    destroyDoc();
    const editorRoot = document.createElement( 'div' );
    renderSelectedVars(editorRoot, cssVars, defaults);
    restoreHistory();

    editorRoot.id = 'theme-editor-root';
    document.body.appendChild( editorRoot );
  }

  const locatedElements = {};

  // Keep 1 timeout as we only want to be highlighting 1 element at a time.
  let lastHighlightTimeout = null;
  let ignoreScroll = false;
  let scrollDebounceTimeout = null;

  function inspectNew(element) {
    // TODO: Cache (perhaps WeakMap or WeakRef on the DOM element)
    console.time('new');
    const {testSelectors, selectorRules} = extractionResults();
    let i=0;
    for (const [, rule] of testSelectors) {
      i++;
      try {
        rule.lastEl = furthest(element, rule.text);
      } catch (e) {
        console.log(i, e, rule);
      }
    }

    const mappedRules = selectorRules.reduce((groups, rule) => {
      const matches = [...rule.testSelectors].filter(s => s.lastEl).map(s=>s.lastEl);
      if (matches.length > 1) {
        // Will solve later.
        console.log('rule has multiple matches', rule, matches)
      }

      if (matches.length === 1) {
        const el = matches[0];
        let group = groups.get(el);
        if (!group) {
          group = [];
          groups.set(el, group)
        }
        group.push(rule);
      }

      return groups;
    }, new Map());

    let cur = element, groups = [];

    while (cur) {
      const rules = mappedRules.get(cur);
      if (rules) {
        let calcedStyle = new Map();
        // style calc stubbed for now but should be quite close result and performance
        for (const [, rule] of rules.entries()) {
          for (const [property, value] of rule.stylemap.entries()) {
            calcedStyle.set(property, value);
          }
        }
        groups.push({element: cur, calcedStyle, rules});
      }
      cur = cur.parentNode;
    }

    // console.timeEnd('new');
    // console.log('matches', [...testSelectors].filter(([k,v])=>{
    //   return v.lastEl;
    // }));
    // console.log('mapped', mappedRules);
    // console.log('groups', groups);
  }

  // Below are only listeners for messages sent from the parent frame.
  if (!isRunningAsFrame) {
    makeCourses();
    return;
  }
  // document.documentElement.classList.add('simulating-touch-device')
  document.documentElement.classList.add('force-cursor')

  const storedSheetConfig = localStorage.getItem(getLocalStorageNamespace() + 'set-disabled-sheets');

  if (storedSheetConfig) {
    const disabledSheets = JSON.parse(storedSheetConfig);
    toggleStylesheets(disabledSheets);
  }

  let scrollListener;

  const messageListener = event => {
    const {type, payload} = event.data;
    const {index, selector, scopes, resetAll, path} = payload || {};

    switch (type) {
    case 'scroll-in-view':
      const element = selector ? locatedElements[selector][index] : toNode(payload.path);

      element.scrollIntoView(payload.options || {
        behavior: 'smooth',
        block: 'center',
        inline: 'end',
      });
      addHighlight(element);
      if (lastHighlightTimeout) {
        const [timeout, handler, timeoutElement] = lastHighlightTimeout;

        window.clearTimeout(timeout);
        // If previous timeout was on another element, execute it immediately.
        // Removes its focus border.
        if (timeoutElement !== element) {
          handler();
        }
      }
      const handler = () => {
        removeHighlight(element);
        lastHighlightTimeout = null;
      };

      lastHighlightTimeout = [setTimeout(handler, 1500), handler, element];
      break;

    case 'set-sheet-config':
      toggleStylesheets(JSON.parse(payload));
      break;
      case 'set-scopes-styles': 
        updateScopedVars(scopes, resetAll);
        break;
      case 'force-scroll':
        ignoreScroll = true;
        window.scrollTo({top: payload.position, behavior: payload.shouldSmoothScroll ? 'smooth' : 'auto' });
        ignoreScroll = false;
        break;
      case 'emit-scroll': 
        const notifyParent = () => {
            window.parent.postMessage(
              {
                type: 'frame-scrolled', payload: {
                  scrollPosition: document.documentElement.scrollTop,
                },
              },
              window.location.href,
            );
            scrollDebounceTimeout = null;
          }
          // scrollListener && document.removeEventListener('scroll');
          scrollListener = (event) => {
           if (ignoreScroll) {
              return;
            }
            if (!scrollDebounceTimeout) {
              scrollDebounceTimeout = setTimeout(notifyParent, 20);
            }
          }
          document.addEventListener('scroll', scrollListener, {passive: true})
        break;
    }
  };
  window.addEventListener('message', messageListener, false);
};

