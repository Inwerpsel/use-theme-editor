import { useEffect, useState } from 'react';
import {getLocalStorageNamespace} from '../getLocalStorageNamespace';

const namespace = getLocalStorageNamespace();

function apply(type, value) {
  switch (type) {
  case 'object': {
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

export const useLocalStorage = (key, defaultValue) => {
  const scopedKey = namespace + key;
  // This means the default value's type determines whether an object can be stored.
  // Care should be taken with this argument, ideally it's a literal value.
  const type = typeof defaultValue;
  const isObject = typeof defaultValue === 'object';

  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(scopedKey);
    if (stored === null) {
      return defaultValue;
    }
    return apply(type, value);
  });

  useEffect(() => {
    localStorage.setItem(scopedKey, isObject ? JSON.stringify(value) : value);
  }, [value]);

  return [
    value,
    setValue
  ];
};
