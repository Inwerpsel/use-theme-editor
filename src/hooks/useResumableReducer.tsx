import React, {
  createContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { hotkeysOptions } from '../components/Hotkeys';
import { useHotkeys } from 'react-hotkeys-hook';
import { deleteStoredHistory, storeActions } from '../_unstable/historyStore';
import { saveAsJsonFile } from '../functions/export';
import { INSPECTIONS, getPrevinspections, resetInspections } from '../renderSelectedVars';
import { Action } from '../functions/reducerOf';

type Reducer<T> = (previous: T, action) => T

// The initial state when a new key was added.
export let initialStates = new Map<string, any>();
// The reducer for a key.
export let reducers = new Map<string, Reducer<any>>();
// Queue of actions dispatched before reducer was added.
// Will be replayed right after the reducer gets added.
export const reducerQueue = new Map<string, [number, any][]>();
// The function with which the key can be updated.
// const dispatchers = new Map<string, (action: any, options: HistoryOptions) => void>;
// A function with no args and no return value.
type voidFn = () => void;
// Function for each key that subscribes to updates, and returns function that unsubscribes.
// const subscribers = new Map<string, (notify: voidFn) => voidFn>();
// The function that is passed to React to obtain a snapshot of the state for a key, taking history into account.
// const getSnapshots = new Map<string, () => any>();
// The set of notify functions to trigger subscribed React elements to render, for each key.
const notifiers = new Map<string, Set<voidFn>>();
// The history index to which some keys are pinned.
const pinData = JSON.parse(localStorage.getItem('pins') || '[]')
let pins = new Map<string, number>();
export function restorePins(){
  pins = new Map<string, number>(pinData);
}
// Incremented each time the pin map changes.
let pinVersion = 0;

// Each piece of state can have a single effect, which is simply added to the notifiers for that id, once.
const effectsDone = new Set<string>();

function readSync(id: string): any {
  let sourceState;
  if (pins.has(id)) {
    const index = pins.get(id);
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

function storePins() {
  localStorage.setItem('pins', JSON.stringify([...pins.entries()]))
}

// Pin state for a key to an index in the history array, then trigger render.
export function addPin(id: string, index: number): void {
  pins.set(id, index);
  pinVersion++;
  forceHistoryRender();
  notifyOne(id);
  storePins();
}

export function latestOccurrence(id) {
  if (lastActions.has(id)) {
    return past.length;
  }
  let offset = 0;
  while (offset < past.length) {
    offset++;
    if (past[past.length - offset].lastActions.has(id)) {
      break;
    }
  }

  return past.length - offset;
}

export function isPinnedAtLatest(id) {
  const pinIndex = pins.get(id);
  return pinIndex === latestOccurrence(id);
}

export function pinLatest(id: string) {
  addPin(id, latestOccurrence(id));
}

export function pinInitial(id: string) {
  addPin(id, 0);
}

export function removePin(id: string): void {
  pins.delete(id);
  pinVersion++;
  forceHistoryRender();
  notifyOne(id);
  storePins();
}

function processActionQueue(key: string): void {
  if (!reducerQueue.has(key)) return;

  console.log('running queue for', key);
  const reducer = reducers.get(key);
  // Replay actions

  // To avoid issues while replaying, pins should detect whether
  // any history entries are "skipped over" when using an older pinned value.
  // These can immediately be cleaned up (perhaps moved to sort of branch),
  // to avoid losing state. When this works as described, we can just process the
  // queue against the previous state here.

  let currentState = initialStates.get(key), lastIndex = 0;

  let hadLatest = false;
  for (const [index, action] of reducerQueue.get(key).values()) {
    hadLatest = index >= past.length;
    const entry = index < past.length ? past[index] : {states, lastActions};
    currentState = reducer(currentState, action);
    entry.states.set(key, currentState);
    entry.lastActions.set(key, action);
  }
  // Populate other states with the most recent value.
  // I don't like this but it's needed based on how history now works.
  // Todo: investigate how much memory is involved with putting the same
  // value into a large (~1000) amount of maps.
  let lastValue = undefined;
  for (let i = 0; i < past.length; i++) {
    if (past[i].states.has(key)) {
      lastValue = past[i].states.get(key);
      continue;
    }
    if (lastValue !== undefined) {
      past[i].states.set(key, lastValue);
    }
  }
  if (!hadLatest && lastValue !== initialStates.get(key)) {
    states.set(key, lastValue);
  }

  reducerQueue.delete(key);
}

export function exportHistory() {
  const timeline = [
    ...past.map(({ lastActions }) => [...lastActions.entries()]),
    [...lastActions.entries()],
  ];
  const date = new Date();
  saveAsJsonFile(
    { 
      offset: historyOffset,
      pins: [...pins.entries()],
      initialStates: [...initialStates.entries()] ,
      finalStates: [...states.entries()],
      inspections: getPrevinspections(),
      url: window.location.href,
      timeline,
    },
    `theme-editor-history-${date.toLocaleString()}`
  );
}

export function createTimeline(timeline, store = false) {
  let i = 0;

  for (const actions of timeline) { 
    createEmptyEntry();
    for (const [key, action] of actions) {
        performActionOnLatest(key, action, { force: true, debounceTime: Infinity });
    }
    if (store) {
      storeActions(actions, false, i);
    }
    i++;
  }
}

let historyUrl = localStorage.getItem('originalUrl');

export function importHistory({timeline, initialStates: _initialStates, finalStates, pins: newPins, offset = 0, inspections, url}, frames: HTMLIFrameElement[]) {
  oldStates = pointedStates;
  past = [];
  historyOffset = 0;
  pins = new Map();
  resetInspections();
  deleteStoredHistory();
  
  for (const [key, value] of _initialStates) {
    initialStates.set(key, value);
  }
  createTimeline(timeline, true);
  historyUrl = url;
  if (url) {
    localStorage.setItem('originalUrl', url);
  }

  // Sanity check.
  for (const [key, value] of finalStates) {
    if (states.get(key) !== value) {
      console.log('Unequal value', value, states.get(key));
    }
  }

  pins = new Map(newPins);
  historyOffset = offset;

  localStorage.setItem(INSPECTIONS, JSON.stringify(inspections));

  for (const frame of frames) {
    frame?.contentWindow.postMessage({type: 'reload-inspections'} , window.location.origin)
  }

  setCurrentState();
  checkNotifyAll();
}

// Set up initial state and all handlers for a new key.
function addReducer(id, reducer) {
  reducers.set(id, reducer);
  processActionQueue(id);
}

function subscribe(notify) {
  const id = this;
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
}

function getSnapShot(id) {
    let sourceStates;
    if (pins.has(id)) {
      const index = pins.get(id);
      sourceStates = index >= past.length ? states : past[index].states;
    } else {
      sourceStates = pointedStates;
    }
    return sourceStates.has(id)
      ? sourceStates.get(id)
      : initialStates.get(id);
}

export const interestingKeys = ['THEME_EDITOR', 'uiLayout', 'inspected-index'];

// This function is used to determine which states should be visited when using fast navigation.
// Hard coded to keep it simple for now, it could be user configurable.
export function isInterestingState(lastActions) {
  for (const k of interestingKeys) {
    if (pins.has(k)) continue;
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
  skipHistory?: boolean,
  // Action should only ever be played against the most recent state, canceled otherwise.
  appendOnly?: boolean,
  // Force creation of entry regardless of equality.
  // Needed atm because initial states are not restored properly 100% of the time.
  force?: boolean;
}

// type StateAction = {};

type HistoryEntry = {
  states: Map<string, any>,
  lastActions: Map<string, any>,
};

// All entries in history, from oldest to latest.
let past: HistoryEntry[] = [];
// Discarded future entries when doing edit in past.
let lastAlternate: Map<string, any>[] = JSON.parse(localStorage.getItem('history-alternate') || '[]').map((entries) => new Map(entries));
// The length of history at time of creation of last alternate.
let lastAlternateIndex = parseInt(localStorage.getItem('history-alternate-index') || '0');
function storeAlternate() {
  localStorage.setItem('history-alternate', JSON.stringify(lastAlternate.map(map=>[...map.entries()])));
  localStorage.setItem('history-alternate-index', lastAlternateIndex.toString());
}
export function clearAlternate() {
  if (lastAlternate.length > historyWarnOnUpdateLimit && !confirm(`Clear ${lastAlternate.length} steps?`)) {
    return;
  }
  lastAlternate = [];
  storeAlternate();
  forceHistoryRender();
}
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

export function setStates(newStates: Map<string, any>) {
  oldStates = states;
  for (const entry of newStates.entries()) {
    initialStates.set(...entry);
  }
  states = newStates;
  // reducers = new Map();
  // for (const [k,v] of newStates.entries()) {

  // }
  setCurrentState();
}

export function historyBack(amount = 1, skipPinned = false): void {
  const oldIndex = past.length - historyOffset;
  if (oldIndex < 1) {
    return;
  }

  oldStates = pointedStates;
  // It's possible the amount is more than what's left.
  let offset = Math.min(past.length, historyOffset + amount);

  if (skipPinned) {
    while (offset < past.length && isFullyPinned(past[past.length - offset])) {
       offset++;
    }
  }
  historyOffset = offset;

  checkNotifyAll();
}

export function historyForward(amount = 1, skipPinned = false): void {
  if (historyOffset === 0) {
    return;
  }
  oldStates = pointedStates;

  let offset = Math.max(0, historyOffset - amount);

  if (skipPinned) {
    while (offset > 0 && isFullyPinned(past[past.length - offset])) {
       offset--;
    }
  }

  historyOffset = offset;
  checkNotifyAll();
}

function isFullyPinned(entry: HistoryEntry) {
  for (const key of entry.lastActions.keys()) {
    if (!pins.has(key)) return false;
  }
  return true;
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

  oldStates = pointedStates;
  historyOffset = newOffset;

  checkNotifyAll();
}

export function historyGo(offset): void {
  if (offset === historyOffset || offset > past.length || offset < 0) {
    return;
  }
  historyOffset = offset;
  oldStates = pointedStates;

  checkNotifyAll();
}

export function clearHistory(): void {
  const currentlyInThePast = historyOffset > 0;

  for (const [id, index] of pins.entries()) {
      pins.delete(id);
      // Only pins on older state
      if (index !== historyOffset) {
        const value = index >= past.length ? states.get(id) : past[index].states.get(id);
        pointedStates.set(id, value === undefined ? initialStates.get(id) : value);
      }
  }
  storePins();

  lastActions = !currentlyInThePast ? lastActions : past[past.length - historyOffset].lastActions;;
  past = [];
  historyOffset = 0;
  states = pointedStates;
  initialStates = new Map([...initialStates.entries(), ...pointedStates.entries()]);

  deleteStoredHistory(true, pointedStates);
  localStorage.removeItem('originalUrl');
  setCurrentState();
  forceHistoryRender();
}

export function replayAlternate(): void {
  if (!lastAlternate) {
    return;
  }
  const newAlternate =
    historyOffset === 0
      ? []
      : [
          ...past.slice(past.length - historyOffset + 1).map(({ lastActions }) => lastActions),
          lastActions,
        ];

  // Will get dereferenced when replaying.
  const entries = lastAlternate;
  lastAlternateIndex = past.length - historyOffset;

  let didFirst = false;
  let currentOffset = historyOffset;

  for (const map of entries) {
    let firstOfEntry = true;
    for (const [key, action] of map.entries()) {
      if (!didFirst) {
        performAction(key, action, {force: true});
        didFirst = true;
        firstOfEntry = false;
        continue;
      }
      pointedStates = states;
      performActionOnLatest(key, action, {force: true, debounceTime: firstOfEntry ? 0 : Infinity});
      if (firstOfEntry) {
        firstOfEntry = false;
      }
    }
    currentOffset++;
    storeActions([...map.entries()], false, past.length);
    // console.log('storing', [...map.entries()], false, past.length);
  }

  if (entries.length === 0) {
    // In case no new entries updated the history
    const newLatest = past.at(-historyOffset);
    console.log(past);
    states = newLatest.states;
    // no need to update oldStates, as it didn't change
    lastActions = newLatest.lastActions;
    past = past.slice(0, -historyOffset);
    // Clear future by storing same record again.
    storeActions([...newLatest.lastActions.entries()], true, past.length)
    historyOffset = 0;
  } else {
    historyOffset = Math.min(entries.length, past.length - 1);
  }
  lastAlternate = newAlternate;
  storeAlternate();
  checkNotifyAll();
}

export function createEmptyEntry(): void {
  const entry = {states, lastActions};
  past.push(entry);
  states = new Map(states);
  lastActions = new Map();
}

export function addUnprocessedAction(key, action): void {
  lastActions.set(key, action);
}

export function performAction(id, action, options?: HistoryOptions): void {
  const wasPast = historyOffset > 0;

  // Reliably prevent certain actions from changing history.
  if (wasPast && options?.appendOnly) {
    return;
  }

  const changed = wasPast
    ? performActionOnPast(id, action, options)
    : performActionOnLatest(id, action, options);
  if (!changed) return;

  // Quick and dirty fix, should be safe for now.
  if (typeof action.type === 'function') {
    action.type = action.type.name;
  }
  
  storeActions([...lastActions.entries()], wasPast, past.length);
  notifyOne(id);
}

// This path is the only one that can execute frequently, as actions on top
// of an older state will result in the next action being on the latest state.
export function performActionOnLatest(id, action, options: HistoryOptions = {}): boolean {
  const reducer = reducers.get(id) || simpleStateReducer;
  if (!reducer) {
    console.log('no reducer for', id);
    return false;
  }
  const now = performance.now();

  const pinIndex = pins.get(id);
  const hasPin = pins.has(id);
  const hasPinInPast = hasPin && pinIndex < past.length;

  const baseState = hasPinInPast
    ? past[pinIndex].states.get(id)
    : states.has(id)
    ? states.get(id)
    : initialStates.get(id);

  const newState = reducer(
    baseState,
    // Action can be a function in case of setState.
    typeof action === 'function' ? action(baseState) : action
  );
  if (newState === baseState && !options.force) {
    console.log('no change for', id);
    return false;
  }
  const becameInitialValue = newState === initialStates.get(id);
  // Determine whether debouncing should kick in.
  const slowEnough = now - lastSet >= ('debounceTime' in options ? options.debounceTime : 500);
  const skipHistory = !slowEnough || options?.skipHistory;

  // Afaik there is no possible benefit to having two consecutive identical states in history.
  function lastStateSuperFluous() {
    const prev = past[past.length - 1];
    if (!prev) {
      return false;
    }
    if (prev.states.get(id) !== (becameInitialValue ? undefined : newState)) {
      return false;
    }
    const keys = [...prev.lastActions.keys()];

    // This doesn't account for everything yet: multiple actions can be superfluous together, like width and height.
    return keys.length === 1 && keys[0] === id;
  }
  const skippedHistoryNowSameAsPrevious = skipHistory && lastStateSuperFluous();

  oldStates = states;

  if (!skipHistory) {
    states = new Map(states);
  }
  if (becameInitialValue) {
    states.delete(id);
  } else {
    states.set(id, newState);
  }

  historyOffset = 0;

  if (skipHistory) {
    if (skippedHistoryNowSameAsPrevious) {
      past.splice(past.length - 1);
    }
    lastActions = new Map(lastActions);
  } else {
    past.push({
      states: oldStates,
      lastActions,
    });
    lastActions = new Map();
  }

  // If the previous state was removed from the history because it was duplicate,
  // it should result in a new entry in any subsequent dispatches to the same id.
  // Otherwise, it would be possible to remove multiple recent entries (with different values)
  // just by having the same value for any short amount of time.
  lastSet = skippedHistoryNowSameAsPrevious ? 0 : now;

  lastActions.set(id, action);

  if (hasPin) {
    // If there was a pin on this state, update it to the newly created state.
    addPin(id, past.length);
  }
  return true;
}

function performActionOnPast(id, action, options: HistoryOptions = {}): boolean {
  const reducer = reducers.get(id) || simpleStateReducer;
  if (!reducer) {
    return false;
  }
  if (lastAlternate.length > historyWarnOnUpdateLimit && !options.force) {
    if (!window.confirm(`You're about to lose ${lastAlternate.length} stashed changes, proceed?`)) {
      return false;
    }
  }

  const now = performance.now();
  const baseIndex = past.length - historyOffset;
  const prevEntry = past[baseIndex];
  const prevStates = prevEntry.states;
  const pinIndex = pins.has(id) ? pins.get(id) : baseIndex;
  const baseStatesWithPin = past[pinIndex]?.states || states;

  const baseState = baseStatesWithPin.has(id) ? baseStatesWithPin.get(id) : initialStates.get(id);
  const newState = reducer(
    baseState,
    // Action can be a function in case of setState.
    typeof action === 'function' ? action(baseState) : action
  );
  if (newState === baseState && !options.force) {
    return false;
  }
  const pinUpdates = new Map();
  // The extra actions that are added when future pins are preserved.
  const futurePinActions = new Map();

  // If the pinned state was produced by multiple actions that are in the discarded
  // part of history, we'll create separate new entries for these.
  const partialPinActions = [];

  let hasFuturePins = false;
  const oldPins = pins.entries();
  for (const [id, index] of oldPins) {
    if (index > baseIndex) {
      hasFuturePins = true;
      if (index >= past.length) {
        pinUpdates.set(id, states.get(id));
        futurePinActions.set(id, lastActions.get(id));
      } else {
        pinUpdates.set(id, past[index].states.get(id));
        futurePinActions.set(id, past[index].lastActions.get(id));
      }
      const max = Math.min(index, past.length - 1);
      // Collect actions only of reducer-based state.
      for (let i = baseIndex + 1; i < max; i++) {
        const action = past[i].lastActions.get(id);
        if (action !== undefined && action.type) {
          partialPinActions.push([id, action, past[i].states.get(id)]);
        }
      }
      pins.set(id, baseIndex + 1);
    }
  }
  for (const id of pinUpdates.keys()) {
    pins.set(id, baseIndex + partialPinActions.length + 1);
  }
  // const isNowDefaultState = newState === initialStates[id];
  // const previousAlsoDefaultState = isNowDefaultState && baseIndex && !(id in past[baseIndex - 1].states);
  // const {[id]: _, ...otherStates} = !isNowDefaultState ? {} : baseStates;

  const prevHistory = historyOffset === 1 ? past : past.slice(0, -historyOffset + 1);
  lastAlternate = [...past.slice(past.length - historyOffset + 1)
    .filter(({lastActions}) => !([...pinUpdates.keys()].some(k => lastActions.has(k))))
    .map(({lastActions}) => lastActions), lastActions];
  lastAlternateIndex = past.length - historyOffset;
  storeAlternate();
  if (hasFuturePins) {
    let base = prevStates;
    let i = 0;
    for (const [id, action, state] of partialPinActions) {
      const entry = new Map<string, any>(base);
      entry.set(id, state);
      prevHistory.push({
        states: entry,
        lastActions: new Map([[id, action]]),
      });
      storeActions([[id, action]], 1, baseIndex + i + 1);
      base = entry;
      i++;
    }
    const entry = new Map<string, any>([...base, ...pinUpdates]);
    prevHistory.push({
      states: entry,
      lastActions: futurePinActions,
    });
    storeActions([...futurePinActions.entries()], 1, baseIndex + partialPinActions.length + 1);
  }
  if (pins.has(id)) {
    // If there was a pin on this state, update it to the newly created state.
    addPin(id, prevHistory.length);
  }
 
  states = new Map([...prevStates, ...pinUpdates]);
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

  return true;
}

export let forceHistoryRender = () => {};

function setCurrentState() {
  pointedStates =
    historyOffset > 0
      ? past[past.length - historyOffset].states
      : states;
}

function storeOffset() {
  localStorage.setItem('historyOffset', historyOffset.toString());
}

export function restoreOffset() {
  historyOffset = Math.max(0, Math.min(past.length, parseInt(localStorage.getItem('historyOffset')|| '0')));
  oldStates = new Map();
  // for now assumes that actions were restored without change propagation
  checkNotifyAll();
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
  storeOffset();
  const keyNotifiers = notifiers.get(id);
  if (keyNotifiers) {
    for (const n of keyNotifiers.values()) {
      n();
    }
  }
  forceHistoryRender();
}

function checkNotifyAll() {
  setCurrentState();
  storeOffset();

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

  useLayoutEffect(() => {
    forceHistoryRender = () => forceRender({});
    return () => {
      forceHistoryRender = () => {};
    };
  } ,[]); 

  return (
    <HistoryNavigateContext.Provider value={{
      past,
      historyOffset,
      lastActions,
      pointedStates,
      initialStates,
      previewComponents,
      pins,
      states,
      lastAlternate,
      lastAlternateIndex,
      historyUrl,
    }}>
      {children}
    </HistoryNavigateContext.Provider>
  );
}

export type StateAndUpdater<T> = [
  T,
  (
    updater: T | ((state: T) => T ) | Action<T>,
    options?: HistoryOptions
  ) => void
];

export function useResumableReducer<T>(
  reducer,
  initialState: T,
  initializer = (s) => s,
  id: string
): StateAndUpdater<T> {
  if (!initialStates.has(id)) {
    const state =
      typeof initializer === 'function'
        ? initializer(initialState)
        : initialState;
    initialStates.set( id, state);
  }
  if (reducer !== simpleStateReducer && !reducers.has(id)) {
    // First one for an id gets to add the reducer.
    addReducer(id, reducer);
  }

  const currentState = useSyncExternalStore(
    subscribe.bind(id),
    getSnapShot.bind(null, id),
  );

  return [currentState as T, performAction.bind(null, id)];
}

export function useDispatcher(id: string) {
  const dispatcher = performAction.bind(null, id);
  if (!dispatcher) {
    throw new Error(`Attempted to use dispatcher for ${id}, but it doesn't exist yet.`)
  }
  return dispatcher;
}

const simpleStateReducer = (s, v) => v;

export function useResumableState<T>(
  id: string,
  initial: T | (() => T)
): StateAndUpdater<T> {
  return useResumableReducer(
    simpleStateReducer,
    null,
    // This runtime check is not great, but we have to do it to have the same signature and behavior
    // as React's useState, so that it can be a drop in replacement as much as possible.
    // TS complains about the function call, but it just doesn't detect the execution context.
    () => (typeof initial === 'function' ? initial() : initial),
    id
  );
}
