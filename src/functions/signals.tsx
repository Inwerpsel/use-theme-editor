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
    const hook = use[k];
    // Uppercase name so it can be used in JSX element.
    const Signal = () => hook()[0];
    // We create the element here already. It can be returned in multiple places.
    const $signal = <Signal />;
    // React does nothing with this object beyond putting it in the DOM as a textnode and
    // running its function.
    // This frees up the signal to be also used as a primitive value.

    // The result is you inject hooks into any existing component and it will 
    // still be used as a signal if that component only puts it in the tree.
    // If the component uses the primitive value, it will be as though it was
    // written with the injected hook. As a result, the rules of hooks
    // have to be respected for this prop. This is a challenge to
    // validate, especially since it needs to happen on external dependencies,
    // but seems possible. 
    // Note that this only applies if it's used as a hook. If the value is interpolated
    // in JSX, it can be anywhere.

    // It allows some interesting optimizations. In the best case scenario, the 
    // value is only reflected in a small element way down the tree, and subsequent 
    // renders would only need to target those elements, and wouldn't start in the 
    // component that now injects the signal (rather than calling a hook in its own scope).
    // Within this, the even better case is it's only used in JSX. Even the component
    // that uses it won't rerender on changes, just the signal element.
    // Particularly for values injected into external libraries it can allow optimizations
    // that are not otherwise possible.

    // Getting this sorted in TypeScript could get crazy. Existging code will probably scream
    // about a signal being used in a prop. But if you think about it, a primitive value is also
    // an object, with interfaces that might be called during operations on primitives. If an object
    // can allow for the same operations with the same result, it should be possible to capture this
    // in the type definition. These things are deliberately supported by the JavaScript spec, 
    // and exist for use cases like this.
    $signal.toString = Signal;

    signals[k] = $signal;
  }
  
  return signals;
}