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

let cache;

function matchVar (cssVar, target) {
  if (typeof target.matches !== 'function') {
    return false;
  }
  const selector = cssVar.statelessSelector;

  if (cache.has(selector)) {
    return cache.get(selector);
  }

  try {
    const matches = target.matches(selector);
    cache.set(selector, matches);

    return matches;
  } catch (e) {
    console.log('Failed testing a selector', cssVar);
    return false;
  }
};

export const getMatchingVars = ({ cssVars, target }) => {
  cache = new Map();

  try {
    return cssVars.filter(cssVar => matchVar(cssVar, target));
  } catch (e) {
    console.log(target, e);
    return [];
  }
};
