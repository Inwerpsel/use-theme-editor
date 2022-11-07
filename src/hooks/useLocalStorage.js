import { useState } from 'react';
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

// Use _type only if you want nullable things.
export const useLocalStorage = (key, defaultValue, _type = null) => {
  const scopedKey = getLocalStorageNamespace() + key;
  // This means the default value's type determines whether an object can be stored.
  // Care should be taken with this argument, ideally it's a literal value.
  // In case of any doubt about the type use the third argument.
  const type = _type || typeof defaultValue;
  const isObject = type === 'object';

  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(scopedKey);
    if (stored === null) {
      return defaultValue;
    }
    return apply(type, stored);
  });

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
};

export function useResumableLocalStorage(key, defaultValue, _type = null) {
  const scopedKey = getLocalStorageNamespace() + key;
  // This means the default value's type determines whether an object can be stored.
  // Care should be taken with this argument, ideally it's a literal value.
  // In case of any doubt about the type use the third argument.
  const type = _type || typeof defaultValue;
  const isObject = type === 'object';

  const [value, setValue] = useResumableState(() => {
    const stored = localStorage.getItem(scopedKey);
    if (stored === null) {
      return defaultValue;
    }
    return apply(type, stored);
  }, scopedKey);

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