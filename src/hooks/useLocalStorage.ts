import { useInsertionEffect, useState } from 'react';
import {getLocalStorageNamespace} from '../functions/getLocalStorageNamespace';
import { useResumableState } from './useResumableReducer';

function apply(type, value) {
  switch (type) {
  case 'object': {
    if (value === 'null' || value === 'undefined') {
      return null;
    }
    return JSON.parse(value);
  }
  case 'boolean': {
    return !!value && value !== 'false';
  }
  case 'number': {
    return Number(value);
  }
  default: {
    return value;
  }
  }
}
type SetsOfDispatchers = {
  [key: string]: Set<(...arg: any) => void>
}

const readProxy = {};
const setters = {};
const initializers = {};
const dispatchers: SetsOfDispatchers = {};

// This function takes a fundamentally different approach to global state subscriptions than useSyncExternalStore.
// Components add their local state dispatchers to a set. The wrapping dispatcher then just iterates this set with any new value.
// It may seem odd to have both approaches in the same repo, but this also seems a simple approach that so far works just fine.
// Maybe both approaches have their own merits, or one is clearly better. Honestly I can't tell at the moment.
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (arg: T) => void] {
  // Todo: Find a more generally applicable way to namespace.
  const scopedKey = getLocalStorageNamespace() + key;
  const type = typeof defaultValue;
  const isObject = type === 'object';
  const isRepeat = initializers.hasOwnProperty(key);

  const initializer = isRepeat ? initializers[key] : () => {
    let storedOrDefaultValue;

    if (readProxy.hasOwnProperty(key)) {
      storedOrDefaultValue = readProxy[key];
    } else {
      // Do first time setup for key.
      const stored = localStorage.getItem(scopedKey);
      const storedValue = stored === null ? defaultValue : apply(type, stored);
      readProxy[key] = storedValue;
      dispatchers[key] = new Set();

      setters[key] = arg => {
        const newValue = typeof arg === 'function' ? arg(readProxy[key]) : arg;
        localStorage.setItem(
          scopedKey,
          !isObject ? newValue : JSON.stringify(newValue),
        );
        readProxy[key] = newValue;
        for (const setValue of dispatchers[key].values()) {
          setValue(newValue);
        }
      }

      storedOrDefaultValue = storedValue;
    }

    return storedOrDefaultValue;
  }
  if (!isRepeat) {
    initializers[key] = initializer;
  }

  const [value, setValue] = useState(initializer);

  // Insertion effect as the dispatchers should be usable (or gone) for all subsequent effects.
  useInsertionEffect(() => {
    dispatchers[key].add(setValue);
    return () => {
      dispatchers[key].delete(setValue);
    }
  }, []);

  return [
    value,
    setters[key],
  ];
};

export function useResumableLocalStorage<T>(key: string, defaultValue: T): [T, (arg: T) => void] {
  const scopedKey = getLocalStorageNamespace() + key;
  const type = typeof defaultValue;
  const isObject = type === 'object';

  const [value, setValue] = useResumableState(() => {
    const stored = localStorage.getItem(scopedKey);
    if (stored === null) {
      return defaultValue;
    }
    return apply(type, stored);
  }, key);

  return [
    value,
    arg => {
      const newValue = typeof arg === 'function' ? arg(value) : arg;
      localStorage.setItem(
        scopedKey,
        !isObject ? newValue : JSON.stringify(newValue)
      );
      setValue(newValue);
    }
  ];
}
