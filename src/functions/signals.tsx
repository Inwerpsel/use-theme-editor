import { use } from "../state";
import { BunchOfHooks } from "./getters";

// For now this uses the object literal directly for simplicity.
type Signals = {
  [P in keyof typeof use]: ReturnType<(typeof use)[P]>[0];
}

export function signals(use: BunchOfHooks): Signals  {
  const signals = {} as Signals;

  // Todo: Check at compile time which signals are actually used.

  for (const k in use) {
    const Signal = () => use[k]()[0];
    // We create the element here already. It can be returned in multiple places.
    const $signal = <Signal />;

    Object.defineProperty(signals, k, {
      get() {
        return $signal;
      },
   });
  }
  
  return signals;
}