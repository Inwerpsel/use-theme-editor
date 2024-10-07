export const allStateSelectorsRegexp = /:(active|focus(-(visible|within))?|visited|hover|disabled|:[\w-]+)/g;

export const residualNotRegexp = /:not\([\s,\*]*\)/g;

export function includeDescendants(selector) {
  if (selector === '' || selector === '*' || selector === ':root') {
    // When selector is only pseudo elements (e.g. ::placeholder),
    // we want to show it on root element.
    return '*';
  }
  return `${selector}, :where(${selector}) *`.replace('\\\\', '\\');
}

let selectorCache;

function matchVar (cssVar, target) {
  if (typeof target.matches !== 'function') {
    return false;
  }
  const selector = cssVar.statelessSelector;

  if (selectorCache.has(selector)) {
    return selectorCache.get(selector);
  }

  try {
    const matches = target.matches(selector);
    selectorCache.set(selector, matches);

    return matches;
  } catch (e) {
    console.log('Failed testing a selector', cssVar);
    return false;
  }
};

const cache = new WeakMap();

export const getMatchingVars = ({ cssVars, target }) => {
  if (cache.has(target)) {
    return cache.get(target);
  }
  selectorCache = new Map();

  let result;
  try {
    result = cssVars.filter(cssVar => matchVar(cssVar, target));
  } catch (e) {
    console.log(target, e);
    result = [];
  }

  cache.set(target, result);

  return result;
};
