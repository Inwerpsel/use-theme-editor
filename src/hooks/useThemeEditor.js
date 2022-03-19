import { useReducer, useEffect } from 'react';
import {LOCAL_STORAGE_KEY, LOCAL_STORAGE_PREVIEWS_KEY} from '../initializeThemeEditor';
import {applyPseudoPreviews} from '../applyPseudoPreviews';
import {getAllDefaultValues} from '../getAllDefaultValues';
import {reducerOf} from '../functions/reducerOf';

const PROP_REGEX = /\w+(-\w+)*$/;
export const PSEUDO_REGEX = /--?(active|focus|visited|hover|disabled)--?/;

const write = (prop, value) => {
  document.documentElement.style.setProperty(prop, value);
};
const unset = prop => {
  return document.documentElement.style.removeProperty(prop);
};

// Slice to preserve up to 1001 last entries to have some upper limit.
const pushHistory = (history, entry) => [entry, ...history.slice(-1000)];

const sortObject = o => Object.keys(o).sort().reduce((sorted, k) => {
  sorted[k] = o[k];
  return sorted;
}, {});

// I created these as an optimization, but not sure if it's really needed or even improving things.
const lastWritten = {};
const keysToRemove = {};

const DEFAULT_STATE = {
  theme: {},
  history: [],
  future: [],
  defaultValues: {},
  previewProps: {},
  previewPseudoVars: {},
  lastSet: {},
};

const dropProps = (fromState, toState, previewProps, previewPseudoVars) => {
  return Object.keys(fromState).filter(k => {
    if (Object.keys(previewProps).includes(k)) {
      return false;
    }

    if (Object.keys(previewPseudoVars).some(pseudo => k.includes(pseudo))) {
      return false;
    }

    return !Object.keys(toState).includes(k);
  }).forEach(k => keysToRemove[k] = true);
};

export const THEME_ACTIONS = {
  SET: (state, { name, value }) => {
    const { theme } = state;
    if (name === '' || theme[name] === value) {
      return state;
    }

    // Only add a history entry if the same property wasn't set in the last 700ms.
    const shouldAddHistory = !state.lastSet[name] || performance.now() - state.lastSet[name] > 700;

    return {
      ...state,
      theme: { ...theme, [name]: value },
      history: !shouldAddHistory ? state.history : pushHistory(state.history, state.theme),
      future: [],
      lastSet: { ...state.lastSet, [name]: performance.now(), }
    };
  },
  UNSET: (state, { name }) => {
    if (!(name in state.theme)) {
      return state;
    }
    keysToRemove[name] = true;

    const {
      [name]: oldValue,
      ...others
    } = state.theme;

    return {
      ...state,
      theme: others,
      history: pushHistory(state.history, state.theme),
      future: [],
    };
  },
  START_PREVIEW: (state, { name, value }) => {
    return {
      ...state,
      previewProps: {
        ...state.previewProps,
        [name]: value,
      }
    };
  },
  END_PREVIEW: (state, { name }) => {
    const {
      [name]: previewedValue,
      ...otherProps
    } = state.previewProps;

    if (
      !(name in state.theme)
      && !Object.keys(state.previewPseudoVars).map(s => s.replace(PSEUDO_REGEX, '--')).includes(name)) {
      keysToRemove[name] = true;
    }
    return {
      ...state,
      previewProps: { ...otherProps },
    };
  },
  START_PREVIEW_PSEUDO_STATE: (state, { name }) => {
    const element = name.replace(PSEUDO_REGEX, '--').replace(/\w+(-\w+)*$/, '');

    const pseudoState = (name.match(PSEUDO_REGEX) || [null])[0];

    return {
      ...state,
      previewPseudoVars: {
        ...state.previewPseudoVars,
        [element]: pseudoState,
      },
    };
  },
  END_PREVIEW_PSEUDO_STATE: (state, { name }) => {
    const elementToEnd = name.replace(PSEUDO_REGEX, '--').replace(PROP_REGEX, '');

    const {
      [elementToEnd]: discard,
      ...otherPseudos
    } = state.previewPseudoVars;

    Object.keys(state.defaultValues).forEach(k => {
      const withoutElement = k.replace(elementToEnd, '');

      if (withoutElement.replace(PROP_REGEX, '') !== '') {
        return;
      }

      if (!(k in state.theme)) {
        keysToRemove[k] = true;
      }
      // Unset the regular property so that it gets set again.
      lastWritten[k] = null;
    });

    return {
      ...state,
      previewPseudoVars: otherPseudos,
    };
  },
  HISTORY_BACKWARD: (state) => {
    const { theme, history, future, previewProps, previewPseudoVars } = state;

    if (history.length === 0) {
      return state;
    }
    const [prevTheme, ...older] = history;
    dropProps(theme, prevTheme, previewProps, previewPseudoVars);

    return {
      ...state,
      theme: prevTheme,
      history: older,
      future: [
        theme,
        ...future,
      ],
    };
  },
  HISTORY_FORWARD: (state) => {
    const { theme, history, future, previewProps, previewPseudoVars } = state;
    if (future.length === 0) {
      return state;
    }

    const [nextTheme, ...newer] = future;
    dropProps(theme, nextTheme, previewProps, previewPseudoVars);

    return {
      ...state,
      theme: nextTheme,
      future: newer,
      history: [
        theme,
        ...history
      ]
    };
  },
  LOAD_THEME: ({ defaultValues, history, theme: oldTheme }, { theme }) => {
    dropProps(oldTheme, theme, {}, {});
    Object.keys(lastWritten).forEach(k => lastWritten[k] = null);
    Object.keys(theme).forEach(k => keysToRemove[k] = true);

    return {
      ...DEFAULT_STATE,
      defaultValues,
      theme,
      history: pushHistory(history,oldTheme),
    };
  }
};

