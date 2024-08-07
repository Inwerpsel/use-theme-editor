import { definedValues } from './collectRuleVars';
import { compare } from './compare';
import { statelessSelector } from './extractPageVariables';
import { getMaxMatchingSpecificity } from './getOnlyMostSpecific';

// This has been patched up recently, but eventually most things in this file will be completely rewritten.
export function getMatchingScopes(target, allVars, prevGroups) {
  const matchingSelectors = Object.keys(definedValues).filter((rawSelector) => {
    const selector = statelessSelector(rawSelector);
    try {
      return target.matches(selector);
    } catch (e) {
      console.log('Failed testing scope selector:', selector);
    }
  });

  // Matches that actually can affect a custom property
  const withMatchingVars = matchingSelectors.reduce((all, selector) => {
    const scopeVars = allVars.filter(({ name }) => name in definedValues[selector]);

    all.push({ selector, scopeVars });

    return all;
  }, []);

  const withMostSpecific = withMatchingVars.map((scope) => {
    const { selector } = scope;
    const _statelessSelector = statelessSelector(selector);
    if (!/,/.test(selector)) {
      scope.matchingSelector = selector;
    } else {
      let max = null, currentParent = target;
      // Travel up in case scope was from parent.
      while (max === null && currentParent?.parentNode) {
        // Quick hack using an existing function that checks if the property exists on the element's style.
        // We're only matching the whole scope and don't care about the property.
        max = getMaxMatchingSpecificity([{ selector, statelessSelector: _statelessSelector, property: '__definitely_not_exists__' }], currentParent);
        currentParent = currentParent.parentNode;
      }
      scope.matchingSelector = max?.winningSelector;
    }

    return scope;
  });

  for (const prevGroup of prevGroups) {
    if (prevGroup.scopes.length > withMostSpecific.length) {
      prevGroup.scopes = prevGroup.scopes.map((s,i) => [s, i]).sort(([a, ia], [b, ib]) => {
        const hasA = withMostSpecific.some((x) => x.selector === a.selector);
        const hasB = withMostSpecific.some((x) => x.selector === b.selector);

        if (hasA && hasB) {
          return ia - ib;
        }
        if (!hasA && !hasB) {
          return ia - ib;
        }
        return hasA ? 1 : -1;
      }).map(([s]) =>s);
      // console.log(withMostSpecific, prevGroup);
    }
  }

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
