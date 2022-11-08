import React, { useState } from 'react';
import { useSyncExternalStore } from 'react';
import { createContext, useCallback, useLayoutEffect, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { hotkeysOptions } from '../components/ThemeEditor';
import { useId } from './useId';

export const SharedHistoryContext = createContext({});

export const HistoryNavigateContext = createContext({});

const emptyState = {};

const INITIAL_STATE = {
  currentId: null,
  lastActions: {
    HISTORY: {
      type: 'INIT',
      payload: {},
    },
  },
  lastSet: 0,
  historyStack: [],
  historyOffset: 0,
  reducers: {},
  states: {},
  oldStates: emptyState,
  initialStates: {},
  // direction: 'forward',
};

function historyReducer(state, action) {
  const { states,  historyStack, historyOffset } = state;
  const {
    payload: { id, reducer, initialState, amount = 1 } = {},
  } = action;

  switch (action.type) {
    case 'ADD_REDUCER': {
      // No changes needed to add a second reducer with the same key.
      // These are assumed to be unique.
      if (id in states) {
        return state;
      };

      return {
        ...state,
        states: {
          ...states,
          [id]: initialState,
        },
        reducers: {
          ...state.reducers,
          [id]: reducer,
        },
        initialStates: {
          ...state.initialStates,
          [id]: initialState,
        },
      };
    }
    case 'REMOVE_REDUCER': {
      const { [id]: old, ...otherReducers } = state.reducers;

      return {
        ...state,
        reducers: otherReducers,
      };
    }
    case 'HISTORY_BACKWARD': {
      if (historyStack.length - historyOffset < 1) {
        return state;
      }

      const oldIndex = historyStack.length - 1 * historyOffset;

      const oldStates =
        historyOffset === 0
          ? states
          : historyStack[oldIndex].states;

      return {
        ...state,
        oldStates,
        historyOffset: historyOffset + amount,
        // direction: 'backward',
     };
    }
    case 'HISTORY_FORWARD': {
      if (historyOffset === 0) {
        return state;
      }
      const newOffset = Math.max(0, historyOffset - amount);

      return {
        ...state,
        historyOffset: newOffset,
        oldStates: historyStack[historyStack.length - historyOffset],
        // direction: 'forward',
     };
    }
    case 'CLEAR_HISTORY': {
      const currentlyInThePast = historyOffset > 0;
      const baseStates = !currentlyInThePast ? states :  historyStack[historyStack.length - historyOffset].states;
      const lastActions = !currentlyInThePast ? state.lastActions : historyStack[historyStack.length - historyOffset].lastActions;

      return {
        ...state,
        historyStack: [],
        historyOffset: 0,
        states: baseStates,
        lastActions,
        // direction: 'forward'
      };
    }
    case 'PERFORM_ACTION': {
      const forwardedReducer = state.reducers[id];
      if (!forwardedReducer) {
        return state;
      }

      const currentlyInThePast = historyOffset > 0;
      const baseIndex = historyStack.length - historyOffset;
      const baseStates = !currentlyInThePast
        ? states
        : historyStack[baseIndex].states;
      const {lastActions} = !currentlyInThePast ? state : historyStack[baseIndex];

      const performedAction = action.payload.action;
      const newState = forwardedReducer(
        id in baseStates ? baseStates[id] : state.initialStates[id],
        performedAction
      );
      // const isNowDefaultState = newState === state.initialStates[id];
      // const previousAlsoDefaultState = isNowDefaultState && baseIndex && !(id in historyStack[baseIndex - 1].states);
      // const {[id]: _, ...otherStates} = !isNowDefaultState ? {} : baseStates;

      const now = performance.now();
      const slowEnough =
        !state.lastSet || now - state.lastSet > 500;
      const skipHistory = !slowEnough || action.options.skipHistory;
      const skippedHistoryNowSameAsPrevious =
        skipHistory && historyStack[baseIndex - 1]?.states[id] === newState;

      // Uses || skipHistory to take the cheapest path when prevHistory is not used.
      const prevHistory =
        !currentlyInThePast || skipHistory
          ? historyStack
          : historyStack.slice(0, -historyOffset);

      return {
        ...state,
        states: {
          ...baseStates,
          [id]: newState,
        },
        oldStates: baseStates,
        historyOffset: skipHistory ? historyOffset : 0,
        historyStack: skipHistory
          ? skippedHistoryNowSameAsPrevious
            ? historyStack.slice(0, -1)
            : historyStack
          : [
              ...prevHistory,
              {
                states: baseStates,
                lastActions,
              },
            ],
        currentId: id,
        lastSet: performance.now(),
        lastActions: !skipHistory
          ? { [id]: performedAction }
          : { ...state.lastActions, [id]: performedAction },
        // direction: 'forward',
      };
    }
  }

  return state;
}

let state = INITIAL_STATE;

let currentStates = state.states;

let forceHistoryRender = () => {};

const notifiers = {};
// const effects = {};
// const layoutEffects = {};

const USE_BROWSER_HISTORY = false;

if (USE_BROWSER_HISTORY) {
  // Clean up old history.
  // If the data in this state is accurate, it should remove all in page history,
  // but still preserve prior history like the previous page.
  if ((history.state?.length || 0) > 0) {
    // Go to the state before
    history.go(-history.state.length + history.state.historyOffset - 1);
  }
  const initialHistoryState = { historyOffset: 0, length: 0 };
  if ('length' in (history.state || {})) {
    history.pushState(initialHistoryState, '');
  } else {
    history.replaceState(initialHistoryState, '');
  }
  // Ignore the first popstate event.
  let ignorePopstate = true;
  window.onpopstate = ({ state: historyState }) => {
    if (ignorePopstate) {
      ignorePopstate = false;
      return;
    }
    const { historyOffset } = state;
    const diff =
      state.historyStack.length - historyOffset - (historyState?.length || 0);
    if (diff === 0) {
      return;
    }
    const type = diff < 0 ? 'HISTORY_FORWARD' : 'HISTORY_BACKWARD';
    console.log(type, diff);
    historyDispatch({
      type,
      payload: {
        fromBrowser: true,
        amount: Math.abs(diff),
      },
    });
    history.replaceState({ ...historyState, historyOffset }, '');
  };
}

// const newEffects = new Set();
// const newLayoutEffects = new Set();

const historyDispatch = (action) => {
  state = historyReducer(state, action); 
  const {states, oldStates,  historyOffset, historyStack } = state;

  currentStates =
    historyOffset > 0
      ? historyStack[historyStack.length - historyOffset].states
      : states;

  if (oldStates === emptyState) {
    return;
  }
  const isChangeReducer = action.type === 'ADD_REDUCER' || action.type === 'REMOVE_REDUCER';

  if (!isChangeReducer) {
    forceHistoryRender();
  }

  if (isChangeReducer || action.type === 'CLEAR_HISTORY') {
    return;
  }

  if (USE_BROWSER_HISTORY) {
    switch (action.type) {
      case 'PERFORM_ACTION': {
        if (!action.options.skipHistory) {
          history.pushState(
            { historyOffset: 0, length: historyStack.length },
            ''
          );
        }
        break;
      }
      case 'HISTORY_FORWARD': {
        if (!action.payload?.fromBrowser) {
          ignorePopstate = true;
          history.forward();
        }
        break;
      }
      case 'HISTORY_BACKWARD': {
        if (!action.payload?.fromBrowser) {
          ignorePopstate = true;
          history.back();
        }
        break;
      }
    }
  }

  // const neither = [];
  // const added = [];
  // const removed = [];
  // const diff = [];
  // const same = [];
  // Not sure if it's good to keep all initial states but it's needed 
  // to avoid populating the state with initial values.
  for (const id in state.initialStates) {
    // For this to work it's important that unchanged state members
    // are the same object referentially.
    const inOld = id in oldStates, inNew = id in currentStates;
    if (!(inOld || inNew)) {
      // neither.push(id);
      continue;
    }

    const changed = (!inOld || !inNew) ? true : oldStates[id] !== currentStates[id]; 
    // if (!inOld ) {
    //   added.push(id);
    // }
    // else if (!inNew) {
    //   removed.push(id);
    // } else {
    //   changed ? diff.push(id) : same.push(id);
    // }
    if (changed) {
      notifiers[id]?.forEach((n) => n());
      // effects[id]?.forEach(effect => newEffects.add(effect));
      // layoutEffects[id]?.forEach(effect => newLayoutEffects.add(effect));
    }
  }
  // console.log(JSON.parse(JSON.stringify(oldStates)), JSON.parse(JSON.stringify(currentStates)) );
  // console.log('neither', neither);
  // console.log('added', added);
  // console.log('removed', removed,);
  // console.log('diff', diff);
  // console.log('same', same);
}

const subscribe = (id) => (notify) => {
  if (!notifiers[id]) {
    notifiers[id] = new Set();
  }
  notifiers[id].add(notify);
  return () => {
    notifiers[id].delete(notify);
    if (notifiers[id].size === 0) {
      delete notifiers[id];
    }
  };
};

export function SharedActionHistory(props) {
  const { previewComponents, children } = props;
  const [,forceRender] = useState();

  const {
    states,
    historyStack,
    historyOffset,
    currentId,
    lastActions,
  } = state;

  const dispatch = historyDispatch;

  useHotkeys(
    'ctrl+z,cmd+z',
    () => {
      dispatch({ type: 'HISTORY_BACKWARD' });
    },
    hotkeysOptions
  );

  useHotkeys(
    'ctrl+shift+z,cmd+shift+z',
    () => {
      dispatch({ type: 'HISTORY_FORWARD' });
    },
    hotkeysOptions
  );

  const historyNavigationData = useMemo(
    () => ({
      historyStack,
      historyOffset,
      currentId,
      lastActions,
      dispatch,
      states,
      currentStates, 
      previewComponents,
    }),
    [historyStack, historyOffset, currentId, lastActions, states]
  );

  // useLayoutEffect(() => {
  //   const cleanups = newLayoutEffects.map(effect => effect());
  //   return () => {
  //     cleanups.forEach((cleanup) => typeof cleanup === 'function' && cleanup());
  //   }
  // });

  // useEffect(() => {
  //   const cleanups = newEffects.map(effect => effect());
  //   return () => {
  //     cleanups.forEach((cleanup) => typeof cleanup === 'function' && cleanup());
  //   }
  // });

  useLayoutEffect(() => {
    forceHistoryRender = () => forceRender({});
    return () => {
      forceHistoryRender = () => {};
    };
  } ,[]); 

  return (
    <HistoryNavigateContext.Provider value={historyNavigationData}>
      {children}
    </HistoryNavigateContext.Provider>
  );
}

export function useResumableReducer(
  reducer,
  _initialState,
  initializer = (s) => s,
  manualId
) {
  const instanceId = useId();
  const id = manualId || instanceId;

  const value = useSyncExternalStore(
    subscribe(id),
    () => currentStates[id]
  );

  const isInStore = typeof value !== 'undefined';

  const initialState = useMemo(
    () => (isInStore ? value : initializer(_initialState)),
    []
  );

  const state = isInStore ? value : initialState;

  useLayoutEffect(() => {
    historyDispatch({
      type: 'ADD_REDUCER',
      payload: { id, reducer, initialState },
    });

    // Can't clean up for now because others might use the same id.

    // return () => {
    //   historyDispatch({
    //     type: 'REMOVE_REDUCER',
    //     payload: { id },
    //   });
    // };
  }, []);

  const dispatch = useCallback((action, options = {}) => {
    historyDispatch({
      type: 'PERFORM_ACTION',
      payload: { id, action},
      options,
    });
  }, []);

  return [state, dispatch];
}

const stateReducer = (s, v) => v;

export function useResumableState(initial = null, id) {
  return useResumableReducer(
    stateReducer,
    null,
    () => (typeof initial === 'function' ? initial() : initial),
    id
  );
}


// export function useHistoryEffect(key, effect) {
//   if (!effects[id]) {
//     effects[id] = new Set();
//   }
//   effects[id].add(effect);
//   return () => {
//     effects[id].delete(effect);
//     if (effects[id].size === 0) {
//       delete effects[id];
//     }
//   };
// }

// export function useHistoryLayoutEffect(id, effect = state => {}) {
//   if (!layoutEffects[id]) {
//     layoutEffects[id] = new Set();
//   }
//   layoutEffects[id].add(effect);
//   return () => {
//     layoutEffects[id].delete(effect);
//     if (layoutEffects[id].size === 0) {
//       delete layoutEffects[id];
//     }
//   };
// }