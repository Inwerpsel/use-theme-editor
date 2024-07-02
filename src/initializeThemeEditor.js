import { getPrevinspections, renderSelectedVars } from './renderSelectedVars';
import { getMatchingVars } from './functions/getMatchingVars';
import { addHighlight, removeHighlight } from './functions/highlight';
import { groupVars } from './functions/groupVars';
import { extractPageVariables } from './functions/extractPageVariables';
import { filterMostSpecific } from './functions/getOnlyMostSpecific';
import {getLocalStorageNamespace, setLocalStorageNamespace} from './functions/getLocalStorageNamespace';
import {initializeConsumer} from './sourcemap';
import { getAllDefaultValues } from './functions/getAllDefaultValues';
import { deriveUtilitySelectors, parseCss } from './functions/parseCss';
import { toNode, toPath } from './functions/nodePath';
import { restoreHistory } from './_unstable/historyStore';
import { makeCourses } from './_unstable/courses';
import { setServerConfig } from './hooks/useServerThemes';
import { balancedVar } from './functions/balancedVar';
import { definedValues } from './functions/collectRuleVars';

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
let inspectedIndex = -1;
let lastInspected;
let lastInspectTime = 0;
let inspectedElements = [];
let lastGroups = [];

const groupElementsCache = new WeakMap();

