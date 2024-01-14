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

// The initial state when a new key was added.
const initialStates = new Map<string, any>();
// The reducer for a key.
const reducers = new Map<string, Reducer<any>>();
// The function with which the key can be updated.
const dispatchers = new Map<string, (action: any, options: HistoryOptions) => void>;
// A function with no args and no return value.
type voidFn = () => void;
// Function for each key that subscribes to updates, and returns function that unsubscribes.
const subscribers = new Map<string, (notify: voidFn) => voidFn>();
// The function that is passed to React to obtain a snapshot of the state for a key, taking history into account.
const getSnapshots = new Map<string, () => any>();
// The set of notify functions to trigger subscribed React elements to render, for each key.
const notifiers = new Map<string, Set<voidFn>>();
// The history index to which some keys are locked.
const locks = new Map<string, number>();
// Incremented each time the lock map changes.
let lockVersion = 0;

// Each piece of state can have a single effect, which is simply added to the notifiers for that id, once.
const effectsDone = new Set<string>();

function readSync(id: string): any {
  let sourceState;
  if (locks.has(id)) {
    const index = locks.get(id);
    sourceState = index >= past.length ? states : past[index].states;
  } else {
    sourceState = pointedStates;
  }

  return sourceState.has(id) ? sourceState.get(id) : initialStates.get(id);
}

// Add a single perpetual effect for a key.
// It can respond to changes regardless of whether any React element is listening
// to changes.
// For now, only one effect per key is supported, but perhaps that's enough.
// It simply uses the same mechanism as what is used to notify React of changes.
export function useSingleEffect(id: string, f: (id: string, value: any) => void) {
  if (effectsDone.has(id)) {
    // Only 1 effect is allowed to register per key.
    return;
  }
  let set = notifiers.get(id);
  if (set === undefined) {
    set = new Set();
    notifiers.set(id, set);
  }
  set.add(() => {
    f(id, readSync(id))
  });
  // The effect should remain in this set indefinitely so that history navigation
  // can be properly applied without relying on any component being on the screen.
  effectsDone.add(id);
}

// Lock state for a key to an index in the history array, then trigger render.
export function addLock (id: string, index: number): void {
  locks.set(id, index);
  forceHistoryRender();
  lockVersion++;
  notifyOne(id);
}

// Removing the lock on a key, then trigger render.
export function removeLock(id: string): void {
  locks.delete(id);
  forceHistoryRender();
  lockVersion++;
  notifyOne(id);
}

// Set up initial state and all handlers for a new key.
function addReducer(id, reducer, rawInitialState, initializer) {
  reducers.set(id, reducer);
  const initialState =
    typeof initializer === 'function'
      ? initializer(rawInitialState)
      : rawInitialState;
  initialStates.set( id, initialState);
  dispatchers.set(
    id,
    performAction.bind(null, id),
  )
  // dispatchers[id] = (action, options = {}) => {
  //   performAction(id, action, options);
  // };
  subscribers.set(id, (notify) => {
    let set = notifiers.get(id);
    if (set === undefined) {
      set = new Set();
      notifiers.set(id, set);
    }
    set.add(notify);
    return () => {
      set.delete(notify);
      if (set.size === 0) {
        notifiers.delete(id);
      }
    };
  });
  getSnapshots.set(id, () => {
    let sourceStates;
    if (locks.has(id)) {
      const index = locks.get(id);
      sourceStates = index >= past.length ? states : past[index].states;
    } else {
      sourceStates = pointedStates;
    }
    return sourceStates.has(id)
      ? sourceStates.get(id)
      : initialState;
  });
}

