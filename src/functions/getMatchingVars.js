export const allStateSelectorsRegexp = /:(active|focus(-(visible|within))?|visited|hover|disabled|:[\w-]+)/g;

export const residualNotRegexp = /:not\([\s,\*]*\)/g;

function includeDescendants(selector) {
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
    return `${selector}, ${selector.replace(',', ' *,')} *`;
}

function matchVar (cssVar, target) {
  if (typeof target.matches !== 'function') {
    return false;
  }

  const combinedSelector = cssVar.uniqueSelectors
    .map(includeDescendants)
    .join();

  const cleanedSelector = combinedSelector
    .replace(allStateSelectorsRegexp, '')
    .replace(/:?:(before|after|first\-letter)/g, '')
    .replaceAll(residualNotRegexp, '')
    .trim()
    .replace(/^,/, '')
    .replace(/,$/, '')
    .replaceAll(/,(\s*,)+/g, ',');

  if (combinedSelector === '') {
    return false;
  }

  try {
    // Remove residual empty not-selectors after removing pseudo states.
    return target.matches(cleanedSelector);
  } catch (e) {
    if (!/^:/.test(combinedSelector)) {
      console.log('Failed testing a selector, and it is not because it only matches a pseudo selector.', cssVar);
      console.log(cleanedSelector, combinedSelector);
    }
    return false;
  }
};

export const getMatchingVars = ({ cssVars, target }) => {

  try {
    return cssVars.filter(cssVar => matchVar(cssVar, target));
  } catch (e) {
    console.log(target, e);
    return [];
  }
};