function restoreInspections() {
  inspectedIndex = -1;
  inspectedElements = [];

  const prev = getPrevinspections();
  let i = 0;

  // 🐢🐢🐢
  for (const path of prev) {
    i++;
    let target;
    try {
      target = toNode(path);
    } catch (e) {
      console.log(e, path);
      break;
    }
    inspectedElements.push(target);
    lastInspected = target;
    ++inspectedIndex;
    if (!target) {
      console.log(inspectedIndex, path);
      continue;
    }
    const matchedVars = getMatchingVars({ cssVars, target });
    const rawGroups = groupVars(matchedVars, target, cssVars);
    const groups = filterMostSpecific(rawGroups, target);
    groupElementsCache.set(target, groups.map(({element}) => ({element})));

    lastGroups = groups;
    const withElementIndexes = groups.map((group, index) => ({...group, element: index}));

    window.parent.postMessage(
      {
        type: 'render-vars',
        payload: {
          groups: withElementIndexes,
          index: inspectedIndex,
        },
      },
      window.location.href
    );
  }

  lastInspected?.scrollIntoView({block: 'center'});
  window.parent.postMessage(
    {
      type: 'relocate-done',
      payload: {
        index: inspectedIndex,
      },
    },
    window.location.href
  );
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
  setServerConfig(config.serverThemes);
  // updateScopedVars(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'));
  setLocalStorageNamespace(config.localStorageNamespace || '');


  await dependencyReady;
  // 🐢
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

  if (!isRunningAsFrame) {
    // Quick fix because both frames are sending the same message.
    let didRestoreHistory = false;
    const editorRoot = document.createElement( 'div' );
    renderSelectedVars(editorRoot, null, [], cssVars, defaults, -1);
    destroyDoc();

    editorRoot.id = 'theme-editor-root';
    document.body.appendChild( editorRoot );

    window.addEventListener('message', event => {
      if (event.data?.type === 'render-vars') {
        const { payload } = event.data;
        renderSelectedVars(
          editorRoot,
          null,
          payload.groups,
          cssVars,
          defaults,
          payload.index,
          payload.inspectionPath,
        );
        return;
      }
      if (event.data?.type === 'relocate-done' && !didRestoreHistory) {
        restoreHistory();
        didRestoreHistory = true;
        renderSelectedVars(editorRoot, null, lastGroups, cssVars, defaults, event.data.payload.index, 'ignore')
      }
    }, false);
  }

  let requireAlt = !isRunningAsFrame || localStorage.getItem(getLocalStorageNamespace() + 'theme-editor-frame-click-behavior') === 'alt';

  const locatedElements = {};

  // Keep 1 timeout as we only want to be highlighting 1 element at a time.
  let lastHighlightTimeout = null;
  let ignoreScroll = false;
  let scrollDebounceTimeout = null;

  function furthest(element, selector) {
    let i = 0;
      let closest = element.closest(selector);

      while (closest?.parentNode) {
        i++;
        try {
          const parentClosest = closest.parentNode.closest(selector);
          if (parentClosest) {
            closest = parentClosest;
          } else {
            break;
          }
        } catch (e) {
          break;
        }
      }

      return closest;
    }

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

  function inspect(target) {
    // Laziest feature flag ever.
    if (window._testNewInspection) {
      inspectNew(target);
    }

    if (target === lastInspected) {
      return;
    }
    lastInspectTime = performance.now();
    ++inspectedIndex;
    lastInspected = target;

    inspectedElements.push(target);
    // This algorithm was created in a case with certain assumptions that made it more than fast enough.
    // - Not more than 4 or 5 custom props per selector on average.
    // - Not a lot of selectors per HTML element.
    // - Not a lot of properties on root elements (body and html).
    // Now that the goal is to support any CSS, I'm running into pages with CSS that is far enough
    // from these assumptions to make the performance not ideal and sometimes really poor.
    // Possibly the whole approach doesn't make sense as a general one, and overall the efficiency of 
    // just checking each element individually could be better.
    // Additionally, this approach makes it unavoidable that properties are only shown in the element nearest
    // to the root, even if they're also used deeper down. Though you can get used to that and will always find
    // everything.
    // console.time('old');
    // 🐢
    const matchedVars = getMatchingVars({ cssVars, target });
    const rawGroups = groupVars(matchedVars, target, cssVars);
    const groups = filterMostSpecific(rawGroups, target);
    groupElementsCache.set(target, groups.map(({element}) => ({element})));
    // console.timeEnd('old');
    // console.log('oldgroups', groups);

    // It's not possible to send a message that includes a reference to a DOM element. 
    // Instead, every time we update the groups, we store the last groups. This
    // way we still know which element to access when a message gets back from the parent window.
    lastGroups = groups;
    const withElementIndexes = groups.map((group, index) => ({...group, element: index}));

    const inspectionPath = toPath(target);

    // 🐢
    window.parent.postMessage(
      {
        type: 'render-vars',
        payload: {
          groups: withElementIndexes,
          index: inspectedIndex,
          inspectionPath,
        },
      },
      window.location.href
    );

    if (groups.length > 0) {
      const {element} = groups[0];
      element.scrollIntoView({
        block: 'nearest',
        inline: 'end',
        behavior: 'smooth',
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

      lastHighlightTimeout = [setTimeout(handler, 700), handler, element];    
    }
  }

  // Below are only listeners for messages sent from the parent frame.
  if (!isRunningAsFrame) {
    makeCourses();
    return;
  }

  restoreInspections();

  const preventDefault = e=>e.preventDefault();

  document.addEventListener('drop', event => {
    // console.log(event, event.dataTransfer, event.dataTransfer?.getData('varName'))
    const value = event.dataTransfer.getData('value') || event.dataTransfer.getData('text/plain');
    // If you drag any link or image and immediately drop it on the page, it will have a link here.
    // I didn't come across any valid custom prop value starting with "http".
    // URLs are always enclosed in "url()" in custom props.
    if (!value || value.startsWith('http') ) return
    const target = event.target;
    // 🐢
    const matchedVars = getMatchingVars({ cssVars, target });
    const rawGroups = groupVars(matchedVars, target, cssVars);
    const groups = filterMostSpecific(rawGroups, target);

    const options = [];

    let i = 0;
    for (const group of groups) {
      i++;
      const colorProps = ['background-color', 'background', 'background-image', 'color', 'border-color', 'outline-color']
      for (const prop of colorProps) {
        for (const v of group.vars) {
          if (v.maxSpecific?.property === prop && !v.isRawValue && v.usages[0]?.isFullProperty) {
            options.push({
              element: i,
              property: prop,
              varName: v.name,
              scope: group.scopes.find((s) =>
                s.scopeVars.some((sv) => sv.name === v.name)
              )?.selector,
            });
          }
        }
      }
    }
    window.parent.postMessage(
      {
        type: 'dropped-options',
        payload: { options, value },
      },
      window.location.href
    );
    event.stopPropagation();
  });

  document.addEventListener('dragenter', preventDefault);
  document.addEventListener('dragover', preventDefault);

  document.addEventListener('click', event => {
    const ignoreClick = requireAlt && !event.altKey;
    if (ignoreClick) {
      return;
    }
    event.preventDefault();
    inspect(event.target);
  }, {capture: true});

  const storedSheetConfig = localStorage.getItem(getLocalStorageNamespace() + 'set-disabled-sheets');

  if (storedSheetConfig) {
    const disabledSheets = JSON.parse(storedSheetConfig);
    toggleStylesheets(disabledSheets);
  }

  function restoreInspection(index) {
    const element = inspectedElements[index];
    setTimeout(() => {
      element.scrollIntoView({
        block: 'center',
        inline: 'end',
        // behavior: 'smooth',
      });
    }, 120);

    if (lastHighlightTimeout) {
      const [timeout, handler, timeoutElement] = lastHighlightTimeout;

      if (timeoutElement === element) {
        return;
      }
      window.clearTimeout(timeout);
      handler();
    }
    
    lastInspected = element;
    lastGroups = groupElementsCache.get(element);
    addHighlight(element);
    const handler = () => {
      removeHighlight(element);
      lastHighlightTimeout = null;
    };

    lastHighlightTimeout = [setTimeout(handler, 600), handler, element];    
  }

  let scrollListener;

  const messageListener = event => {
    const {type, payload} = event.data;
    const {index, selector, scopes, resetAll} = payload || {};
    const group = !lastGroups ? null : lastGroups[index];

    switch (type) {
    case 'highlight-element-start':
      group && addHighlight(group.element);
      break;

    case 'highlight-element-end':
      group && removeHighlight(group.element);
      break;

    case 'scroll-in-view':
      const element = selector ? locatedElements[selector][index] : group.element;

      element.scrollIntoView({
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

    case 'theme-edit-alt-click':
      requireAlt = payload.frameClickBehavior !== 'any';
      break;

    case 'set-sheet-config':
      toggleStylesheets(JSON.parse(payload));
      break;
    case 'locate-elements':
      const results = document.querySelectorAll(selector);
      locatedElements[selector] = [...results].filter(el => {
        return el.offsetParent !== null && window.getComputedStyle(el).visibility !== 'hidden';
      });
      window.parent.postMessage(
        {
          type: 'elements-located', payload: {
            selector,
            elements: locatedElements[selector].map((el, index) => ({
              index,
              tagName: `${el.tagName}`,
              id: `${el.id}`,
              className: `${el.className}`,
              isCurrentlyInspected: !!lastGroups && lastGroups.some(group => group.element === el),
            })),
          },
        },
        window.location.href,
      );
      break;
      case 'inspect-located':
        const toInspect = locatedElements[selector][index];
        if (toInspect) {
          inspect(toInspect);
          toInspect.scrollIntoView({
            // behavior: 'smooth',
            block: 'center',
            inline: 'end',
          });
        }
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
              scrollDebounceTimeout = setTimeout(notifyParent, 40);
            }
          }
          document.addEventListener('scroll', scrollListener, {passive: true})
        break;
      case 'inspect-previous': {
        // Because of some shaky effect code, it now immediately sends this after inspection.
        // Quick hack to ignore those.
        if (performance.now() - lastInspectTime < 500) return;

        restoreInspection(index);
        break;
      };
      case 'reload-inspections': {
        restoreInspections();
      }
    }
  };
  window.addEventListener('message', messageListener, false);
};

