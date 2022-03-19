import { useEffect, useState } from 'react';
import {getLocalStorageNamespace} from '../functions/getLocalStorageNamespace';

const namespace = getLocalStorageNamespace();

function apply(type, value) {
  switch (type) {
  case 'object': {
    if (value === 'null') {
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
  const scopedKey = namespace + key;
  // This means the default value's type determines whether an object can be stored.
  // Care should be taken with this argument, ideally it's a literal value.
  const type = _type || typeof defaultValue;
  const isObject = typeof defaultValue === 'object';

  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(scopedKey);
    if (stored === null) {
      return defaultValue;
    }
    return apply(type, stored);
  });

  useEffect(() => {
    localStorage.setItem(scopedKey, isObject ? JSON.stringify(value) : value);
  }, [value]);

  // useEffect(() => {
  //   const interval = window.setInterval(() => {
  //     if (localStorage.getItem(scopedKey) !== value) {
  //
  //     }
  //   }, 100);
  // });

  return [
    value,
    setValue
  ];
};
