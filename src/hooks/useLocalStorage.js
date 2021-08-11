import { useEffect, useState } from 'react';
import {getLocalStorageNamespace} from '../getLocalStorageNamespace';

const namespace = getLocalStorageNamespace();

export const useLocalStorage = (key, defaultValue) => {
  const scopedKey = namespace + key;
  const isObject = typeof defaultValue === 'object';

  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(scopedKey);
    if (stored === null) {
      return defaultValue;
    }
    return isObject ? JSON.parse(stored) : stored;
  });

  useEffect(() => {
    localStorage.setItem(scopedKey, isObject ? JSON.stringify(value) : value);
  }, [value]);

  return [
    value,
    setValue
  ];
};
