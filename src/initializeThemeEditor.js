import { renderSelectedVars } from './renderSelectedVars';
import { getMatchingVars } from './functions/getMatchingVars';
import { addHighlight, removeHighlight } from './functions/highlight';
import { groupVars } from './functions/groupVars';
import { extractPageVariables } from './functions/extractPageVariables';
import { filterMostSpecific } from './functions/getOnlyMostSpecific';
import {getLocalStorageNamespace, setLocalStorageNamespace} from './functions/getLocalStorageNamespace';
import {initializeConsumer} from './sourcemap';
import {applyFromLocalStorage} from './functions/applyFromLocalStorage';

export const LOCAL_STORAGE_KEY = `${getLocalStorageNamespace()}p4-theme`;
export const LOCAL_STORAGE_PREVIEWS_KEY = `${getLocalStorageNamespace()}theme-with-previews`;

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

export const setupThemeEditor = async (config) => {
  setLocalStorageNamespace(config.localStorageNamespace);
  applyFromLocalStorage(LOCAL_STORAGE_KEY);

  if (isRunningAsFrame) {
    document.documentElement.classList.add('simulating-touch-device');
    document.documentElement.classList.add('hide-wp-admin-bar');
    const refreshLoop = () => {
      applyFromLocalStorage(LOCAL_STORAGE_PREVIEWS_KEY);
    };
    const fps = 60;
    setInterval(refreshLoop, 1000 / fps);
  }

  const editorRoot = document.createElement( 'div' );

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

  let requireAlt = !isRunningAsFrame || localStorage.getItem(getLocalStorageNamespace() + 'theme-editor-frame-click-behavior') === 'alt';
  let lastGroups = [];

  window.addEventListener('message', event => {
    const { type, payload } = event.data;
    if (type !== 'render-vars') {
      return;
    }
    renderSelectedVars(editorRoot, payload.matchedVars, null, payload.groups, payload.rawGroups, cssVars, config);

  }, false);

  const renderEmptyEditor = () => {
    document.documentElement.classList.add('hide-wp-admin-bar');
    renderSelectedVars(editorRoot, [], null, [], [], cssVars, config);
  };

  if (!isRunningAsFrame && localStorage.getItem(getLocalStorageNamespace() + 'responsive-on-load') === 'true') {
    renderEmptyEditor();
  }

  const customizeMenu = document.getElementById('wp-admin-bar-customize');

  if (customizeMenu) {
    customizeMenu.removeChild(customizeMenu.firstChild);

    const button = document.createElement('a');
    button.onclick = () => {
      renderEmptyEditor();
    };
    button.textContent = 'Customize';
    button.className = 'ab-item';
    customizeMenu.appendChild(button);
  }

  document.addEventListener('click', async event => {
    if (!event.altKey && requireAlt && !event.target.classList.contains('opens-theme-editor')) {
      return;
    }

    document.documentElement.classList.add('hide-wp-admin-bar');
    event.preventDefault();

    const matchedVars = await getMatchingVars({ cssVars, target: event.target });

    const rawGroups = await groupVars(matchedVars, event.target);

    const groups = await filterMostSpecific(rawGroups, event.target);

    if (!isRunningAsFrame) {
      renderSelectedVars(editorRoot, matchedVars, event.target, groups, rawGroups, cssVars, config);
    } else {
      // It's not possible to sent a message including a reference to a DOM element to the parent window. Doing so
      // results in an error. Instead, every time we update the shown groups, we keep track of the last groups. This
      // way we still know which element to access when a message gets back from the parent window.
      lastGroups = groups;
      const withElementIndexes = groups.map((group, index) => ({...group, element: index}));
      const rawWithElementIndexes = rawGroups.map((group, index) => ({...group, element: index}));

      window.parent.postMessage(
        {
          type: 'render-vars', payload: {
            matchedVars,
            groups: withElementIndexes,
            rawGroups: rawWithElementIndexes,
          }
        },
        window.location.href,
      );
    }

    addHighlight(event.target);
    setTimeout(() => removeHighlight(event.target), 700);
  });

  // Below are only listeners for messages sent from the parent frame.
  if (!isRunningAsFrame) {
    return;
  }

  const storedSheetConfig = localStorage.getItem(getLocalStorageNamespace() + 'set-disabled-sheets');

  if (storedSheetConfig) {
    const disabledSheets = JSON.parse(storedSheetConfig);
    toggleStylesheets(disabledSheets);
  }

  window.addEventListener('message', event => {
    const { type, payload } = event.data;
    const group = lastGroups[payload.index];

    switch (type) {
    case 'highlight-element-start':
      group && addHighlight(group.element);
      break;
    case 'highlight-element-end':
      group && removeHighlight(group.element);
      break;
    case 'scroll-in-view':
      group && group.element.scrollIntoView({
        behavior: 'smooth',
        block:  'nearest',
        inline: 'end',
      });
      break;
    case 'theme-edit-alt-click':
      requireAlt = payload.frameClickBehavior !== 'any';
      break;
    case 'set-sheet-config':
      toggleStylesheets(JSON.parse(payload));
      break;
    }
  }, false);
};

