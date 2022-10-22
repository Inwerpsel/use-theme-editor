import { compare } from 'specificity';
import { definedValues } from './collectRuleVars';
import { allStateSelectorsRegexp } from './getMatchingVars';
import { getMaxMatchingSpecificity } from './getOnlyMostSpecific';

export function getMatchingScopes(target, vars) {
  const matchingSelectors = Object.keys(definedValues).filter((rawSelector) => {
    if (rawSelector === ':root') {
      // We're only interested in local scopes here.
      // Technically this should return true, as there may be definitions in the code for the global scope.
      // But so far the editor just considers these the same as default values.
      return false;
    }
    const selector = rawSelector.replace(allStateSelectorsRegexp, '').replace(/:?:(before|after|first\-letter)/g, '');
    const withInnerElementsSelector = `${selector}, ${selector.replace(',', ' *,')} *`;

    try {
      return target.matches(withInnerElementsSelector);
    } catch (e) {
      console.log('Failed testing scope selector:', withInnerElementsSelector);
    }
  });

  // Matches that actually can affect a custom property
  const withMatchingVars = matchingSelectors.reduce((all, selector) => {
    const scopeVars = vars.filter(({ name }) => name in definedValues[selector]);

    if (scopeVars.length > 0) {
      all.push({ selector, scopeVars });
    }

    return all;
  }, []);

  const withMostSpecific = withMatchingVars.map((scope) => {
    const { selector } = scope;
    if (!/,/.test(selector)) {
      scope.matchingSelector = selector;
    } else {
      let max = null, currentParent = target;
      // Travel up in case scope was from parent.
      while (max === null && currentParent?.parentNode) {
        // Quick hack using an existing function that checks if the property exists on the element's style.
        // We're only matching the whole scope and don't care about the property.
        max = getMaxMatchingSpecificity([{ selector, property: '__definitely_not_exists__' }], currentParent);
        currentParent = currentParent.parentNode;
      }
      scope.matchingSelector = max.winningSelector;
    }

    return scope;
  });

  return withMostSpecific.sort((a,b) => {
    const result = compare(a.matchingSelector, b.matchingSelector);
    if (result === 0) {
      return -1;
    }
    // Sort opposite direction.
    return result * -1;
  });
};
