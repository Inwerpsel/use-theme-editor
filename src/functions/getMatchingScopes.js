import {compare as specificityCompare} from 'specificity';
import { definedValues } from './collectRuleVars';
import { statelessSelector } from './extractPageVariables';
import { allStateSelectorsRegexp } from './getMatchingVars';
import { getMaxMatchingSpecificity } from './getOnlyMostSpecific';

// Remove where with up to 2 levels of internal parentheses.
export const removeWheresReg = /:where\(([^\(\)]|\(([^\(\)]|\(([^\(\)]|)*\))*\))\)/g;

export function compare(a, b) {
  // Try to remove `:where()` blocks, as they have no specificity.
  return specificityCompare(
    a.replace(removeWheresReg, ''),
    b.replace(removeWheresReg, ''),
  );
};


export function getMatchingScopes(target, vars) {
  const matchingSelectors = Object.keys(definedValues).filter((rawSelector) => {
    if (rawSelector === ':root') {
      // We're only interested in local scopes here.
      // Technically this should return true, as there may be definitions in the code for the global scope.
      // But so far the editor just considers these the same as default values.
      return false;
    }
    const selector = statelessSelector(rawSelector);

    try {
      return target.matches(selector);
    } catch (e) {
      console.log('Failed testing scope selector:', selector);
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
    try {
      const result = compare(a.matchingSelector, b.matchingSelector);
      if (result === 0) {
        return -1;
      }
      // Sort opposite direction.
      return result * -1;
    } catch (e) {
      console.log(a, b);
      console.log(e);
      return -1;
    }
  });
};
