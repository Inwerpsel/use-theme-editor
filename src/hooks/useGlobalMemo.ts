import { BunchOfHooks } from "../functions/getters";
import { get, use } from "../state";

const cache = new Map<(state: {}) => any, [any, {}]>();

// This relies on all hook calls happening in a way that can be intercepted.
// Will enforce later with types.
function createMagicObject(): {_deps: {}, [index: string]: any} {
  const capture = {_deps: {}};
  
  for (const k in use) {
    Object.defineProperty(capture, k, {
      get() {
        // Open question: how to reasonably link this to an application's collection of hooks?
        // Currently, I'm just importing this collection directly to keep things simple.
        const v = get[k];
        capture._deps[k] = v;
        return v;
      },
      set() {
        throw new Error('Only for getting');
      },
    });
  }
  
  return capture;
}

function runAndCapture(create) {
  const magicObject = createMagicObject();
  const result = create(magicObject);

  return [result, magicObject._deps];
}

function getLatestValues(old: {}): [{}, boolean] {
  const state = {};
  let hasChanged = false;

  for (const [k, oldValue] of Object.entries(old)) {
    // This will call hooks in a loop, but it should be the same sequence as the create function.
    const latestValue = get[k];
    if (oldValue !== latestValue) { 
      hasChanged = true;
    }
    state[k] = latestValue;
  }

  return [state, hasChanged];
}

// Usage: only with function literals, or other way to guarantee a stable instance.
// I don't know yet how to handle cleaning up old instances if they can change.
// Currently this would result in the cache getting bigger over time.

// If a function respects the rules of hooks, you can intercept the calls,
// and replay them to avoid running the function + check if recalc needs to happen.
export function useGlobalMemo(create: (state: BunchOfHooks|{}) => any) {
  if (cache.has(create)) {
    const [cached, cachedState] = cache.get(create);
    // This should be guaranteed to run the same hooks as are called during capturing.
    const [latestState, hasChanged] = getLatestValues(cachedState);

    const value = hasChanged ? create(latestState) : cached;
    if (hasChanged) {
      cache.set(create, [value, latestState])
    }
    return value;
  }

  const [result, state] = runAndCapture(create);
  cache.set(create, [result, state]);

  return result;
}

// There is no usage in this repo yet, unfortunately.

{
  // Examples.
  function calculateArea({width, height, scales}) {
    const scale = Number(scales[`${width}x${height}`]);
    console.log(`calculating area ${width} x ${height} x ${scale}`);
    return width * height * scale;
  }

  function useArea() {
    return useGlobalMemo(calculateArea);
  }
}

// Incomplete attempt at a version that can memo based on args.
// Even if multi map works and is efficient, invalidating old entries is likely pretty hard.

function __incomplete__GetCached(func: (any) => any, args: {} ) {
  // Get result from multi map of func + args.

  for (const [key, value] of Object.entries(args)) {

  }

  // Nothing found
  return null;
}

function calculateArea(width: number, height: number, scale: number) {
  return width * height * scale;
}

function useMemoedArea() {
  const {width, height, scales} = get;

  // Todo in TS: remaining arguments should be the arguments of calculateArea.
  return __incomplete__memoGlobal(calculateArea, width, height, Number(scales[`${width}x${height}`]));
}

function __incomplete__memoGlobal(func: (...args: any[]) => any, ...args: any[]): any {
  const fromCache = __incomplete__GetCached(func, args);

  if (fromCache !== null) { 
    return fromCache;
  }

  // Create object to 
}