import { compare } from 'specificity';
import {byNameStateProp} from "./groupVars";

const pseudoStateRegex = /(:(hover|focus|active|disabled|visited))/g;

const getMaxMatchingSpecificity = (usages, element) => {
  return usages.reduce((max, usage) => {
    // // This should not be here but needs testing before remove.
    // if (!usage) {
    //   return max;
    // }
    if (!element.matches(usage.selector.replace(pseudoStateRegex, ''))) {
      return max;
    }

    const parts = usage.selector.split(',');
    const comparePart = (max, part) => {
      return element.matches(part) && compare(max, part) !== -1 ? part : max;
    };
    const winningSelector = parts.reduce(comparePart);

    usage.winningSelector = winningSelector;

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
  const asObject = vars.reduce((all, currentVar)=> {
    const byMediaQueries = currentVar.usages.reduce(groupByMediaQueries, {all: []});

    let found = false;
    Object.entries(byMediaQueries).forEach(([media,usages]) => {
      if (found) {
        return;
      }
      const maxSpecific = getMaxMatchingSpecificity(usages, element) || usages[0];
      if (!maxSpecific) {
        return;
      }
      found = true;
      // Won't have anything added if it doesn't match
      const stateSuffix = (maxSpecific.selector.split(',')[0].match(pseudoStateRegex) || []).join('');
      const pseudoElementSuffix = (maxSpecific.selector.split(',')[0].match(/:?:(before|after)/g) || []).join('');
      const propName = usages[0].property + stateSuffix + media + pseudoElementSuffix;

      if (!all[propName]) {
        all[propName] = {...currentVar, maxSpecific};
      } else {
        const comparedUsage = getMaxMatchingSpecificity([all[propName].maxSpecific, maxSpecific], element);
        if (maxSpecific === comparedUsage) {
          all[propName] = {...currentVar, maxSpecific};
        }
      }

    });
    return all;
  },{});

  // Map back to array.
  return Object.values(asObject);
};


export const filterMostSpecific = (groups) => {
  return groups.map(({ vars, element, ...other }) => ({
    ...other,
    element,
    vars: getOnlyMostSpecific(vars, element).sort(byNameStateProp),
  }));
};
