export const getLocalStorageNamespace = () => {
  const base = `${document.documentElement.dataset.base}`;

  if (!base) {
    return '';
  }

  const [, rawNs] = base.split(window.location.origin);

  if (!rawNs || rawNs === '/') {
    return '';
  }

  return rawNs.replace(/^\//, '').replace(/\/*$/, '') + '/';
};
