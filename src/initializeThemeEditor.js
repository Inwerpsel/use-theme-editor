import { renderSelectedVars } from './renderSelectedVars';
import { getMatchingVars } from './getMatchingVars';
import { addHighlight, removeHighlight } from './highlight';
import { groupVars } from './groupVars';
import { extractPageVariables } from './extractPageVariables';
import { filterMostSpecific } from './getOnlyMostSpecific';
import {getLocalStorageNamespace} from './getLocalStorageNamespace';
import {initializeConsumer} from './sourcemap';

export const LOCAL_STORAGE_KEY = `${getLocalStorageNamespace()}p4-theme`;
export const LOCAL_STORAGE_PREVIEWS_KEY = `${getLocalStorageNamespace()}theme-with-previews`;

const isRunningAsFrame = window.self !== window.top;

const lastRead = {};

const dependencyReady = initializeConsumer();

const applyFromLocalStorage = (key) => {
  let storedVars;
  const json = localStorage.getItem( key );

  if (lastRead[key] === json) {
    return;
  }

  try {
    storedVars = JSON.parse(json);
  } catch (e) {
    console.log(json);
  }

  if (!storedVars) {
    return;
  }

  Object.keys(storedVars).forEach(name => {
    const value = storedVars[name];
    document.documentElement.style.setProperty(name, value);
  });

  const customProps = Object.entries(document.documentElement.style).filter(([, k]) => {
    return !!('string' === typeof k && k.match(/^--/));
  });

  customProps.forEach(([, k]) => {
    if (!Object.keys(storedVars).includes(k)) {
      document.documentElement.style.removeProperty(k);
    }
  });
  lastRead[key] = json;
};

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

  if (!isRunningAsFrame && localStorage.getItem(getLocalStorageNamespace() + 'responsive-on-load') === 'true') {
    document.documentElement.classList.add('hide-wp-admin-bar');
    renderSelectedVars(editorRoot, [], null, [], [], cssVars, config);
  }

  const customizeMenu = document.getElementById('wp-admin-bar-customize');

  if (customizeMenu) {
    const notice = document.createElement('span');
    notice.textContent = ' (using CSS)';
    notice.className = 'wp-customize-notice';

    customizeMenu.firstChild.appendChild(notice);

    const button = document.createElement('a');
    button.id = 'wp-customize-opener';
    button.onclick = () => {
      document.documentElement.classList.add('hide-wp-admin-bar');
      renderSelectedVars(editorRoot, [], null, [], [], cssVars, config);
    };
    button.textContent = 'Customize (using experimental theme editor)';
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

