import React, {
  createContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { hotkeysOptions } from '../components/Hotkeys';
import { useHotkeys } from 'react-hotkeys-hook';

type Reducer<T> = (previous: T, action) => T

const initialStates = new Map<string, any>();
const reducers = new Map<string, Reducer<any>>();
const dispatchers = {};
const subscribers = {};
const getSnapshots = {};

const locks = new Map<string, number>();
let lockVersion = 0;

export function addLock (id: string, index: number): void {
  locks.set(id, index);
  forceHistoryRender();
  lockVersion++;
  notifyOne(id);
}

export function removeLock(id: string): void {
  locks.delete(id);
  forceHistoryRender();
  lockVersion++;
  notifyOne(id);
}

function addReducer(id, reducer, initialState, initializer) {
  reducers[id] = reducer;
  initialStates[id] =
    typeof initializer === 'function'
      ? initializer(initialState)
      : initialState;
  dispatchers[id] = performAction.bind(null, id);
  // dispatchers[id] = (action, options = {}) => {
  //   performAction(id, action, options);
  // };
  subscribers[id] = (notify) => {
    if (!(notifiers.hasOwnProperty(id))) {
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
    if (locks.has(id)) {
      const index = locks.get(id);
      if (index >= historyStack.length) {
        return states[id];
      }
      return historyStack[index].states[id];
    }

    return currentStates.hasOwnProperty(id) ? currentStates[id] : initialStates[id];
  }
}

// Hard coded to keep it simple for now.
// Not sure where and how to best configure this for a given piece of state.
export function isInterestingState(lastActions) {
  for (const k of ['THEME_EDITOR', 'uiLayout']) {
    if (lastActions.hasOwnProperty(k)) {
      return true;
    }
  }
  return false;
}

// The current options are only applied when acting on the latest state,
// not when doing an action on top of a past state.
type HistoryOptions = {
  // The minimum time between actions to create a new state in history.
  // If not provided it uses a default value for all actions.
  // Actions that happen more quickly will prevent the previous value from
  // being recorded as a separate history entry.
  debounceTime?: number,
  // If provided, always displace the previous value instead of recording it.
  skipHistory?: boolean;
}

// All entries in history, from oldest to latest.
let historyStack = [];
// Amount of steps back in time.
let historyOffset = 0;
// Prompt before destroying future when this many steps back in history.
let historyWarnOnUpdateLimit = 5;
// The tail of the history.
let states = {};
// The state that was rendered before the last state transition.
// It's assumed that this state was fully applied in the whole tree.
// Used for change detection.
let oldStates = {};
// The state at the history offset, or the latest state if offset is 0.
let currentStates = {};
// The actions that produced the most recent state.
let lastActions = {};
// The time at which the latest value was set, used for debouncing.
let lastSet = 0;

export function historyBack(amount = 1): void {
  const oldIndex = historyStack.length - historyOffset;
  if (oldIndex < 1) {
    return;
  }

  oldStates =
    historyOffset === 0
      ? states
      : historyStack[oldIndex].states;

  historyOffset += amount;

  checkNotifyAll();
}

export function historyForward(amount = 1): void {
  if (historyOffset === 0) {
    return;
  }

  const newOffset = Math.max(0, historyOffset - amount);
  oldStates = historyStack[historyStack.length - historyOffset].states;
  historyOffset = newOffset;
  checkNotifyAll();
}

export function historyBackOne(): void {
  historyBack(1);
}

export function historyForwardOne(): void {
  historyForward(1);
}

export function historyBackFast(): void {
  let newOffset = historyOffset;
  while (newOffset < historyStack.length) {
    newOffset++;
    const entry = historyStack[historyStack.length - newOffset];
    if (isInterestingState(entry.lastActions)) {
      break;
    }
  }

  oldStates =
    historyOffset === 0
      ? states
      : historyStack[historyStack.length - historyOffset].states;

  historyOffset = newOffset;

  checkNotifyAll();
}

export function historyForwardFast(): void {
  let newOffset = historyOffset;
  if (historyOffset === 0)  {
    return;
  }
  while (newOffset > 0) {
    newOffset--;
    const actions = newOffset === 0 ? lastActions : historyStack[historyStack.length - newOffset].lastActions;
    if (isInterestingState(actions)) {
      break;
    }
  }

  oldStates = historyStack[historyStack.length - historyOffset].states;
  historyOffset = newOffset;

  checkNotifyAll();
}

export function clearHistory(): void {
  const currentlyInThePast = historyOffset > 0;

  historyStack = [];
  historyOffset = 0;
  lastActions = !currentlyInThePast ? lastActions : historyStack[historyStack.length - historyOffset].lastActions;;
  states = !currentlyInThePast ? states : historyStack[historyStack.length - historyOffset].states;

  checkNotifyAll();
}

export function performAction(id, action, options: HistoryOptions): void {
  historyOffset > 0
    ? performActionOnPast(id, action, options)
    : performActionOnLatest(id, action, options);
}

function performActionOnLatest(id, action, options: HistoryOptions): void {
  const reducer = reducers[id];
  if (!reducer) {
    return;
  }
  const now = performance.now();

  const lockIndex = locks.get(id);
  const hasLock = locks.has(id);
  const hasLockInPast = hasLock && lockIndex < historyStack.length;

  const baseState = hasLockInPast
    ? historyStack[lockIndex].states[id]
    : states.hasOwnProperty(id)
    ? states[id]
    : initialStates[id];

  const newState = reducer(
    baseState,
    // Action can be a function in case of setState.
    typeof action === 'function' ? action(baseState) : action
  );
  if (newState === baseState) {
    return;
  }
  const slowEnough = now - lastSet > (options?.debounceTime || 500);
  const skipHistory = !slowEnough || options?.skipHistory;

  // Afaik there is no possible benefit to having two consecutive identical states in history.
  function lastStateSuperFluous() {
    const prev = historyStack[historyStack.length - 1];
    if (prev.states[id] !== newState) {
      return false;
    }
    const keys = Object.keys(prev.lastActions);

    // This doesn't account for everything yet: multiple actions can be superfluous together, like width and height.
    return keys.length === 1 && keys[0] === id;
  }
  const skippedHistoryNowSameAsPrevious = skipHistory && lastStateSuperFluous();

  oldStates = states;
  states = {
    ...states,
    [id]: newState,
  };
  historyOffset = 0;

  historyStack = skipHistory
    ? skippedHistoryNowSameAsPrevious
      ? historyStack.slice(0, -1)
      : historyStack
    : [
        ...historyStack,
        {
          states: oldStates,
          lastActions,
        },
      ];

  // If the previous state was removed from the history because it was duplicate,
  // it should result in a new entry in any subsequent dispatches to the same id.
  // Otherwise, it would be possible to remove multiple recent entries (with different values)
  // just by having the same value for any short amount of time.
  lastSet = skippedHistoryNowSameAsPrevious ? 0 : now;

  if (skipHistory) {
    lastActions[id] = action;
  } else {
    lastActions = { [id]: action };
  }

  if (hasLock) {
    // If there was a lock on this state, update it to the newly created state.
    addLock(id, historyStack.length);
  }
  notifyOne(id);
}

function performActionOnPast(id, action, options: HistoryOptions): void {
  const reducer = reducers[id];
  if (!reducer) {
    return;
  }
  if (historyOffset > historyWarnOnUpdateLimit) {
    if (!window.confirm('You are about to erase the future, this is your last chance to reconsider.')) {
      return;
    }
  }

  const now = performance.now();
  const baseIndex = historyStack.length - historyOffset;
  const prevEntry = historyStack[baseIndex];
  const prevStates = prevEntry.states;
  const lockIndex = locks.has(id) ? locks.get(id) : baseIndex;
  const baseStatesWithLock = historyStack[lockIndex].states;

  const baseState = baseStatesWithLock.hasOwnProperty(id) ? baseStatesWithLock[id] : initialStates[id];
  const newState = reducer(
    baseState,
    // Action can be a function in case of setState.
    typeof action === 'function' ? action(baseState) : action
  );
  if (newState === baseState) {
    return;
  }
  const lockUpdates = {};
  // The extra actions that are added when future locks are preserved.
  const futureLockActions = {};
  let hasFutureLocks = false;
  for (const [id, index] of locks.entries()) {
    if (index > baseIndex) {
      hasFutureLocks = true;
      if (index >= historyStack.length) {
        lockUpdates[id] = states[id];
        futureLockActions[id] = lastActions[id];
      } else {
        lockUpdates[id] = historyStack[index].states[id];
        futureLockActions[id] = historyStack[index].lastActions[id];
      }
      locks.set(id, baseIndex + 1);
    }
  }
  // const isNowDefaultState = newState === initialStates[id];
  // const previousAlsoDefaultState = isNowDefaultState && baseIndex && !(id in historyStack[baseIndex - 1].states);
  // const {[id]: _, ...otherStates} = !isNowDefaultState ? {} : baseStates;

  const prevHistory = historyOffset === 1 ? historyStack : historyStack.slice(0, -historyOffset + 1);
  if (hasFutureLocks) {
    prevHistory.push({
      states: {...prevStates, ...lockUpdates},
      lastActions: futureLockActions,
    })
  }
  if (locks.has(id)) {
    // If there was a lock on this state, update it to the newly created state.
    addLock(id, historyStack.length);
  }
 
  states = {
    ...prevStates,
    ...lockUpdates,
    [id]: newState,
  };
  oldStates = prevStates;
  historyOffset = 0;

  historyStack = prevHistory;

  // If the previous state was removed from the history because it was duplicate,
  // it should result in a new entry in any subsequent dispatches to the same id.
  // Otherwise, it would be possible to remove multiple recent entries (with different values)
  // just by having the same value for any short amount of time.
  lastSet = now;
  lastActions = { [id]: action };

  notifyOne(id);
}

let forceHistoryRender = () => {};

const notifiers = {};

function setCurrentState() {
  currentStates =
    historyOffset > 0
      ? historyStack[historyStack.length - historyOffset].states
      : states;
}

// All browser history related code was commented for now.
// It works, but it's not that user friendly and hard to support.
// Not user friendly because:
// * Interferes with normal usage of browser history.
// * The amount of entries gets really big, probably triggering max lengths.

// const USE_BROWSER_HISTORY = false;

// Notify one ID without checking.
function notifyOne(id) {
  setCurrentState();
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
  setCurrentState();
  const bothKeys = new Set([...Object.keys(oldStates), ...Object.keys(currentStates)]);

  for (const id of bothKeys.values()) {
    const keyNotifiers = notifiers[id];
    if (!keyNotifiers) {
      // No need to compare if nobody's listening.
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
//   if (history?.state.hasOwnProperty('length')) {
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

export const HistoryNavigateContext = createContext({});

// This component acts as a boundary for history.
// Todo: use a global history if no boundary is provided.
export function SharedActionHistory(props) {
  const { previewComponents, children } = props;
  const [,forceRender] = useState();

  useHotkeys(
    'ctrl+z,cmd+z',
    historyBackOne,
    hotkeysOptions
  );

  useHotkeys(
    'ctrl+shift+z,cmd+shift+z',
    historyForwardOne,
    hotkeysOptions
  );
  useHotkeys(
    'alt+z',
    historyBackFast,
    hotkeysOptions
  );

  useHotkeys(
    'alt+shift+z',
    historyForwardFast,
    hotkeysOptions
  );

  const historyNavigationData = useMemo(
    () => ({
      historyStack,
      historyOffset,
      lastActions,
      currentStates,
      previewComponents,
      locks,
    }),
    [historyStack, historyOffset, lastActions, states, lockVersion]
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

export type StateAndUpdater<T> = [
  T,
  (updater: T | ((state: T) => T), options?: HistoryOptions) => void
];

export function useResumableReducer<T>(
  reducer,
  initialState: T,
  initializer = (s) => s,
  id: string
): StateAndUpdater<T> {
  if (!reducers.has(id)) {
    // First one for an id gets to add the reducer.
    addReducer(id, reducer, initialState, initializer);
  }

  const currentState = useSyncExternalStore(
    subscribers[id],
    getSnapshots[id],
  );

  return [currentState as T, dispatchers[id]];
}

const stateReducer = (s, v) => v;

export function useResumableState<T>(
  id: string,
  initial: T | (() => T)
): StateAndUpdater<T> {
  return useResumableReducer(
    stateReducer,
    null,
    // This runtime check is not great, but we have to do it to have the same signature and behavior
    // as React's useState, so that it can be a drop in replacement as much as possible.
    // TS complains about the function call, but it just doesn't detect the execution context.
    () => (typeof initial === 'function' ? initial() : initial),
    id
  );
}
