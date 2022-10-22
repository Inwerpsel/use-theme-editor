import { renderSelectedVars } from './renderSelectedVars';
import { getMatchingVars } from './functions/getMatchingVars';
import { addHighlight, removeHighlight } from './functions/highlight';
import { groupVars } from './functions/groupVars';
import { extractPageVariables } from './functions/extractPageVariables';
import { filterMostSpecific } from './functions/getOnlyMostSpecific';
import {getLocalStorageNamespace, setLocalStorageNamespace} from './functions/getLocalStorageNamespace';
import {initializeConsumer} from './sourcemap';

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

let scopesStyleElement = scopesStyleElement = document.createElement('style');
document.head.appendChild(scopesStyleElement);

let ruleIndexes = {};

function toPropertyString(properties) {
    let propertyString = '';
    for (const prop in properties) {
      // Leading space on first is needed to match CSS formated by the browser.
      propertyString += ` ${prop}: ${properties[prop]};`
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

let destroyedDoc = false;
function destroyDoc() {
  [...document.body.childNodes].forEach(el => {
    if (el.id === 'theme-editor-root' || ['STYLE', 'LINK', 'SCRIPT', ].includes(el.nodeName)) {
      return;
    }
    document.body.removeChild(el);
  });
  destroyedDoc = true;
}


export const setupThemeEditor = async (config) => {
  setLocalStorageNamespace(config.localStorageNamespace || '');

  const editorRoot = document.createElement( 'div' );

  updateScopedVars(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'));

  if (!isRunningAsFrame) {
    editorRoot.id = 'theme-editor-root';
    document.body.appendChild( editorRoot );
  }

  await dependencyReady;
  const allVars = await extractPageVariables();
  const cssVars = allVars.reduce((cssVars, someVar) => [
    ...cssVars,
    ...(
      cssVars.some(v => v.name === someVar.name) ? [] : [{
        ...someVar,
        uniqueSelectors: [...new Set(someVar.usages.map(usage => usage.selector))],
      }]
    ),
  ], []);

  if (!isRunningAsFrame) {
    const renderEmptyEditor = () => {
      document.documentElement.classList.add('hide-wp-admin-bar');
      renderSelectedVars(editorRoot, [], null, [], [], cssVars, config);
      // Since the original page can be accessed with a refresh, destroy it to save resources.
      destroyDoc();
    };

    if (localStorage.getItem(getLocalStorageNamespace() + 'responsive-on-load') === 'true') {
      renderEmptyEditor();
    }

    const customizeMenu = document.getElementById('wp-admin-bar-customize');

    if (customizeMenu) {
      const button = document.createElement('a');
      button.textContent = 'Customize';
      button.className = 'ab-item fake-wp-button';
      button.onclick = () => {
        renderEmptyEditor();
      };
      customizeMenu.removeChild(customizeMenu.firstChild);
      customizeMenu.appendChild(button);
    }

  }

  let requireAlt = !isRunningAsFrame || localStorage.getItem(getLocalStorageNamespace() + 'theme-editor-frame-click-behavior') === 'alt';
  let lastGroups = [];

  window.addEventListener('message', event => {
    if (event.data.type === 'render-vars') {
      const { payload } = event.data;
      renderSelectedVars(editorRoot, payload.matchedVars, null, payload.groups, payload.rawGroups, cssVars, config);
    }
  }, false);

  function inspect(target) {
    const matchedVars = getMatchingVars({ cssVars, target });

    const rawGroups = groupVars(matchedVars, target);

    const groups = filterMostSpecific(rawGroups, target);

    if (!isRunningAsFrame) {
      renderSelectedVars(
        editorRoot,
        matchedVars,
        target,
        groups,
        rawGroups,
        cssVars,
        config
      );
    } else {
      // It's not possible to send a message that includes a reference to a DOM element. 
      // Instead, every time we update the groups, we store the last groups. This
      // way we still know which element to access when a message gets back from the parent window.
      lastGroups = groups;
      const withElementIndexes = groups.map((group, index) => ({...group, element: index}));
      const rawWithElementIndexes = rawGroups.map((group, index) => ({...group, element: index}));

      window.parent.postMessage(
        {
          type: 'render-vars',
          payload: {
            matchedVars,
            groups: withElementIndexes,
            rawGroups: rawWithElementIndexes,
          },
        },
        window.location.href
      );
    }
    if (groups.length > 0) {
      addHighlight(groups[0].element);
      setTimeout(() => removeHighlight(groups[0].element), 700);
    }
  }

  document.addEventListener('click', event => {
    const ignoreClick = requireAlt && !event.altKey;
    if (ignoreClick) {
      return;
    }
    event.preventDefault();

    // document.documentElement.classList.add('hide-wp-admin-bar');

    inspect(event.target);
  });

  // Below are only listeners for messages sent from the parent frame.
  if (!isRunningAsFrame) {
    return;
  }

  const storedSheetConfig = localStorage.getItem(getLocalStorageNamespace() + 'set-disabled-sheets');

  // This intentionally only runs on the frame.
  // If this would go wrong in the main window,
  // it might not be possible for a user to reach the settings to fix it.
  if (storedSheetConfig) {
    const disabledSheets = JSON.parse(storedSheetConfig);
    toggleStylesheets(disabledSheets);
  }

  const locatedElements = {};

  // Keep 1 timeout as we only want to be highlighting 1 element at a time.
  let lastHighlightTimeout = null;

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

      // Quick and dirty way to allow showing an element in the editor by assigning stuff to the ref.
      let parent = element;
      while (parent) {
        parent = parent.parentNode;
        if (parent && typeof parent.emerge === 'function') {
          parent.emerge();
        }
      }

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
    }
  };
  window.addEventListener('message', messageListener, false);
};

