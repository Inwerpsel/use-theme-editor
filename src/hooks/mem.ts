import { EasyAccessors } from "../functions/getters";
import { get } from "../state";

const cache = new Map<string, [any, {}]>();

const captureState = {_deps: {}};
// This relies on all hook calls happening in a way that can be intercepted.
// Will enforce later with types.
export function createMagicObject(use): void {
  
  for (const k in use) {
    Object.defineProperty(captureState, k, {
      get() {
        // Open question: how to reasonably link this to an application's collection of hooks?
        // Currently, I'm just importing this collection directly to keep things simple.
        const v = get[k];
        captureState._deps[k] = v;
        return v;
      },
    });
  }
}

function runAndCapture(create) {
  const origDeps = captureState._deps;
  captureState._deps = {};
  const result = create(captureState);
  const newDeps = captureState._deps;
  captureState._deps = origDeps;

  return [result, newDeps];
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

// Because writing a separate function is not very ergonomical, especially for very simple logic,
// it's much more convenient to support anonymous functions.
// This imposes some rules upon the anonymous function because the source code is used as unique identifier.
// Only usage of hooks or literals is allowed.
// Technically a variable that doesn't change is fine, but still risky.
// TODO: Write a validator, similar to the rules of hooks.
export function mem<T>(create: (state: EasyAccessors) => T): T {
  // All browsers except Safari implement a change since ES2018 that forces JS engines
  // to return the function source code verbatim when calling toString(). Prior to this change, browsers would in fact
  // not keep around the source string and derive the string representation on the fly, which
  // does involve quite a lot of steps.
  // However, because this representation cannot accomodate comments and whitespace,
  // most browsers now implement toString() by keeping the original string in memory.
  // As a result, using the source string as a key should have very good performance, yay!
  // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/toString
  const key = create.toString();

  if (cache.has(key)) {
    const [cached, cachedState] = cache.get(key);
    const [latestState, hasChanged] = getLatestValues(cachedState);

    if (!hasChanged) {
      return cached;
    }

    const value = create(latestState as EasyAccessors);
    cache.set(key, [value, latestState])

    return value;
  }

  const [result, state] = runAndCapture(create);
  cache.set(key, [result, state]);

  return result;
}

// Incomplete attempt at a version that can memo based on args.
// In my use case every memo depends on data that is not retrieved from hooks,
// but instead coming in through a prop in the main component.
// It would be nice to do the same thing as above, but without requiring all args to be hooks.
// Even if multi map works and is efficient, invalidating old entries is likely pretty hard.

// function __incomplete__GetCached(func: (any) => any, args: {} ) {
//   // Get result from multi map of func + args.

//   for (const [key, value] of Object.entries(args)) {

//   }

//   // Nothing found
//   return null;
// }

// function calculateArea(width: number, height: number, scale: number) {
//   return width * height * scale;
// }

// function useMemoedArea() {
//   const {width, height, scales} = get;

//   // Todo in TS: remaining arguments should be the arguments of calculateArea.
//   return __incomplete__memoGlobal(calculateArea, width, height, Number(scales[`${width}x${height}`]));
// }

// function __incomplete__memoGlobal(func: (...args: any[]) => any, ...args: any[]): any {
//   const fromCache = __incomplete__GetCached(func, args);

//   if (fromCache !== null) { 
//     return fromCache;
//   }

//   // Create object to 
// }