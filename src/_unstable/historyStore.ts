import { addUnprocessedAction, createEmptyEntry, forceHistoryRender, initialStates, performActionOnLatest, reducerQueue, reducers, restoreLocks, restoreOffset, setStates } from "../hooks/useResumableReducer";
import { INSPECTIONS } from "../renderSelectedVars";

let db;
const DBOpenRequest = window.indexedDB.open('history', 1);

const ACTIONS = 'actions';

DBOpenRequest.onupgradeneeded = function(event) { 
    const db = event.target.result;

    db.onerror = function(event) {
        console.log('upgrade failed', event);
    };

    db.createObjectStore(ACTIONS, { autoIncrement: true });  

    // objectStore.createIndex('year', 'year', { unique: false });
};

const snapshotKey = 'history-start-snapshot';

let snapshot = JSON.parse(localStorage.getItem(snapshotKey));

let i = 0;
let needsSnapshot: boolean;
DBOpenRequest.onsuccess = function (event) {
    // Quick fix to exclude frame
    if (window.self !== window.top) return;
    db = DBOpenRequest.result;
};

export function restoreHistory() {
    if (window.self !== window.top) return;
    const transaction = db.transaction([ACTIONS], 'readonly');
    const store = transaction.objectStore(ACTIONS);

    store.getAll().onsuccess = event => {
        console.time('Restore history');
        const records = event.target.result;
        setStates(new Map(snapshot));

        for (const actions of records) {
            if (!actions?.length) {
                continue;
            }
            createEmptyEntry();
            for (const [key, action] of actions) {
                if (!reducers.has(key)) {
                    console.log('Create queue item');
                    if (!reducerQueue.has(key)) reducerQueue.set(key, []);
                    reducerQueue.get(key).push([i + 1, action]);
                    addUnprocessedAction(key, action);
                } else {
                    performActionOnLatest(key, action, { debounceTime: Infinity });
                }
            }
            i++;
        }
        console.timeEnd('Restore history');

        needsSnapshot = i === 0;
        restoreLocks();
        restoreOffset();
    };
}

// problem:
// - If an action was done against a locked state, we need to keep track of this base index
//   so that it can be applied when replaying.
export function storeActions(actions: [string, any][], clearFuture, index, prevStates = null): void {
    if (needsSnapshot) {
        const snap = JSON.stringify([...initialStates.entries(), ...prevStates.entries()]);
        console.log('snap', snap);
        localStorage.setItem(snapshotKey, snap);
        needsSnapshot = false;
        snapshot = snap;
    }
    const transaction = db.transaction([ACTIONS], 'readwrite');
    const store = transaction.objectStore(ACTIONS);

    if (clearFuture) {
        const range = IDBKeyRange.lowerBound(index);
        store.delete(range);
    }
    store.put(actions, index);
}

export function deleteStoredHistory() {
    const start = performance.now()
    const transaction = db.transaction([ACTIONS], 'readwrite');
    transaction.oncomplete = e => { console.log('Deleted store in', performance.now( ) - start) }
    const store = transaction.objectStore(ACTIONS);

    store.clear();
    localStorage.removeItem(snapshotKey);
    localStorage.removeItem(INSPECTIONS);
    needsSnapshot = true;

    console.log('Start store delte transaction in ', performance.now( ) - start) 
}