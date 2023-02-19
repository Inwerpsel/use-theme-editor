import React, {
  createContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { hotkeysOptions } from '../components/Hotkeys';
import { useHotkeys } from 'react-hotkeys-hook';

const INITIAL_STATE = {
  lastActions: {
    HISTORY: {
      type: 'INIT',
      payload: {},
    },
  },
  lastSet: 0,
  historyStack: [],
  historyOffset: 0,
  historyWarnOnUpdateLimit: 5,
  states: {},
  oldStates: {},
};

const initialStates = {};
const reducers = {};
const dispatchers = {};
const subscribers = {};
const getSnapshots = {};

function addReducer(id, reducer, initialState, initializer) {
  reducers[id] = reducer;
  initialStates[id] =
    typeof initializer === 'function'
      ? initializer(initialState)
      : initialState;
  dispatchers[id] = (action, options = {}) => {
    historyDispatch(
      {
        type: 'PERFORM_ACTION',
        payload: { id, action },
      },
      options
    );
  };
  subscribers[id] = (notify) => {
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
  }
  getSnapshots[id] = () => {
    return currentStates.hasOwnProperty(id) ? currentStates[id] : initialStates[id];
  }
}

function historyReducer(state, action, options) {
  const { states, historyStack, historyOffset } = state;
  const {
    payload: { id, amount = 1 } = {},
  } = action;

  switch (action.type) {
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
      const forwardedReducer = reducers[id];
      if (!forwardedReducer) {
        return state;
      }
      if (state.historyOffset > state.historyWarnOnUpdateLimit) {
        if (!window.confirm('You are about to erase the future, this is your last chance to reconsider.')) {
          return state;
        }
      }

      // `currentlyInThePast` is false most of the time: one edit on the past clears future.
      // Most actions happen against the latest state (e.g. changing color wheel).
      // Hence the current approach of treating the latest state as a separate
      // object probably has better overall performance characteristics,
      // compared to just using the last entry of the history as the latest state.
      // Especially if the changes are fast and history is debounced every time.
      // Todo: setup performance test scenario to validate this.
      const currentlyInThePast = historyOffset > 0;
      const baseIndex = historyStack.length - historyOffset;
      const historyEntry = !currentlyInThePast ? state : historyStack[baseIndex];
      const {states: baseStates, lastActions} = historyEntry;

      const performedAction = action.payload.action;
      const baseState = id in baseStates ? baseStates[id] : initialStates[id];
      const newState = forwardedReducer(
        baseState,
        // Action can be a function in case of setState.
        typeof performedAction === 'function ' ? performedAction(baseState) : performedAction
      );
      // const isNowDefaultState = newState === initialStates[id];
      // const previousAlsoDefaultState = isNowDefaultState && baseIndex && !(id in historyStack[baseIndex - 1].states);
      // const {[id]: _, ...otherStates} = !isNowDefaultState ? {} : baseStates;

      const now = performance.now();
      const slowEnough =
        !state.lastSet || now - state.lastSet > 500;
      const skipHistory = !slowEnough || options?.skipHistory;
      const skippedHistoryNowSameAsPrevious =
        skipHistory && historyStack[baseIndex - 1]?.states[id] === newState;

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
              },
            ],
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

// All browser history related code was commented for now.
// It works, but it's not that user friendly and hard to support.
// const USE_BROWSER_HISTORY = false;

// Notify one ID without checking.
function notifyOne(id) {
  const keyNotifiers = notifiers[id];
  if (!keyNotifiers) {
    return;
  }
  for (const n of keyNotifiers.values()) {
    n();
  }
  forceHistoryRender();
}

function checkNotifyAll() {
  const { oldStates } = state;
  const bothKeys = new Set([...Object.keys(oldStates), ...Object.keys(currentStates)]);

  for (const id of bothKeys.values()) {
    const keyNotifiers = notifiers[id];
    if (!keyNotifiers) {
      continue;
    }
    const inOld = oldStates.hasOwnProperty(id), inNew = currentStates.hasOwnProperty(id);

    const oldValue = !inOld ? initialStates[id] : oldStates[id] ;
    const newValue = !inNew ? initialStates[id] : currentStates[id];

    const changed = oldValue !== newValue; 

    if (changed) {
      for (const n of keyNotifiers.values()) {
        n();
      }
    }
  }
  // This is a temporary fix.
  forceHistoryRender();
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

const historyDispatch = (action, options) => {
  const newState = historyReducer(state, action, options);
  if (newState === state) {
    return
  }
  state = newState;
  const {states, historyOffset, historyStack } = state;

  currentStates =
    historyOffset > 0
      ? historyStack[historyStack.length - historyOffset].states
      : states;

  // if (USE_BROWSER_HISTORY) {
  //   switch (action.type) {
  //     case 'PERFORM_ACTION': {
  //       if (!options.skipHistory) {
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
  if (action.type === 'PERFORM_ACTION') {
    notifyOne(action.payload.id);
  } else {
    checkNotifyAll();
  }
}

export const HistoryNavigateContext = createContext({});

// This component acts as a boundary for history.
// Todo: use a global history if no boundary is provided.
export function SharedActionHistory(props) {
  const { previewComponents, children } = props;
  const [,forceRender] = useState();

  const {
    states,
    historyStack,
    historyOffset,
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
      lastActions,
      dispatch: historyDispatch,
      states,
      currentStates,
      previewComponents,
    }),
    [historyStack, historyOffset, lastActions, states]
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
  initialState,
  initializer = (s) => s,
  id
) {
  if (!reducers.hasOwnProperty(id)) {
    // First one for an id gets to add the reducer.
    addReducer(id, reducer, initialState, initializer);
  }

  const currentState = useSyncExternalStore(
    subscribers[id],
    getSnapshots[id],
  );

  return [currentState, dispatchers[id]];
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
