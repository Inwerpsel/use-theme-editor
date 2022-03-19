let localStorageNamespace = '';

export function setLocalStorageNamespace(namespace) {
  localStorageNamespace = namespace;
}

export const getLocalStorageNamespace = () => localStorageNamespace;
