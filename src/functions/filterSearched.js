export function varMatchesTerm(cssVar, term) {
  try {
    if (term === '') {
      return true;
    }
    if (cssVar.name.replace(/-+/g, ' ').match(term)) {
      return true;
    }
    return cssVar.usages.some(usage => usage.property.match(term));
  } catch (e) {
    return true;
  }
}

export const filterSearched = (groups, term) => {
  if (!term) {
    return groups;
  }
  const cleanedTerm = term.replace(/^\!/, '');
  const isInverse = cleanedTerm.length !== term.length;
  try {
    return groups.map(group => ({
      ...group,
      vars: group.vars.filter(cssVar => {
        const matches = varMatchesTerm(cssVar, cleanedTerm);

        return isInverse ? !matches : matches;
      }),
    }));
  } catch (e) {
    // Catch wrong regexes.
    return groups;
  }
};

export function filterSelectors(groups, filteredSelectors) {
  if (filteredSelectors.length === 0) {
    return groups;
  }

  return groups.map(group => ({
    ...group,
    vars: group.vars.filter(cssVar => {
      const hasIt = filteredSelectors.some(filteredSelector => {
        return cssVar.maxSpecific.selector.includes(filteredSelector)
        // return cssVar.maxSpecific.winningSelector.includes(filteredSelector)
      })
      return hasIt;
    }),
  }));
}