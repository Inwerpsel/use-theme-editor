import { useEffect, useState } from 'react';

const base = `${document.documentElement.dataset.base}`;
const [,rawNs] = base.split(window.location.origin);
const namespace = (rawNs || '').replace(/^\//, '').replace(/\/$/, '');

export const useLocalStorage = (key, defaultValue) => {
  const scopedKey = !namespace ? key : `${namespace || ''}${key}`;

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
}
