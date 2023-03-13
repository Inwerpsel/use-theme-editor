import { use } from "../state";

// Crucial about this signature is that it uses argumentless hooks.
// This allows to create an easy accessor that in turn allows efficient destructuring.
export interface BunchOfHooks {
  [index: string]: () => any[]
};

// For now this uses the object literal directly for simplicity.
export type EasyAccessors = {
  [P in keyof typeof use]: ReturnType<(typeof use)[P]>[0];
}

export function getters(use: BunchOfHooks): EasyAccessors {
  const get = {} as EasyAccessors;

  for (const k in use) {
    const hook = use[k];
    Object.defineProperty(get, k, {
      // Call the hook and return just the value, ignoring the dispatcher or any other contents of the result array.
      get() {
        return hook()[0]
      },
    });
  }
  
  return get;
}
