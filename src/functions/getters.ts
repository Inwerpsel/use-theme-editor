import { use } from "../state";

export interface BunchOfHooks {
  [index: string]: () => any[]
};

// For now this uses the object literal directly for simplicity.
export type EasyAccessors = {
  [P in keyof typeof use]?: ReturnType<(typeof use)[P]>[0];
}

export function getters(use: BunchOfHooks): EasyAccessors {
  const get = {};

  for (const k in use) {
    Object.defineProperty(get, k, {
      get() {return use[k]()[0]},
      set() {
        throw new Error('Only for getting');
      },
    });
  }
  
  return get;
}
