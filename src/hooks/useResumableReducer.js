import { useState } from 'react';
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
  lastAction: null,
  lastSet: {},
  historyStack: [],
  historyOffset: 0,
  reducers: {},
  states: {},
  oldStates: emptyState,
  initialStates: {},
  direction: 'forward',
};

function historyReducer(state, action) {
  const { states,  historyStack, historyOffset } = state;
  const { payload: { id, reducer, initialState: mountInitialState } = {} } = action;

  switch (action.type) {
    case 'ADD_REDUCER': {
      // Has to be dispatched from layout effect.
      // I expect this to not cause additional renders below the SharedHistory component.

      const initialState = id in states ? states[id] : mountInitialState;

      return {
        ...state,
        reducers: {
          ...state.reducers,
          [id]: reducer,
        },
        states: {
          ...states,
          [id]: initialState,
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
      const oldStates = historyOffset === 0 ? states : historyStack[historyStack.length - historyOffset];

      return {
        ...state,
        oldStates,
        historyOffset: historyOffset + 1,
        direction: 'backward',
     };
    }
    case 'HISTORY_FORWARD': {
      if (historyOffset === 0) {
        return state;
      }

      return {
        ...state,
        historyOffset: historyOffset - 1,
        oldStates: historyStack[historyStack.length - historyOffset],
        direction: 'forward',
     };
    }
    case 'CLEAR_HISTORY': {
      return {
        ...state,
        historyStack: [],
        historyOffset: 0,
        direction: 'forward'
      };
    }
    case 'PERFORM_ACTION': {
      const forwardedReducer = state.reducers[id];
      if (!forwardedReducer) {
        return state;
      }

      const currentlyInThePast = historyOffset > 0;
      const baseStates = !currentlyInThePast
        ? states
        : historyStack[historyStack.length - historyOffset].states;

      const performedAction = action.payload.action;
      const newState = forwardedReducer(baseStates[id], performedAction);

      const slowEnough =
        !state.lastSet[id] || performance.now() - state.lastSet[id] > 100;
      const skipHistory = !slowEnough || !!performedAction?.skipHistory;

      const prevHistory =
        !currentlyInThePast || skipHistory
          ? historyStack
          : historyStack.slice(0, historyStack.length - 1 * historyOffset);

      return {
        ...state,
        states: {
          ...baseStates,
          [id]: newState,
        },
        oldStates: baseStates,
        historyOffset: skipHistory ? historyOffset : 0,
        historyStack: skipHistory
          ? historyStack
          : [
              ...prevHistory,
              {
                id,
                states,
                lastAction: state.lastAction || {type: 'INIT'}
              },
            ],
        currentId: id,
        lastSet: { ...state.lastSet, [id]: performance.now() },
        lastAction: performedAction,
        direction: 'forward',
      };
    }
  }

  return state;
}

let state = INITIAL_STATE;

let currentState = state;

let forceHistoryRender = () => {};

const notifiers = {};

const historyDispatch = (action) => {
  state = historyReducer(state, action); 
  const {states, oldStates, direction, historyOffset, historyStack } = state;

  currentState =
    historyOffset > 0
      ? historyStack[historyStack.length - historyOffset].states
      : states;
  if (oldStates === emptyState) {
    return;
  }
  let anyChanged = false;
  const noNotify = action.type === 'ADD_REDUCER' || action.type === 'REMOVE_REDUCER';
  if (noNotify) {
    return;
  }
  for (const id in states) {
    // This should mean a mount of the component using state.
    const isInitial = direction === 'forward' && !id in oldStates;
    // For this to work it's important that unchanged state members
    // are the same object reference.

    const changed = !isInitial && oldStates[id] !== currentState[id];
    if (changed) {
      notifiers[id]?.forEach((n) => {
        anyChanged = true;
        return n();
      });
    }
  }
  anyChanged && forceHistoryRender();
}

const subscribe = (id) => (notify) => {
  if (!notifiers[id]) {
    notifiers[id] = new Set();
  }
  notifiers[id].add(notify);
  return () => {
    notifiers[id].delete(notify);
  };
};

export function SharedActionHistory(props) {
  const { children } = props;
  const [,forceRender] = useState();

  const {
    states,
    historyStack,
    historyOffset,
    currentId,
    lastAction,
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
      lastAction,
      dispatch,
      states,
    }),
    [historyStack, historyOffset, currentId, lastAction, states]
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
  manualId
) {
  const generatedId = useId();
  const id = manualId || generatedId;

  const value = useSyncExternalStore(
    subscribe(id),
    () => currentState[id]
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
    return () => {
      historyDispatch({
        type: 'REMOVE_REDUCER',
        payload: { id },
      });
    };
  }, []);

  const dispatch = useCallback((action) => {
    historyDispatch({
      type: 'PERFORM_ACTION',
      payload: { id, action },
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
