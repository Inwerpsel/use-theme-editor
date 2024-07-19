import { compare, hasClosingBracket } from './compare';
import { allStateSelectorsRegexp, residualNotRegexp } from './getMatchingVars';
import {sortForUI} from './groupVars';

const pseudoStateRegex = allStateSelectorsRegexp;

function getPropertyKeys ({ selector, winningSelector = '', property, index }, media) {
  // Won't have anything added if it doesn't match
  const stateSuffix = (winningSelector.split(',')[0].match(pseudoStateRegex) || []).join('');
  const pseudoElementSuffix = (winningSelector.split(',')[0].match(/:(:(\w*(\-\w+)*)|after|before)/g) || []).join('');
  const indexSuffix= !index ? '' : `#${index}`;
  const propName = property + stateSuffix + media + pseudoElementSuffix + indexSuffix;
  const allPropName =
    property +
    stateSuffix +
    'all' +
    pseudoElementSuffix +
  // Prevent special selector from hijacking the main property.
    (winningSelector === '' ? selector : '') + 
    indexSuffix;

  return [propName, allPropName, stateSuffix, pseudoElementSuffix];
}

// should be safe for CSS selectors
export function splitCommaSafeParentheses(selector) {
    const parts = selector.split(',');
    const actualParts = [];
    let joined = '';
    for (const part of parts) {
      let ignoreNext = false, shouldJoin = false;
      let i = 0;
      const chunk = joined + part;
      for (const char of chunk) {
        if (ignoreNext) {
          ignoreNext = false;
          continue;
        }
        if (char === '(' && !hasClosingBracket(chunk, i)) {
          shouldJoin = true;
          break;
        }
        if (char === '\\') {
          ignoreNext = true;
        }

        i++;
      }

      if (shouldJoin) {
        joined += (joined ? ',' : '') + part;
      } else {
        actualParts.push(chunk)
        joined = '';
      }
    }

    if (joined) {
      actualParts.push(joined);
    }

    return actualParts;
}

export function getMaxMatchingSpecificity(usages, element) {
  const previousMatchedSelectors = {};
  return usages.reduce((max, usage) => {
    const strippedSelector = usage.statelessSelector;
    try {
      if (!strippedSelector || !element.matches(strippedSelector)) {
        return max;
      }
    } catch (e) {
      return max;
    }

    const parts = splitCommaSafeParentheses(usage.selector);
    const comparePart = (max, part) => {
      const selector = part
        .replace(pseudoStateRegex, '')
        .replaceAll(residualNotRegexp, '')
        .trim()
        .replaceAll(/^\s*>\s*/g, '')
        .replaceAll(/\s*>\s*$/g, '> *');
      try {
        if (selector === '' || !element.matches(selector)) {
          return max;
        }
      } catch (e) {
        console.log(selector)
        return max
      }
      // Return part if it's equally or more specific.
      try {
        const winner = compare(max, part) !== -1 ? part : max;
        if (winner === part) {
          if (previousMatchedSelectors[selector] && part.length > previousMatchedSelectors[selector].length) {
            // One of the previous selectors was shorter, let's keep that one (should be max).
            return max;
          }
          previousMatchedSelectors[selector] = part;
        }
        return winner;
      } catch (e) {
        return max;
      }
    };
    usage.winningSelector = parts.reduce(comparePart);

    const hasInlineStyle = typeof element.style[usage.property] !== 'undefined' && element.style[usage.property] !== '';
    const inlineIsImportant = hasInlineStyle && element.style.getPropertyPriority(usage.property) === 'important';

    if (inlineIsImportant) {
      return max;
    }

    if (usage.isImportant && !max?.isImportant) {
      return usage;
    }

    if (max?.isImportant && !usage.isImportant) {
      return max;
    }

    if (hasInlineStyle) {
      return max;
    }

    if (max === null) {
      return usage;
    }

    try {
      const result = compare(max.winningSelector, usage.winningSelector);
      if ( result !== 1) {
        return usage;
      }
    } catch (e) {
      console.log(e, max.winningSelector, usage.winningSelector);
      return usage;
    }
    return max;
  }, null);
};

