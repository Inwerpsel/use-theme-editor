import {compare} from 'specificity';
import {sortForUI} from './groupVars';

const pseudoStateRegex = /(:(hover|focus|active|disabled|visited))/g;

function getPropertyKeys ({selector, property }, media) {
    // Won't have anything added if it doesn't match
  const stateSuffix = (selector.split(',')[0].match(pseudoStateRegex) || []).join('');
  const pseudoElementSuffix = (selector.split(',')[0].match(/:?:(before|after)/g) || []).join('');
  const propName = property + stateSuffix + media + pseudoElementSuffix;
  const allPropName = property + stateSuffix + 'all' + pseudoElementSuffix;

  return [propName, allPropName];
}

export function getMaxMatchingSpecificity(usages, element) {
  return usages.reduce((max, usage) => {
    // // This should not be here but needs testing before remove.
    // if (!usage) {
    //   return max;
    // }
    if (!element.matches(usage.selector.replace(pseudoStateRegex, '').replaceAll(/:not\(\)/g, ''))) {
      return max;
    }

    if (typeof element.style[usage.property] !== 'undefined' && element.style[usage.property] !== '') {
      return max;
    }

    const parts = usage.selector.split(',');
    const comparePart = (max, part) => {
      if (!element.matches(part.replace(pseudoStateRegex, '').replaceAll(/:not\(\)/g, ''))) {
        return max;
      }
      // Return part if it's equally or more specific.
      return compare(max, part) !== -1 ? part : max;
    };
    usage.winningSelector = parts.reduce(comparePart);

    if (max === null) {
      return usage;
    }
    try {
      const result = compare(max.winningSelector, usage.winningSelector);
      if ( result !== 1) {
        return usage;
      }
    } catch (e) {
      console.log(e);
      return usage;
    }
    return max;
  }, null);
};

const groupByMediaQueries = (all, usage) => {
  const mediaKey = usage.media || 'all';
  const prevUsages = all[mediaKey] || [];
  const allUsages = [...prevUsages, usage];

  return ({
    ...all,
    [mediaKey]: allUsages,
  });
};

export const getOnlyMostSpecific = (vars, element) => {
  // Reduce to an object, then back to array. Easier to work with for this purpose.
  const varsWithOnlyMediaQueries = {};
  const specificVars = vars.reduce((specificVars, cssVar)=> {
    const byMediaQueries = cssVar.usages.reduce(groupByMediaQueries, {all: []});

    let found = false;
    Object.entries(byMediaQueries).forEach(([media,usages]) => {
      if (found) {
        return;
      }

      // If we can find a usage that wins over an already collected property,
      // force it to use that key instead of the key of the max specific selector.
      // Otherwise you could have a selector like `:hover, :hover:focus`, where the
      // last selector wins. Not because of specificity, as state selectors are 
      // stripped for the calculation. It's because of the order.
      // If this happens, and a previous property only has a selector for `:hover`,
      // It results in 
      const beatsExisting = usages.find(usage => {
        const [usageKey] = getPropertyKeys(usage, media);
        if (!(usageKey in specificVars)) {
          return false;
        }
        return usage === getMaxMatchingSpecificity(
          [specificVars[usageKey].maxSpecific, usage],
          element
        );
      });

      const maxSpecific = beatsExisting || getMaxMatchingSpecificity(usages, element) || usages[0];
      // Skip vars on properties that are overridden by inline styles.
      if (!maxSpecific || element.style[maxSpecific.property] !== '') {
        return;
      }
      found = true;
      const [propName, allPropName] = getPropertyKeys(maxSpecific, media);
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
        specificVars[propName] = {...cssVar, maxSpecific};
      } else {
        const comparedUsage = getMaxMatchingSpecificity([specificVars[propName].maxSpecific, maxSpecific], element);
        if (maxSpecific === comparedUsage) {
          specificVars[propName] = {...cssVar, maxSpecific};
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
