import {compare as specificityCompare} from 'specificity';

export function hasClosingBracket(string, openingBracketIndex) {
  return findClosingBracket(string, openingBracketIndex) !== string.length
}

function findClosingBracket(string, openingBracketIndex) {
  let ignoreNext = false, innerLevel = 0, index = openingBracketIndex + 1;

  while (
    index < string.length &&
    (innerLevel > 0 || string[index] !== ')')
  ) {
    if (ignoreNext) {
      ignoreNext = false;
      index++;

      continue;
    }
    switch (string[index]) {
      case '\\':
        ignoreNext = true;
        break;
      case ')':
        innerLevel--;
        break;
      case '(':
        innerLevel++;
        break;
    }
    index++;
  }

  return index;
}

function removeWheres(selector) {
  let remaining = selector;
  let match;

  while (match = /:where\(/d.exec(remaining)) {

    const endpos = findClosingBracket(remaining, match.index + 6);
    remaining = remaining.slice(0, match.index) + remaining.slice(endpos + 1)
  }


  // This possibly has redundant whitespace but it's only used to calculate specificity.
  return remaining.replaceAll(/:not\([\s,]*\)/g, '').replaceAll(/,\s*,/g, ',').replaceAll(/\(\s*,/g, '(');
}

function fixIsAndNot(selector, level = 0) {
  let remaining = selector;
  let match;

  // Fix :not first so we don't have to loop over the extra :not's created to fix :is
  let offset = 0;

  while (match = /:not\(/d.exec(remaining.slice(offset))) {

    const openingIndex = match.index + 4 + offset;

    const endpos = findClosingBracket(remaining, openingIndex);

    const innerSelectors = remaining.slice(
      openingIndex + 1,
      endpos,
    );

    const innerFixed = fixIsAndNot(innerSelectors, level + 1);
    // Assume fixing on the previous line removed all possible commas inside brackets.
    const parts = innerFixed.split(',');
    let max = parts[0];
    for (const inner of parts) {
      if (inner !== max && compare(max, inner) === -1) {
        max = inner;
      }
    }

    const firstPiece = remaining.slice(0, match.index + offset) + `:not(${max.trim()})`;
    offset = firstPiece.length;
    remaining =  firstPiece + remaining.slice(endpos + 1)
  }

  offset = 0;

  // Turn into a single not which is properly calculated by the dependency and has same.
  // specificity logic.
  // That way, we can avoid wrong CSS in cases where a node name is at the start of the 
  // inner selector, e.g. `.foo:is(input)` => `.fooinput`, with fix `.foo:not(input)`.

  while (match = /:is\(/d.exec(remaining.slice(offset))) {
    const openingIndex = match.index + 3 + offset;
    const endpos = findClosingBracket(remaining, openingIndex);
    const innerSelectors = remaining.slice(
      openingIndex + 1,
      endpos,
     );

    const innerFixed = fixIsAndNot(innerSelectors, level + 1);
    // Assume fixing on the previous line removed all possible commas inside brackets.
    const parts = innerFixed.split(',');
    let max = parts[0];
    for (const inner of parts) {
      if (compare(max, inner) === -1) {
        max = inner;
      }
    }

    const firstPiece = remaining.slice(0, match.index + offset) + `:not(${max.trim()})`;
    offset = firstPiece.length;
    remaining = firstPiece + remaining.slice(endpos + 1)
  }

  if (remaining.includes(',')) {
    const parts = remaining.split(',');
    let max;

    for (const part of parts) {
      const isMoreSpecific = !max || compare(max, part) === -1;
      if (isMoreSpecific) max = part;
    }
    return max;
  }

  // This possibly has redundant whitespace but it's only used to calculate specificity.
  return remaining;
}

export function compare(a, b) {
  // Remove `:where()` blocks, as they have no specificity.
  // Partially resolve `:is` and `:not` as dependency doesn't handle them.
  return specificityCompare(
    fixIsAndNot(removeWheres(a)),
    fixIsAndNot(removeWheres(b)),
   );
};