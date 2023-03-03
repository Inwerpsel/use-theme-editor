import {compare as specificityCompare} from 'specificity';

function removeWheres(selector) {
  let remaining = selector;
  let match;

  while (match = /:where\(/d.exec(remaining)) {
    let endpos = match.index + 7;
    let innerLevel = 0;
    while (
      endpos < remaining.length &&
      (innerLevel > 0 || remaining[endpos] !== ')')
    ) {
      switch (remaining[endpos]) {
        case ')':
          innerLevel--;
          break;
        case '(':
          innerLevel++;
          break;
      }
      endpos++;
    }
    remaining = remaining.slice(0, match.index) + remaining.slice(endpos + 1)
  }

  // This possibly has redundant whitespace but it's only used to calculate specificity.
  return remaining;
}

export function compare(a, b) {
  // Remove `:where()` blocks, as they have no specificity.
  // A similar fix could be done for `:is()`, where the block
  // can be replaced with the most specific inner selector.
  return specificityCompare(
    removeWheres(a),
    removeWheres(b),
  );
};