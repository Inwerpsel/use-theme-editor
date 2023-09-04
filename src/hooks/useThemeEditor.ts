import { useEffect } from 'react';
import {LOCAL_STORAGE_KEY} from '../initializeThemeEditor';
import {reducerOf} from '../functions/reducerOf';
import { useResumableReducer } from './useResumableReducer';
import { definedValues } from '../functions/collectRuleVars';

// const PROP_REGEX = /\w+(-\w+)*$/;
export const PSEUDO_REGEX = /--?(active|focus|visited|hover|disabled)--?/;

const sortObject = o => Object.keys(o).sort().reduce((sorted, k) => {
  sorted[k] = typeof o[k] === 'object' ? sortObject(o[k]): o[k];
  return sorted;
}, {});

const DEFAULT_STATE = {
  scopes: {},
  // previewProps: {},
  // previewPseudoVars: {},
  // changeRequiresReset: false,
};

// For some reason, updates using only `:root` resulted in more than double the amount
// of elements reported by Chrome in the style recalculation, compared to using `html`.
// Weird as both selectors target the same element, which should be only the root element.
// However `:root` is more specific, so it's needed to win over source declarations and
// we can't just use `html`. Using both still has the lower number of recalculations and fixes that.
// Not sure where this number is coming from. The recalc does actually take longer, though not
// by the same factor. 24ms vs 18ms on a quite complex page.
export const ROOT_SCOPE = ':root';

type Handler = (state: typeof DEFAULT_STATE, action: { [index: string]: any }) => typeof DEFAULT_STATE;

export const ACTIONS = {
  set: (state, { name, value, scope = ROOT_SCOPE }) => {
    const {
      scopes,
    } = state;

    if (name === '') {
      return state;
    }

    const {...newScopes} = scopes;
    newScopes[scope] = { ...(scopes[scope] || {}), [name]: value }; 

    return {
      ...state,
      // changeRequiresReset : false,
      scopes: newScopes,
    };
  },
  unset: (state, { name, scope = ROOT_SCOPE }) => {
    const { scopes } = state;

    if (!(name in scopes[scope])) {
      return state;
    }

    const {[scope]: old} = scopes;

    // Apply updates the first time they are read.
    const {
      [name]: oldValue,
      ...others
    } = old;

    return {
      ...state,
      // changeRequiresReset : false,
      scopes: {
        ...scopes,
        [scope]: others,
      },
    };
  },
  createAlias(state, {name: origName, value}) {

    let name = `--${origName.replaceAll(' ', '-')}`;
    let i = 0;
    function scopeUsesForOther(vars) {
        return vars.hasOwnProperty(name) && vars[name] !== value;
    }

    function nameUsedForOtherValue() {
      const usedInSource = Object.values(definedValues).some(scopeUsesForOther);

      return usedInSource || Object.values(state.scopes).some(scopeUsesForOther);
    }

    while (nameUsedForOtherValue()) {
      i++;
      name = `--${origName.replaceAll(' ', '-')}-${i}`;
    }

    const newVarString = `var(${name})`;
    const newScopes = {};

    let hasRoot = false;
    for (const selector of Object.keys(definedValues)) {
      for (const [k, v] of Object.entries(definedValues[selector])) {
        if (v === value) {
          if (!newScopes.hasOwnProperty(selector)) {
            newScopes[selector] = {}
          }
          newScopes[selector][k] = newVarString;
        }
      }
    }

    for (const selector in state.scopes) {
      if (!newScopes[selector]) {
        newScopes[selector] = {};
      }
      const scopeVars = state.scopes[selector];

      for (const varName in scopeVars) {
        const isSameValue = scopeVars[varName] === value;
        newScopes[selector][varName] = isSameValue
          ? newVarString
          : scopeVars[varName];
      }

      if (selector === ROOT_SCOPE) {
        newScopes[selector][name] = value;
        hasRoot = true;
      }
    }

    if (!hasRoot) {
      if (!newScopes[ROOT_SCOPE]) {
        newScopes[ROOT_SCOPE] = {};
      }
      newScopes[ROOT_SCOPE][name] = value;
    }

    return {
      ...state,
      scopes: newScopes,
    }
  },

  // The code below was partially coupled to a naming scheme.
  // This made it less reusable, I want to ideally find another way to achieve
  // similar functionality just using selectors. Perhaps supporting multiple naming schemes is an option too.
  // Commented out because it doesn't work with scoped properties.

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
  loadTheme: (state, { theme = {} }) => {
    const isNewTheme = 'scopes' in theme;

    return {
      ...state,
      scopes: isNewTheme ? theme.scopes : {
        [ROOT_SCOPE]: theme,
      },
      // changeRequiresReset : true,
    };
  },
};

const reducer = reducerOf(ACTIONS);

function loadFromStorage(s) {
  return {
    ...s,
    scopes: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'),
  }
}

export const useThemeEditor = ({ initialState = DEFAULT_STATE}) => {
  const [{ scopes  }, dispatch] =
    useResumableReducer(
      reducer,
      initialState,
      loadFromStorage,
      'THEME_EDITOR'
    );

  useEffect(() => {
    const sorted = sortObject(scopes);
    const themeJson = JSON.stringify(sorted);
    localStorage.setItem(LOCAL_STORAGE_KEY, themeJson);
  }, [scopes]);

  return [
    {
      scopes,
      // changeRequiresReset,
    },
    dispatch,
  ];
};
