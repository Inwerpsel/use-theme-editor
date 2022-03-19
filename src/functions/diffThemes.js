export const diffThemes = (themeA, themeB) => {
  const added = Object.keys(themeB).filter(k => !themeA[k]);
  const removed = Object.keys(themeA).filter(k => !themeB[k]);
  const changed = Object.keys(themeB).filter(k => !!themeA[k] && themeA[k] !== themeB[k]);
  const hasChanges = added.length > 0 || removed.length > 0 || changed.length > 0;

  return {added,removed,changed, hasChanges};
};

export const diffSummary = (themeA, themeB) => {
  const { added, removed, changed } = diffThemes(themeA, themeB);

  let summary = `
  `;

  if (added.length) {
    summary += `added(${added.length}):
  ${added.map(k => `${k}: ${themeB[k]}`).join('\n')}
  `;
  }
  if (removed.length) {
    summary += `removed(${removed.length}):
  ${removed.join('\n')}
    `;
  }
  if (changed.length) {
    summary += `changed(${changed.length}):
  ${changed.map(k =>`${k}: ${themeA[k]} => ${themeB[k]}`).join('\n')}
    `;
  }
  return summary;
};

