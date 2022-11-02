import { useEffect } from 'react';
import {LOCAL_STORAGE_KEY} from '../initializeThemeEditor';
import {applyPseudoPreviews} from '../functions/applyPseudoPreviews';
import {getAllDefaultValues} from '../functions/getAllDefaultValues';
import {reducerOf} from '../functions/reducerOf';
import { useResumableReducer } from './useResumableReducer';

const PROP_REGEX = /\w+(-\w+)*$/;
export const PSEUDO_REGEX = /--?(active|focus|visited|hover|disabled)--?/;

// Slice to preserve up to 1001 last entries to have some upper limit.
// const pushHistory = (history, entry) => [entry, ...history.slice(-1000)];

const sortObject = o => Object.keys(o).sort().reduce((sorted, k) => {
  sorted[k] = typeof o[k] === 'object' ? sortObject(o[k]): o[k];
  return sorted;
}, {});

const DEFAULT_STATE = {
  scopes: {},
  defaultValues: {},
  lastRemoved: [],
  previewProps: {},
  previewPseudoVars: {},
  changeRequiresReset: false,
};

// For some reason, updates using only `:root` resulted in more than double the amount
// of elements reported by Chrome in the style recalculation, compared to using `html`.
// Weird as both selectors target the same element, which should be only the root element.
// However `:root` is more specific, so it's needed to win over source declarations and
// we can't just use `html`. Using both still has the lower number of recalculations and fixes that.
// Not sure where this number is coming from. The recalc does actually take longer, though not
// by the same factor. 24ms vs 18ms on a quite complex page.
export const ROOT_SCOPE = 'html:root';

export const ACTIONS = {
  set: (state, { name, value, scope = ROOT_SCOPE }) => {
    const {
      scopes,
    } = state;

    if (name === '') {
      return state;
    }


    const {[scope]: old, ...otherScopes} = scopes;
    const newTheme = { ...old, [name]: value };

    return {
      ...state,
      // lastSet: { ...state.lastSet, [name]: performance.now(), },
      changeRequiresReset : false,
      scopes: {
        [scope]: newTheme,
        ...otherScopes,
      },
    };
  },
  unset: (state, { name, scope = ROOT_SCOPE }) => {
    const { scopes } = state;

    if (!(name in scopes[scope])) {
      return state;
    }

    const {[scope]: old, ...otherScopes} = scopes;

    // Apply updates the first time they are read.
    const {
      [name]: oldValue,
      ...others
    } = old;

    return {
      ...state,
      lastRemoved: [{name, scope}],
      changeRequiresReset : false,
      scopes: {
        [scope]: others,
        ...otherScopes
      },
    };
  },
//  startPreview: (state, { name, value }) => {
//     return {
//       ...state,
//       previewProps: {
//         ...state.previewProps,
//         [name]: value,
//       }
//     };
//   },
//   endPreview: (state, { name }) => {
//     const {
//       [name]: previewedValue,
//       ...otherProps
//     } = state.previewProps;

//     if (
//       !(name in state.theme)
//       && !Object.keys(state.previewPseudoVars).some(s => s.replace(PSEUDO_REGEX, '--') === name)
//     ) {
//       keysToRemove.push(name)
//     }
//     return {
//       ...state,
//       previewProps: { ...otherProps },
//     };
//   },
//   startPreviewPseudoState: (state, { name }) => {
//     const element = name.replace(PSEUDO_REGEX, '--').replace(/\w+(-\w+)*$/, '');

//     const pseudoState = (name.match(PSEUDO_REGEX) || [null])[0];

//     return {
//       ...state,
//       previewPseudoVars: {
//         ...state.previewPseudoVars,
//         [element]: pseudoState,
//       },
//     };
//   },
//   endPreviewPseudoState: (state, { name }) => {
//     const elementToEnd = name.replace(PSEUDO_REGEX, '--').replace(PROP_REGEX, '');

//     const {
//       [elementToEnd]: discard,
//       ...otherPseudos
//     } = state.previewPseudoVars;

//     Object.keys(state.defaultValues).forEach(k => {
//       const withoutElement = k.replace(elementToEnd, '');

//       if (withoutElement.replace(PROP_REGEX, '') !== '') {
//         return;
//       }

//       if (!(k in state.theme)) {
//         keysToRemove.push(k);
//       }
//       // Unset the regular property so that it gets set again.
//       lastWritten[k] = null;
//     });

//     return {
//       ...state,
//       previewPseudoVars: otherPseudos,
//     };
//   },
  loadTheme: ({ defaultValues, scopes: oldScopes }, { theme = {} }) => {
    const isNewTheme = 'scopes' in theme;

    return {
      ...DEFAULT_STATE,
      defaultValues,
      scopes: isNewTheme ? theme.scopes : {
        [ROOT_SCOPE]: theme,
        // ...otherScopes,
      },
      changeRequiresReset : true,
    };
  },
};

const reducer = reducerOf(ACTIONS);

export const useThemeEditor = ({ initialState = DEFAULT_STATE, allVars }) => {
  const [{ defaultValues, scopes, changeRequiresReset }, dispatch] =
    useResumableReducer(
      reducer,
      initialState,
      (s) => ({
        ...s,
        defaultValues: getAllDefaultValues(allVars),
        scopes: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'),
      }),
      'THEME_EDITOR'
    );

  const sorted = sortObject(scopes);

  const themeJson = JSON.stringify(sorted);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, themeJson);
  }, [themeJson]);

  return [
    {
      defaultValues,
      scopes,
      changeRequiresReset,
    },
    dispatch,
  ];
};