// This function is used to determine which states should be visited when using fast navigation.
// Hard coded to keep it simple for now, it could be user configurable.
export function isInterestingState(lastActions) {
  for (const k of ['THEME_EDITOR', 'uiLayout']) {
    if (lastActions.has(k)) {
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

// type StateAction = {};

type HistoryEntry = {
  states: Map<string, any>,
  lastActions: Map<string, any>,
};

// All entries in history, from oldest to latest.
let past: HistoryEntry[] = [];
// Amount of steps back in time.
let historyOffset = 0;
// Prompt before destroying future when this many steps back in history.
let historyWarnOnUpdateLimit = 5;
// The tail of the history.
let states = new Map<string, any>();
// The state that was rendered before the last state transition.
// It's assumed that this state was fully applied in the whole tree.
// Used for change detection.
let oldStates = states;
// The state at the history offset, or the latest state if offset is 0.
let pointedStates = states;
// The actions that produced the most recent state.
let lastActions = new Map<string, any>();
// The time at which the latest value was set, used for debouncing.
let lastSet = 0;

export function restoreHistoryFromDb() {
  // This only restores the history timeline (past and future).
  // The current state is still received from local storage, because that's synchronous.
  // We need to store the initial state as a starting point to replay stored actions.

  // 1. Read DB

  // 2. Then, update history stack and notify history components.
  // Should not result in any state changes, though it can mean history offset changes as a result.
}

function storeAction() {
  // If action is an actual action object, we need to store the action itself.
  // If action is a function, we need to store the result state, as we can't rerun the function.
  // Could be a problem for large objects like the moved elements state (prob better make those reducer).

  // Some actions need additional data to store: inspected element would need a path in the document,
  // then they can be restored as long as the document doesn't change.
}

export function historyBack(amount = 1): void {
  const oldIndex = past.length - historyOffset;
  if (oldIndex < 1) {
    return;
  }

  oldStates =
    historyOffset === 0
      ? states
      : past[oldIndex].states;

  historyOffset += amount;

  checkNotifyAll();
}

export function historyForward(amount = 1): void {
  if (historyOffset === 0) {
    return;
  }

  const newOffset = Math.max(0, historyOffset - amount);
  oldStates = past[past.length - historyOffset].states;
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
  while (newOffset < past.length) {
    newOffset++;
    const entry = past[past.length - newOffset];
    if (isInterestingState(entry.lastActions)) {
      break;
    }
  }

  oldStates =
    historyOffset === 0
      ? states
      : past[past.length - historyOffset].states;

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
    const actions = newOffset === 0 ? lastActions : past[past.length - newOffset].lastActions;
    if (isInterestingState(actions)) {
      break;
    }
  }

  oldStates = past[past.length - historyOffset].states;
  historyOffset = newOffset;

  checkNotifyAll();
}

export function clearHistory(): void {
  const currentlyInThePast = historyOffset > 0;

  past = [];
  historyOffset = 0;
  lastActions = !currentlyInThePast ? lastActions : past[past.length - historyOffset].lastActions;;
  states = !currentlyInThePast ? states : past[past.length - historyOffset].states;

  checkNotifyAll();
}

export function performAction(id, action, options: HistoryOptions): void {
  historyOffset > 0
    ? performActionOnPast(id, action, options)
    : performActionOnLatest(id, action, options);
}

// This path is the only one that can execute frequently, as actions on top
// of an older state will result in the next action being on the latest state.
function performActionOnLatest(id, action, options: HistoryOptions): void {
  const reducer = reducers.get(id);
  if (!reducer) {
    return;
  }
  const now = performance.now();

  const lockIndex = locks.get(id);
  const hasLock = locks.has(id);
  const hasLockInPast = hasLock && lockIndex < past.length;

  const baseState = hasLockInPast
    ? past[lockIndex].states.get(id)
    : states.has(id)
    ? states.get(id)
    : initialStates.get(id);

  const newState = reducer(
    baseState,
    // Action can be a function in case of setState.
    typeof action === 'function' ? action(baseState) : action
  );
  if (newState === baseState) {
    return;
  }
  // Determine whether debouncing should kick in.
  const slowEnough = now - lastSet > (options?.debounceTime || 500);
  const skipHistory = !slowEnough || options?.skipHistory;

  // Afaik there is no possible benefit to having two consecutive identical states in history.
  function lastStateSuperFluous() {
    const prev = past[past.length - 1];
    if (prev?.states.get(id) !== newState) {
      return false;
    }
    const keys = Object.keys(prev.lastActions);

    // This doesn't account for everything yet: multiple actions can be superfluous together, like width and height.
    return keys.length === 1 && keys[0] === id;
  }
  const skippedHistoryNowSameAsPrevious = skipHistory && lastStateSuperFluous();

  oldStates = states;
  states = new Map(states);
  if (newState === initialStates.get(id)) {
    states.delete(id);
  } else {
    states.set(id, newState);
  }

  historyOffset = 0;

  past = skipHistory
    ? skippedHistoryNowSameAsPrevious
      ? past.slice(0, -1)
      : past
    : [
        ...past,
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

  if (!skipHistory) {
    lastActions = new Map();
  }
  lastActions.set(id, action);

  if (hasLock) {
    // If there was a lock on this state, update it to the newly created state.
    addLock(id, past.length);
  }
  notifyOne(id);
}

function performActionOnPast(id, action, options: HistoryOptions): void {
  const reducer = reducers.get(id);
  if (!reducer) {
    return;
  }
  if (historyOffset > historyWarnOnUpdateLimit) {
    if (!window.confirm('You are about to erase the future, this is your last chance to reconsider.')) {
      return;
    }
  }

  const now = performance.now();
  const baseIndex = past.length - historyOffset;
  const prevEntry = past[baseIndex];
  const prevStates = prevEntry.states;
  const lockIndex = locks.has(id) ? locks.get(id) : baseIndex;
  const baseStatesWithLock = past[lockIndex].states;

  const baseState = baseStatesWithLock.has(id) ? baseStatesWithLock.get(id) : initialStates.get(id);
  const newState = reducer(
    baseState,
    // Action can be a function in case of setState.
    typeof action === 'function' ? action(baseState) : action
  );
  if (newState === baseState) {
    return;
  }
  const lockUpdates = new Map();
  // The extra actions that are added when future locks are preserved.
  const futureLockActions = new Map();
  let hasFutureLocks = false;
  for (const [id, index] of locks.entries()) {
    if (index > baseIndex) {
      hasFutureLocks = true;
      if (index >= past.length) {
        lockUpdates.set(id, states.get(id));
        futureLockActions.set(id, lastActions.get(id));
      } else {
        lockUpdates.set(id, past[index].states.get(id));
        futureLockActions.set(id, past[index].lastActions.get(id));
      }
      locks.set(id, baseIndex + 1);
    }
  }
  // const isNowDefaultState = newState === initialStates[id];
  // const previousAlsoDefaultState = isNowDefaultState && baseIndex && !(id in past[baseIndex - 1].states);
  // const {[id]: _, ...otherStates} = !isNowDefaultState ? {} : baseStates;

  const prevHistory = historyOffset === 1 ? past : past.slice(0, -historyOffset + 1);
  if (hasFutureLocks) {
    const entry = new Map<string, any>([...prevStates, ...lockUpdates]);
    prevHistory.push({
      states: entry,
      lastActions: futureLockActions,
    })
  }
  if (locks.has(id)) {
    // If there was a lock on this state, update it to the newly created state.
    addLock(id, prevHistory.length);
  }
 
  states = new Map([...prevStates, ...lockUpdates]);
  if (newState === initialStates.get(id)) {
    states.delete(id);
  } else {
    states.set(id, newState);
  }

  oldStates = prevStates;
  historyOffset = 0;

  past = prevHistory;

  // If the previous state was removed from the history because it was duplicate,
  // it should result in a new entry in any subsequent dispatches to the same id.
  // Otherwise, it would be possible to remove multiple recent entries (with different values)
  // just by having the same value for any short amount of time.
  lastSet = now;
  lastActions = new Map([[id, action]]);

  notifyOne(id);
}

let forceHistoryRender = () => {};

function setCurrentState() {
  pointedStates =
    historyOffset > 0
      ? past[past.length - historyOffset].states
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
  const keyNotifiers = notifiers.get(id);
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

  for (const [id, value] of pointedStates.entries()) {
    const keyNotifiers = notifiers.get(id);
    if (!keyNotifiers) {
      continue;
    }

    if (!oldStates.has(id) || oldStates.get(id) !== value) {
      for (const n of keyNotifiers.values()) {
        n();
      }
    }
  }

  for (const id of oldStates.keys()) {
    const keyNotifiers = notifiers.get(id);
    if (!keyNotifiers) {
      continue;
    }
    if (!pointedStates.has(id)) {
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
//       past.length - historyOffset - (historyState?.length || 0);
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
      past,
      historyOffset,
      lastActions,
      pointedStates,
      previewComponents,
      locks,
    }),
    [past, historyOffset, lastActions, states, lockVersion]
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
    subscribers.get(id),
    getSnapshots.get(id),
  );

  return [currentState as T, dispatchers.get(id)];
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
