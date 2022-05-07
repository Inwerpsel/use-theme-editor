export function varMatchesTerm(cssVar, term) {
  if (term === '') {
    return true;
  }
  try {

  } catch (e) {
    // Ensure invalid regexes don't add a filter
    return true;
  }

  if (cssVar.name.replace(/-+/g, ' ').match(term)) {
    return true;
  }
  return cssVar.usages.some(usage => usage.property.match(term));
}

export const filterSearched = (groups, term) => {
  if (!term) {
    return groups;
  }
  try {
    return groups.map(group => ({
      ...group,
      vars: group.vars.filter(cssVar => varMatchesTerm(cssVar, term)),
    }));
  } catch (e) {
    // Catch wrong regexes.
    return groups;
  }
};

