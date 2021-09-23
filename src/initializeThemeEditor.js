import { renderSelectedVars } from './renderSelectedVars';
import { getMatchingVars } from './getMatchingVars';
import { DRAG_KEY, dragElement } from './dragElement';
import { addHighlight, removeHighlight } from './highlight';
import { groupVars } from './groupVars';
import { extractPageVariables } from './extractPageVariables';
import { filterMostSpecific } from './getOnlyMostSpecific';
import {getLocalStorageNamespace} from './getLocalStorageNamespace';

export const LOCAL_STORAGE_KEY = `${getLocalStorageNamespace()}p4-theme`;
export const LOCAL_STORAGE_PREVIEWS_KEY = `${getLocalStorageNamespace()}theme-with-previews`;

const isRunningAsFrame = window.self !== window.top;

const lastRead = {};

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
}

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

  // Quick way to make it work with WPML. In case of NL, which doesn't have WPML, it doesn't match because without
  // WPML there is no slash at the end...
  const editorRoot = document.createElement( 'div' );

  if (!isRunningAsFrame) {
    editorRoot.id = 'theme-editor-root';
    document.body.appendChild( editorRoot );
    dragElement( editorRoot );
    const storedLocation = localStorage.getItem(DRAG_KEY);
    if (/{.*}/.test(storedLocation)) {
      const {x, y} = JSON.parse(storedLocation);
      if (x) {
        const maxX = window.outerWidth - 300;
        editorRoot.style.left = `${Math.min(x, maxX)}px`;
      }
      if (y) {
        const maxY = window.outerHeight - 300;
        editorRoot.style.top = `${Math.min(y, maxY)}px`;
      }
    }
  }

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

  window.addEventListener('message', event => {
    const { type, payload } = event.data;
    if (type !== 'highlight-element-start') {
      return;
    }
    const group = lastGroups[payload.index];
    if (!group) {
      return;
    }
    addHighlight(group.element);
  }, false);

  window.addEventListener('message', event => {
    const { type, payload } = event.data;
    if (type !== 'highlight-element-end') {
      return;
    }
    const group = lastGroups[payload.index];
    if (!group) {
      return;
    }
    removeHighlight(group.element);
  }, false);

  window.addEventListener('message', event => {
    const { type, payload } = event.data;
    if (type !== 'scroll-in-view') {
      return;
    }
    const group = lastGroups[payload.index];
    if (!group) {
      return;
    }
    group.element.scrollIntoView({
      behavior: 'smooth',
      block:  'nearest',
      inline: 'end',
    });
  }, false);

  window.addEventListener('message', event => {
    const { type, payload } = event.data;
    if (type !== 'theme-edit-alt-click') {
      return;
    }
    requireAlt = payload.frameClickBehavior !== 'any';
  }, false);

  const storedSheetConfig = localStorage.getItem(getLocalStorageNamespace() + 'set-disabled-sheets');

  if (storedSheetConfig) {
    const disabledSheets = JSON.parse(storedSheetConfig);
    toggleStylesheets(disabledSheets);
  }

  window.addEventListener('message', event => {
    const {type, payload} = event.data;
    if (type !== 'set-sheet-config') {
      return;
    }

    console.log('Sheet config');

    const disabledSheets = JSON.parse(payload);
    toggleStylesheets(disabledSheets);
  }, false);
};