const reducer = reducerOf(THEME_ACTIONS);

const writeNewValues = theme => {
  Object.keys(theme).forEach((k) => {
    // This will work as long as nothing else is setting the same properties. Perhaps there's no cost to setting
    // properties to the same value and this can be simplified?
    if (lastWritten[k] === theme[k]) {
      return;
    }

    write(k, theme[k]);
    lastWritten[k] = theme[k];
  });
};

const processRemovals = (defaultValues) => {
  Object.keys(keysToRemove).forEach(k => {
    if (defaultValues[k]) {
      write(k, defaultValues[k]);
      lastWritten[k] = defaultValues[k];
    } else {
      unset(k);
      delete lastWritten[k];
    }
    delete keysToRemove[k];
  });
};

export const useThemeEditor = (
  {
    initialState = DEFAULT_STATE,
    // baseTheme = null,
    allVars,
  }) => {
  // Read
  const [{
    theme,
    defaultValues,
    previewProps,
    previewPseudoVars,
    history,
    future,
  }, dispatch] = useReducer(reducer, initialState, s => ({
    ...s,
    defaultValues: getAllDefaultValues(allVars),
    theme: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'),
  }));

  const resolvedValues = {
    ...theme,
    ...previewProps,
  };

  const withPseudoPreviews = previewPseudoVars.length === 0
    ? resolvedValues
    : applyPseudoPreviews(defaultValues, resolvedValues, previewPseudoVars);

  const serialized = JSON.stringify(withPseudoPreviews);

  useEffect(() => {
    processRemovals(defaultValues);
    writeNewValues(withPseudoPreviews);
    localStorage.setItem(LOCAL_STORAGE_PREVIEWS_KEY, serialized);
  }, [serialized]);

  const sorted = sortObject(theme);

  const themeJson = JSON.stringify(sorted);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, themeJson);
  }, [themeJson]);

  return [
    {
      theme,
      defaultValues,
      history,
      future,
    },
    dispatch,
  ];
};
