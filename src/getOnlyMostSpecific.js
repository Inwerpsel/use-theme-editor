import { compare } from 'specificity';
import {byNameStateProp} from "./groupVars";

const pseudoRegex = /(:(hover|focus|active|disabled|visited))/g;

const getMaxMatchingSpecificity = (usages, element) => {
  return usages.reduce((max, usage) => {
    // // This should not be here but needs testing before remove.
    // if (!usage) {
    //   return max;
    // }
    if (!element.matches(usage.selector)) {
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
  const asObject = vars.reduce((all, current)=> {
    const byMediaQueries = current.usages.reduce(groupByMediaQueries, {});
    console.log(current.name, byMediaQueries);

    Object.entries(byMediaQueries).forEach(([media,usages]) => {
      const maxSpecific = getMaxMatchingSpecificity(usages, element) || usages[0];
      // Won't have anything added if it doesn't match
      const pseudoSuffix = (maxSpecific.selector.split(',')[0].match(pseudoRegex) || []).join('');
      const propName = usages[0].property + pseudoSuffix + media;

      if (!all[propName]) {
        all[propName] = {...current, maxSpecific};
      } else {
        // const comparedUsage = getMaxMatchingSpecificity([all[propName].maxSpecific, maxSpecific], element);
        const comparedUsage = getMaxMatchingSpecificity([all[propName].maxSpecific, maxSpecific], element);
        if (maxSpecific === comparedUsage) {
          all[propName] = {...current, maxSpecific};
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
