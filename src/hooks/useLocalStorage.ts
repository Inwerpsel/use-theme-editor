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

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (arg: T) => void] {
  const scopedKey = getLocalStorageNamespace() + key;
  const type = typeof defaultValue;
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