const groupByMediaQueries = (all, usage) => {
  const mediaKey = usage.media || 'all';
  const prevUsages = all[mediaKey] || [];

  all[mediaKey] = [...prevUsages, usage];

  return all;
};

export const getOnlyMostSpecific = (vars, element) => {
  // Reduce to an object, then back to array. Easier to work with for this purpose.
  const varsWithOnlyMediaQueries = {};
  const specificVars = vars.reduce((specificVars, cssVar) => {
    const byMediaQueries = cssVar.usages.reduce(groupByMediaQueries, {all: []});

    let found = false;
    Object.entries(byMediaQueries).forEach(([media,usages]) => {
      if (found) {
        return;
      }

      // // If we can find a usage that wins over an already collected property,
      // // force it to use that key instead of the key of the max specific selector.
      // // Otherwise you could have a selector like `:hover, :hover:focus`, where the
      // // last selector wins. Not because of specificity, as state selectors are 
      // // stripped for the calculation. It's because of the order.
      // // If this happens, and a previous property only has a selector for `:hover`,
      // // It results in 
      // const beatsExisting = usages.find(usage => {
      //   const [usageKey] = getPropertyKeys(usage, media);
      //   if (!(usageKey in specificVars)) {
      //     return false;
      //   }
      //   // if (!allStateSelectorsRegexp.test(specificVars[usageKey].maxSpecific.selector)) {
      //   if (!allStateSelectorsRegexp.test(usageKey)) {
      //     return false;
      //   }
      //   return usage === getMaxMatchingSpecificity(
      //     [specificVars[usageKey].maxSpecific, usage],
      //     element
      //   );
      // });

      const maxSpecific = getMaxMatchingSpecificity(usages, element) || usages[0];
      // Skip vars on properties that are overridden by inline styles.
      if (
        !maxSpecific ||
        (element.style[maxSpecific.property] !== '' &&
          /:(before|after)/.test(maxSpecific.winningSelector))
      ) {
        return;
      }
      found = true;
      const [propName, allPropName, states, pseudos] = getPropertyKeys(maxSpecific, media);
      // This depends on "all" running first so that we can assume it's there already if it exists.
      // Set the overriding media
      if (media !== 'all') {
        if (!specificVars[allPropName] && !varsWithOnlyMediaQueries[allPropName]) {
          varsWithOnlyMediaQueries[allPropName] = {};
        }
        const allVar = specificVars[allPropName] || varsWithOnlyMediaQueries[allPropName];
        if (!allVar.overridingMedia) {
          allVar.overridingMedia = [];
        }
        allVar.overridingMedia.push({media, cssVar});
        cssVar.allVar = allVar;
      }

      if (!specificVars[propName]) {
        specificVars[propName] = {...cssVar, maxSpecific, states, pseudos};
      } else {
        if (!specificVars[propName].usages.some(u => {
          return u.property === maxSpecific.property 
            && u.defaultValue
            && (
              u.defaultValue.includes(`var(${cssVar.name},`)
              || u.defaultValue.includes(`var(${cssVar.name})`)
            )
        })) {
          const comparedUsage = getMaxMatchingSpecificity([specificVars[propName].maxSpecific, maxSpecific], element);
          if (maxSpecific === comparedUsage) {
            specificVars[propName] = {...cssVar, maxSpecific, states, pseudos};
          }
        }
      }

    });
    return specificVars;
  },{});

  // Map back to array.
  return Object.values(specificVars);
};


export const filterMostSpecific = (groups) => {
  return groups.map(({ vars, element, ...other }) => ({
    ...other,
    element,
    vars: getOnlyMostSpecific(vars, element).sort(sortForUI),
  }));
};
