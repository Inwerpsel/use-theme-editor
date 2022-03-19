export const filterSearched = (groups, term) => {
  if (!term) {
    return groups;
  }
  try {
    return groups.map(group => ({
      ...group,
      vars: group.vars.filter(cssVar => {
        if (cssVar.name.replace(/-+/g, ' ').match(term)) {
          return true;
        }
        return cssVar.usages.some(usage => usage.property.match(term));
      }),
    }));
  } catch (e) {
    // Catch wrong regexes.
    return groups;
  }
};

