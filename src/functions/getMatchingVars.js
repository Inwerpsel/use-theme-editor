export const allStateSelectorsRegexp = /:(active|focus|visited|hover|disabled|:[\w-]+)/g;

const matchVar = (cssVar, target) => {
  const combinedSelector = cssVar.uniqueSelectors.map(selector => {
    const isBodySelector = !!selector.match(/^body(\.[\w-]*)?$/);
    const isRootSelector = selector.trim() === ':root';
    const isGlobalSelector = isBodySelector || isRootSelector;

    if (!isRootSelector && /^:/.test(selector)) {
      // Quick hack. These are filtered below.
      return null;
    }

    // Prevent body selector from always showing up, unless a body or paragraph was clicked.
    const shouldIncludeStar = !isGlobalSelector || ['p', 'body', 'h'].includes(target.tagName.toLowerCase().replace(/\d$/, ''));
    // const shouldIncludeStar = true;

    return `${selector}${!shouldIncludeStar ? '' : `, ${selector} *`}`;
    // Remove any pseudo selectors that might not match the clicked element right now.
  }).filter(v => v).join().replace(allStateSelectorsRegexp, '').replace(/:?:(before|after|first\-letter)/g, '');


  if (combinedSelector === '') {
    return false;
  }

  if (typeof target.matches !== 'function') {
    return false;
  }

  try {
    // Remove residual empty not-selectors after removing pseudo states.
    return target.matches(combinedSelector.replaceAll(/:not\(\)/g, ''));
  } catch (e) {
    if (!/^:/.test(combinedSelector)) {
      console.log('Failed testing a selector, and it is not because it only matches a pseudo selector.', cssVar);
      console.log(combinedSelector);
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

