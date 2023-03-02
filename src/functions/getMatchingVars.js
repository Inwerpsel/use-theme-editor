export const allStateSelectorsRegexp = /:(active|focus(-(visible|within))?|visited|hover|disabled|:[\w-]+)/g;

export const residualNotRegexp = /:not\([\s,\*]*\)/g;

export function includeDescendants(selector) {
    // const isBodySelector = !!selector.match(/^body(\.[\w-]*)?$/);
    // const isRootSelector = selector.trim() === ':root';
    // const isGlobalSelector = isBodySelector || isRootSelector;

    // if (!isRootSelector && /^:/.test(selector)) {
    //   // Quick hack. These are filtered below.
    //   return null;
    // }

    // Prevent body selector from always showing up, unless a body or paragraph was clicked.
    // const shouldIncludeStar = !isGlobalSelector || ['p', 'body', 'h'].includes(target.tagName?.toLowerCase().replace(/\d$/, ''));
    // const shouldIncludeStar = true;

    // Remove any pseudo selectors that might not match the clicked element right now.
    return `${selector}, :where(${selector}) *`;
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

