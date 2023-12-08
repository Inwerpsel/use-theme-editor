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
  const cssText = `${selector} {${toPropertyString(properties, ruleIndexes[selector])} }`;

  if (!(selector in ruleIndexes)) {
    // New rule
    ruleIndexes[selector] = scopesStyleElement.sheet.insertRule(cssText, Object.keys(ruleIndexes).length);
    return;
  }

  if (scopesStyleElement.sheet.cssRules[ruleIndexes[selector]].cssText === cssText) {
    // Nothing to update.
    return;
  }
  // Add new rule.
  scopesStyleElement.sheet.insertRule(cssText, ruleIndexes[selector]);
  // Remove previous, thereby restoring precarious order.
  scopesStyleElement.sheet.deleteRule(ruleIndexes[selector] + 1)
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

export const setupThemeEditor = async (config) => {
  updateScopedVars(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'));
  setLocalStorageNamespace(config.localStorageNamespace || '');


  await dependencyReady;
  const cssVars = await extractPageVariables();
  const defaultValues = getAllDefaultValues(cssVars);

  const sheets = [...document.styleSheets].filter(s=>s.ownerNode?.id!==styleId);

  console.time('new')
  for (const sheet of sheets) {
    let text;
    if (sheet.href) {
      text = (await (await fetch(sheet.href)).text());
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
    const editorRoot = document.createElement( 'div' );
    if (localStorage.getItem(getLocalStorageNamespace() + 'responsive-on-load') !== 'false') {
      renderSelectedVars(editorRoot, null, [], cssVars, config, defaultValues, -1);
      // Since the original page can be accessed with a refresh, destroy it to save resources.
      destroyDoc();
    }

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
          config,
          defaultValues,
          payload.index
        );
      }
    }, false);
  }

  let requireAlt = !isRunningAsFrame || localStorage.getItem(getLocalStorageNamespace() + 'theme-editor-frame-click-behavior') === 'alt';
  let inspectedIndex = -1;
  let inspectedElements = [];
  let lastGroups = [];

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

    const mappedRules = selectorRules.reduce((groups,r) => {
      const matches = [...r.testSelectors].filter(s => s.lastEl).map(s=>s.lastEl);
      if (matches.length > 1) {
        // Will solve later.
        console.log('rule has multiple matches', r, matches)
      }

      if (matches.length === 1) {
        const el = matches[0];
        let group = groups.get(el);
        if (!group) {
          group = [];
          groups.set(el, group)
        }
        group.push(r);
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

  function inspect(targetOrIndex) {
    const isPrevious = typeof targetOrIndex === 'number';
    const target = isPrevious ? inspectedElements[targetOrIndex] : targetOrIndex;

    // Laziest feature flag ever.
    if (window._testNewInspection) {
      inspectNew(target);
    }

    if (!isPrevious) {
      inspectedElements.push(target);
      ++inspectedIndex
    } else {
      target.scrollIntoView({
        block: 'center',
        inline: 'end',
        behavior: 'smooth'});
    }
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
    const matchedVars = getMatchingVars({ cssVars, target });
    const rawGroups = groupVars(matchedVars, target, cssVars);
    const groups = filterMostSpecific(rawGroups, target);
    // console.timeEnd('old');
    // console.log('oldgroups', groups);

    const currentInspectedIndex = isPrevious ? targetOrIndex : inspectedIndex;

    // It's not possible to send a message that includes a reference to a DOM element. 
    // Instead, every time we update the groups, we store the last groups. This
    // way we still know which element to access when a message gets back from the parent window.
    lastGroups = groups;
    const withElementIndexes = groups.map((group, index) => ({...group, element: index}));

    window.parent.postMessage(
      {
        type: 'render-vars',
        payload: {
          groups: withElementIndexes,
          index: currentInspectedIndex,
        },
      },
      window.location.href
    );

    if (groups.length > 0) {
      const {element} = groups[0];
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

      lastHighlightTimeout = [setTimeout(handler, isPrevious ? 2400 : 700), handler, element];    
    }
  }

  // Below are only listeners for messages sent from the parent frame.
  if (!isRunningAsFrame) {
    return;
  }

  const preventDefault = e=>e.preventDefault();

  document.addEventListener('drop', event => {
    // console.log(event, event.dataTransfer, event.dataTransfer?.getData('varName'))
    const value = event.dataTransfer.getData('value') || event.dataTransfer.getData('text/plain');
    // If you drag any link or image and immediately drop it on the page, it will have a link here.
    // I didn't come across any valid custom prop value starting with "http".
    // URLs are always enclosed in "url()" in custom props.
    if (!value || value.startsWith('http') ) return
    const target = event.target
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

  // This intentionally only runs on the frame.
  // If this would go wrong in the main window,
  // it might not be possible for a user to reach the settings to fix it.
  if (storedSheetConfig) {
    const disabledSheets = JSON.parse(storedSheetConfig);
    toggleStylesheets(disabledSheets);
  }

  const messageListener = event => {
    const {type, payload} = event.data;
    const {index, selector, scopes, resetAll} = payload || {};
    const group = lastGroups[index];

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
            behavior: 'smooth',
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
        document.addEventListener('scroll', () => {
          if (ignoreScroll) {
            return;
          }
          if (!scrollDebounceTimeout) {
            scrollDebounceTimeout = setTimeout(notifyParent, 40);
          }
        }, {passive: true})
        window.parent.postMessage(
          {
            type: 'window-height',
            payload: Math.max(
              document.body.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.clientHeight,
              document.documentElement.scrollHeight,
              document.documentElement.offsetHeight
            ),
          },
          window.location.href
        );
        break;
      case 'inspect-previous': 
        inspect(index);
    }
  };
  window.addEventListener('message', messageListener, false);
};

