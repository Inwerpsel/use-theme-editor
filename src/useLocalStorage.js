import { useEffect, useState } from 'react';
import {getLocalStorageNamespace} from './getLocalStorageNamespace';

const namespace = getLocalStorageNamespace();

export const useLocalStorage = (key, defaultValue) => {
  const scopedKey = namespace + key;

  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(scopedKey);

    return stored === null ? defaultValue : stored;
  });

  useEffect(() => {
    localStorage.setItem(scopedKey, value);
  }, [value]);

  return [
    value,
    setValue
  ];
};
