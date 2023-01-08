import React, {
  createContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { hotkeysOptions } from '../components/ThemeEditor';

export const HistoryNavigateContext = createContext({});

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
  oldStates: {},
  initialStates: {},
};

function historyReducer(state, action) {
  const { states, historyStack, historyOffset } = state;
  const {
    payload: { id, reducer, initialState, amount = 1 } = {},
  } = action;

  switch (action.type) {
    case 'ADD_REDUCER': {
      // No changes needed to add a second reducer with the same key.
      // These are assumed to be unique.
      if (id in states) {
        return state;
      }

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
    // case 'REMOVE_REDUCER': {
    //   const { [id]: old, ...otherReducers } = state.reducers;

    //   return {
    //     ...state,
    //     reducers: otherReducers,
    //   };
    // }
    case 'HISTORY_BACKWARD': {
      const oldIndex = historyStack.length - historyOffset;
      if (oldIndex < 1) {
        return state;
      }

      const oldStates =
        historyOffset === 0
          ? states
          : historyStack[oldIndex].states;

      return {
        ...state,
        oldStates,
        historyOffset: historyOffset + amount,
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
        oldStates: historyStack[historyStack.length - historyOffset].states,
      };
    }
    case 'CLEAR_HISTORY': {
      const currentlyInThePast = historyOffset > 0;
      const baseStates = !currentlyInThePast ? states : historyStack[historyStack.length - historyOffset].states;
      const lastActions = !currentlyInThePast ? state.lastActions : historyStack[historyStack.length - historyOffset].lastActions;

      return {
        ...state,
        historyStack: [],
        historyOffset: 0,
        states: baseStates,
        lastActions,
      };
    }
    case 'PERFORM_ACTION': {
      const forwardedReducer = state.reducers[id];
      if (!forwardedReducer) {
        return state;
      }

      // `currentlyInThePast` should be very infrequent case: one edit on the past clears future.
      // Mmost actions happen against the latest state.
      // Hence I think the current approach of treating the latest state as a separate
      // object has better overall performance characteristics,
      // compared to just using the last entry of the history as the latest state.
      // Especially if the changes are fluid and history is skipped every time.
      // It's hard to validate this assumption, though, because this runs really fast even
      // with hundreds of history entries.
      const currentlyInThePast = historyOffset > 0;
      const baseIndex = historyStack.length - historyOffset;
      const historyEntry = !currentlyInThePast ? state : historyStack[baseIndex];
      const {states: baseStates, lastActions} = historyEntry;

      const performedAction = action.payload.action;
      const baseState = id in baseStates ? baseStates[id] : state.initialStates[id];
      const newState = forwardedReducer(
        baseState,
        // Action can be a function in case of setState.
        typeof performedAction === 'function ' ? performedAction(baseState) : performedAction
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
        historyOffset: 0,
        historyStack: skipHistory
          ? skippedHistoryNowSameAsPrevious
            ? historyStack.slice(0, -1)
            : historyStack
          : [
              ...prevHistory,
              {
                states: baseStates,
                lastActions,
                // alternateFutures: [],
              },
            ],
        currentId: id,
        // If the previous state was removed from the history because it was duplicate,
        // it should result in a new entry in any subsequent dispatches to the same id.
        // Otherwise, it would be possible to remove multiple recent entries just by
        // having the same value for any short amount of time.
        lastSet: skippedHistoryNowSameAsPrevious ? null : now,
        lastActions: !skipHistory
          ? { [id]: performedAction }
          : { ...state.lastActions, [id]: performedAction },
      };
    }
  }

  return state;
}

let state = INITIAL_STATE;

let currentStates = state.states;

let forceHistoryRender = () => {};

const notifiers = {};

// const USE_BROWSER_HISTORY = false;

function notifyChanged() {
  // console.log('NOTIFY');
  const { oldStates, initialStates } = state;
  // This is a temporary fix.
  forceHistoryRender();
  // const neither = [];
  // const added = [];
  // const removed = [];
  // const diff = [];
  // const same = [];
  const bothKeys = new Set([...Object.keys(oldStates), ...Object.keys(currentStates)]);

  for (const id of bothKeys.values()) {
    const keyNotifiers = notifiers[id];
    if (!keyNotifiers) {
      continue;
    }
    // For this to work it's important that unchanged state members
    // are the same object referentially.
    const inOld = id in oldStates, inNew = id in currentStates;

    const oldValue = !inOld ? initialStates[id] : oldStates[id] ;
    const newValue = !inNew ? initialStates[id] : currentStates[id];

    const changed = oldValue !== newValue; 
    // if (!inOld ) {
    //   added.push(id);
    // }
    // else if (!inNew) {
    //   removed.push(id);
    // } else {
    //   changed ? diff.push(id) : same.push(id);
    // }
    if (changed) {
      for (const n of keyNotifiers.values()) {
        n();
      }
    }
  }
  
  // console.log(JSON.parse(JSON.stringify(oldStates)), JSON.parse(JSON.stringify(currentStates)) );
  // console.log('neither', neither);
  // console.log('added', added);
  // console.log('removed', removed,);
  // console.log('diff', diff);
  // console.log('same', same);
}

// if (USE_BROWSER_HISTORY) {
//   // Clean up old history.
//   // If the data in this state is accurate, it should remove all in page history,
//   // but still preserve prior history like the previous page.
//   if ((history.state?.length || 0) > 0) {
//     // Go to the state before
//     history.go(-history.state.length + history.state.historyOffset - 1);
//   }
//   const initialHistoryState = { historyOffset: 0, length: 0 };
//   if ('length' in (history.state || {})) {
//     history.pushState(initialHistoryState, '');
//   } else {
//     history.replaceState(initialHistoryState, '');
//   }
//   // Ignore the first popstate event.
//   let ignorePopstate = true;
//   window.onpopstate = ({ state: historyState }) => {
//     if (ignorePopstate) {
//       ignorePopstate = false;
//       return;
//     }
//     const { historyOffset } = state;
//     const diff =
//       state.historyStack.length - historyOffset - (historyState?.length || 0);
//     if (diff === 0) {
//       return;
//     }
//     const type = diff < 0 ? 'HISTORY_FORWARD' : 'HISTORY_BACKWARD';
//     historyDispatch({
//       type,
//       payload: {
//         fromBrowser: true,
//         amount: Math.abs(diff),
//       },
//     });
//     history.replaceState({ ...historyState, historyOffset }, '');
//   };
// }

// const dispatchTimes = {};
const historyDispatch = (action) => {
  // const start = performance.now();
  state = historyReducer(state, action);
  const {states, historyOffset, historyStack } = state;

  currentStates =
    historyOffset > 0
      ? historyStack[historyStack.length - historyOffset].states
      : states;

  // if (USE_BROWSER_HISTORY) {
  //   switch (action.type) {
  //     case 'PERFORM_ACTION': {
  //       if (!action.options.skipHistory) {
  //         history.pushState(
  //           { historyOffset: 0, length: historyStack.length },
  //           ''
  //         );
  //       }
  //       break;
  //     }
  //     case 'HISTORY_FORWARD': {
  //       if (!action.payload?.fromBrowser) {
  //         ignorePopstate = true;
  //         history.forward();
  //       }
  //       break;
  //     }
  //     case 'HISTORY_BACKWARD': {
  //       if (!action.payload?.fromBrowser) {
  //         ignorePopstate = true;
  //         history.back();
  //       }
  //       break;
  //     }
  //   }
  // }

  // const duration = performance.now() - start;
  // const key = `${action.payload?.id || action.type}~${
  //   action.payload?.action?.type?.name || action.payload?.action?.type || ''
  // }`;
  // if (!dispatchTimes[key]) {
  //   dispatchTimes[key] = [];
  // }
  if (action.type !== 'ADD_REDUCER') {
    notifyChanged();
  }
  // dispatchTimes[key].push(duration);
  // if (logTimeout) {
  //   clearTimeout(logTimeout);
  // }
  // logTimeout = setTimeout(() => {
  //   console.log(dispatchTimes);
  // }, 1000)
}
// let logTimeout;

const subscribe = (id) => (notify) => {
  if (!(id in notifiers)) {
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

// This component acts as a boundary for history.
// Todo: use a global history if no boundary is provided.
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

  useHotkeys(
    'ctrl+z,cmd+z',
    () => {
      historyDispatch({ type: 'HISTORY_BACKWARD' });
    },
    hotkeysOptions
  );

  useHotkeys(
    'ctrl+shift+z,cmd+shift+z',
    () => {
      historyDispatch({ type: 'HISTORY_FORWARD' });
    },
    hotkeysOptions
  );

  const historyNavigationData = useMemo(
    () => ({
      historyStack,
      historyOffset,
      currentId,
      lastActions,
      dispatch: historyDispatch ,
      states,
      currentStates,
      previewComponents,
    }),
    [historyStack, historyOffset, currentId, lastActions, states]
  );

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
  id
) {
  const initialState = useMemo(
    () => (initializer(_initialState)),
    []
  );

  const state = useSyncExternalStore(
    useMemo(() => subscribe(id), []),
    () => {
      // console.log('GETTING SNAPSHOT FOR', id, currentStates[id])
      return !(id in currentStates) ? initialState : currentStates[id];
    }
  );

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
