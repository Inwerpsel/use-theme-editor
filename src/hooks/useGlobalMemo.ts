import { EasyAccessors } from "../functions/getters";
import { get, use } from "../state";

const cache = new Map<(state: {}) => any, [any, {}]>();

let magicObject = {_deps: {}};
// This relies on all hook calls happening in a way that can be intercepted.
// Will enforce later with types.
export function createMagicObject(use): void {
  
  for (const k in use) {
    Object.defineProperty(magicObject, k, {
      get() {
        // Open question: how to reasonably link this to an application's collection of hooks?
        // Currently, I'm just importing this collection directly to keep things simple.
        const v = get[k];
        magicObject._deps[k] = v;
        return v;
      },
    });
  }
}

function runAndCapture(create) {
  magicObject._deps = {};
  const result = create(magicObject);

  return [result, magicObject._deps];
}

function getLatestValues(old: {}): [{}, boolean] {
  const state = {};
  let hasChanged = false;

  for (const k in old) {
    // This will call hooks in a loop, but it should be the same sequence as the create function.
    const latestValue = get[k];
    if (old[k] !== latestValue) { 
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
export function memo<T>(create: (state: EasyAccessors|{}) => T): T {
  if (cache.has(create)) {
    const [cached, cachedState] = cache.get(create);
    // This should be guaranteed to run the same hooks as are called during capturing.
    const [latestState, hasChanged] = getLatestValues(cachedState);

    const value = hasChanged ? create(latestState) : cached;
    if (hasChanged) {
      cache.set(create, [value, latestState])
    }
    // console.log( hasChanged ? 'RECALC' : 'CACHED' , create.name, value)

    return value;
  }

  const [result, state] = runAndCapture(create);
  cache.set(create, [result, state]);

  // console.log('NEW', create.name, result)

  return result;
}

const cacheAnon = new Map<string, [any, {}]>();

// Because writing a separate function is not very ergonomical, especially for very simple logic,
// it's much more convenient to support anonymous functions.
// This imposes some rules upon the anonymous function because the source code is used as unique identifier.
// Only usage of hooks or literals is allowed.
// Technically a variable that doesn't change is fine, but still risky.
// TODO: Write a validator, similar to the rules of hooks.
export function memoAnon<T>(create: (state: EasyAccessors) => T): T {
  // TODO: Check how expensive this is, and how it scales with function source size.
  // Does the browser have this string at hand already? Or is it derived from another representation of the
  // function? In the latter case it could be costly.
  // Most anonymous functions are quite short, though. If needed hashing them might make sense.
  // Then again, there are not that many use cases in any given app, so probably you'll never get more than a 
  // few tens of these anonymous functions being globally memo'd.
  const key = create.toString();
  if (cacheAnon.has(key)) {
    const [cached, cachedState] = cacheAnon.get(key);
    // This should be guaranteed to run the same hooks as are called during capturing.
    const [latestState, hasChanged] = getLatestValues(cachedState);

    const value = hasChanged ? create(latestState as EasyAccessors) : cached;
    if (hasChanged) {
      cacheAnon.set(key, [value, latestState])
    }
    // console.log( hasChanged ? 'RECALC' : 'CACHED' , key, value)

    return value;
  }

  const [result, state] = runAndCapture(create);
  cacheAnon.set(key, [result, state]);

  // console.log('NEW', key, result)

  return result;
}

// There is no usage in this repo yet, unfortunately.
{
  // Example.
  // This is not actually expensive, but it's easy to test.
  
  function calculateArea({width, height, scales}: typeof get) {
    const scale = Number(scales[`${width}x${height}`]);
    return width * height * scale;
  }

  function useArea() {
    // Look ma, no deps!
    return memo(calculateArea);
  }
}

// Incomplete attempt at a version that can memo based on args.
// In my use case every memo depends on data that is not retrieved from hooks,
// but instead coming in through a prop in the main component.
// It would be nice to do the same thing as above, but without requiring all args to be hooks.
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