import { useSyncExternalStore } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { hotkeysOptions } from '../components/ThemeEditor';
import { useId } from './useId';

export const SharedHistoryContext = createContext({});

export const HistoryNavigateContext = createContext({});

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
     };
    }
    case 'HISTORY_FORWARD': {
      if (historyOffset === 0) {
        return states;
      }

      return {
        ...state,
        historyOffset: historyOffset - 1,
        oldStates: historyStack[historyStack.length - historyOffset],
     };
    }
    case 'CLEAR_HISTORY': {
      return {
        ...state,
        historyStack: [],
        historyOffset: 0,
      };
    }
    case 'PERFORM_ACTION': {
      const forwardedReducer = state.reducers[id];
      if (!forwardedReducer) {
        return state;
      }

      const usesHistory = historyOffset > 0;
      const baseStates =  !usesHistory ? states : historyStack[historyStack.length - historyOffset].states;

      const performedAction = action.payload.action;
      const newState = forwardedReducer(baseStates[id], performedAction);

      const slowEnough =
        !state.lastSet[id] || performance.now() - state.lastSet[id] > 100;
      const skipHistory = !slowEnough || !!performedAction?.skipHistory;

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
              ...historyStack.slice(0, historyStack.length - 1 * historyOffset),
              {
                id,
                states,
                lastAction: state.lastAction || {type: 'INIT'}
              },
            ],
        currentId: id,
        lastSet: { ...state.lastSet, [id]: performance.now() },
        lastAction: performedAction,
      };
    }
  }

  return state;
}

const emptyState = {};

export function SharedActionHistory(props) {
  const notifiers = useRef({});
  const { children } = props;

  const [
    {
      states,
      oldStates = emptyState,
      historyStack,
      historyOffset,
      currentId,
      lastAction,
    },
    dispatch,
  ] = useReducer(historyReducer, INITIAL_STATE);

  const statesRef = useRef(emptyState);

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

  const subscribe = (id) => (notify) => {
    if (!notifiers.current[id]) {
      notifiers.current[id] = new Set();
    }
    notifiers.current[id].add(notify);
    return () => {
      notifiers.current[id].delete(notify);
    };
  };
  const historyParticipantsData = useMemo(
    () => ({ subscribe, dispatch, statesRef }),
    []
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

  // Because triggering renders of the children is avoided, it's safe
  // to use the reducer state in a layout effect in order to trigger
  // the necessary renders.
  useLayoutEffect(() => {
    statesRef.current =
      historyOffset > 0
        ? historyStack[historyStack.length - historyOffset].states
        : states;
    if (oldStates === emptyState) {
      return;
    }
    for (const id in states) {
      // For this to work it's important that unchanged state members
      // are the same object reference.
      const changed = oldStates[id] !== statesRef.current[id];
      if (changed) {
        // console.log('NOTIFYING', id);
        notifiers.current[id]?.forEach((n) => n());
      }
    }
  }, [states, oldStates, historyStack, historyOffset]);

  return (
    <SharedHistoryContext.Provider value={historyParticipantsData}>
      <HistoryNavigateContext.Provider value={historyNavigationData}>
        {children}
      </HistoryNavigateContext.Provider>
    </SharedHistoryContext.Provider>
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

  const {
    subscribe,
    dispatch: historyDispatch,
    statesRef,
  } = useContext(SharedHistoryContext);

  const value = useSyncExternalStore(
    subscribe(id),
    () => statesRef.current[id]
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
