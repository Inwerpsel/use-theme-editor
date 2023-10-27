/**
 * Parse CSS to extract
 * - Positions to look up source
 * - List of rules to evaluate on inspection
 * - Comments, ideally linked with relevant entity
 * 
 * For now, it uses the arguments by reference without returning anything.
 */
export function parseCss(css, {comments, rulesWithMap, rogueAtRules, sheet}) {
  let currentSelectors = [];
  const currentAtRules = [];

  let lineNumber = 0;
  let currentIndex = 0;
  let lineIndex = 0;

  let buffer = '', bufferLine, bufferCol;
  // let ruleIndex = 0;
  let inStylemap = false;

  let commentBody = '';
  let commentStartLine = 0;
  let commentStartCol = 0;

  let isInComment = false;
  let inlineIsInComment = false;
  let isEscape = false;

  let inAtRule = false;
  let parenthesesLevel = 0;
  let selectorRule;
  let currentProperty = '', currentPropertyStart;

  let prevChar, recordChar;

  const parser = {
    '{'() {
      if (isInComment || inlineIsInComment) {
        return;
      }
      recordChar = false;
      const text = buffer.trim();
      if (inAtRule) {
        inAtRule = false;
        currentAtRules.push(text);
        buffer = '';
        return;
      }

      currentSelectors.push([[bufferLine, bufferCol],text]);

      selectorRule = {
        text: currentSelectors.map(([, text]) => text).join(),
        selectors: currentSelectors,
        start: {
          line: lineNumber,
          col: currentIndex - lineIndex - buffer.length - 1,
        },
        end: null,
        stylemap: new Map(),
        atRules: [...currentAtRules],
        sheet,
      };
      currentSelectors = [];
      buffer = '';
      inStylemap = true;
    },
    '}'() {
      if (isInComment || inlineIsInComment) {
        return;
      }
      recordChar = false;

      if (inStylemap) {
        inStylemap = false;
        if (currentProperty) {
          selectorRule.stylemap.set(currentProperty, buffer.trim());
          currentProperty = '';
        }
        selectorRule.end = {
          line: lineNumber,
          col: currentIndex - lineIndex - 1,
        };
        rulesWithMap.push(selectorRule);
        selectorRule = null;
      } else {
        const closedRule = currentAtRules.pop();
        let body = buffer.trim();
        if (body !== '') {
          // Some atrules have a (non-style) map which can have commas in rare cases (main font-face and counter-style).
          // To avoid complex handling, we just let it be a bit wrong, then correct here.
          if (currentSelectors.length > 0) {
            body = currentSelectors.map(([, text]) => text).join() + ', ' + body;
          }
          rogueAtRules.push({text: closedRule, body})
        }
        currentSelectors = [];
      }
      buffer = '';
    },
    '\n'() {
      recordChar = isInComment;
      if (inlineIsInComment) {
        comments.push({
          line: commentStartLine,
          col: commentStartCol,
          text: commentBody,
          inline: true,
        });
        commentBody = '';
        inlineIsInComment = false;
      }

      // Parentheses in CSS cannot span multiple lines.
      // While the parser should properly close unescaped parentheses,
      // in case that would fail, resetting limits the consequences to the line,
      // and not everything after it.
      parenthesesLevel = 0;

      lineNumber++;
      lineIndex = currentIndex;
    },
    '/'() {
      if (isInComment && prevChar === '*') {
        recordChar = false;
            isInComment = false;
            isInComment = false;
            recordChar = false;
        isInComment = false;
            recordChar = false;

        comments.push({
          line: commentStartLine,
          col: commentStartCol,
          // Exclude '*' at the end.
          text: commentBody.slice(0, -1),
          inline: false,
        });
        commentBody = '';
      } else if (
        !isInComment &&
        !inlineIsInComment &&
        // quick fix for url()
        parenthesesLevel === 0 &&
        prevChar === '/'
      ) {
        recordChar = false;
        inlineIsInComment = true;

        commentStartLine = lineNumber;
        commentStartCol = currentIndex - lineIndex - 1;
        commentBody = '';

        // remove "/"
        buffer = buffer.substring(0, -1);
      }
    },
    '*'() {
      if (!isInComment && !inlineIsInComment && prevChar === '/') {
        recordChar = false;
        isInComment = true;
        commentStartLine = lineNumber;
        commentStartCol = currentIndex - lineIndex - 1;

        // remove "/"
        buffer = buffer.substring(0, -1);
      }
    },
    '@'() {
      if (!isInComment && !inlineIsInComment && !inStylemap) {
        inAtRule = true;
        buffer = '';
        // ruleIndex = currentIndex;
        // Let's assume for now @ can only occur at the start of an at rule.
      }
    },
    ':'() {
      if (inStylemap && currentProperty === '') {
        currentProperty = buffer.trim();
        currentPropertyStart = [bufferLine, bufferCol];
        buffer = '';
        recordChar = false;
      }
    },
    ';'() {
      if (inStylemap && parenthesesLevel === 0) {
        selectorRule.stylemap.set(currentProperty, buffer.trim());

        buffer = '';
        currentProperty = '';
        recordChar = false;
      } else if (inAtRule) {
        inAtRule = false;
        // atRules[buffer.trim()] = {
        //   line: lineNumber,
        //   col: ruleIndex,
        // };
        buffer = '';
        recordChar = false;
      }
    },
    '('() {
      // This helps prevent starting a line comment in case of a url().
      // It probably doesn't work if the rule contains unbalanced parentheses.
      if (!isInComment && !inlineIsInComment) {
        parenthesesLevel += 1;
      }
    },
    ')'() {
      if (!isInComment && !inlineIsInComment) {
        parenthesesLevel -= 1;
      }
    },
    '\\'() {
      isEscape = true;
      recordChar = false;
    },
    ','() {
      if (!isInComment && !inlineIsInComment && !inStylemap && !inAtRule && parenthesesLevel === 0) {
        const selector = buffer.trim();
        currentSelectors.push([[bufferLine, bufferCol], selector]);
        recordChar = false;
        buffer = '';
      }
    },
  };

  for (const char of css) {
    recordChar = true;

    if (isEscape) {
      // The previous character was an escape character.
      isEscape = false;
    } else {
      const f = parser[char];
      f && f();
    }

    if (recordChar) {
        if (isInComment || inlineIsInComment) {
          commentBody += char;
        } else {
          const isWhiteSpace = /\s/.test(char);
          const wasEmpty = buffer === '';
          // if (!inStylemap && !isWhiteSpace && buffer === '') {
          //   ruleIndex = currentIndex;
          // }

          // Don't record whitespace at start of names.
          if (!isWhiteSpace || !wasEmpty) {
            buffer += char;
          }

          if (wasEmpty && !isWhiteSpace) {
            // Record start of buffer.
            bufferLine = lineNumber;
            bufferCol = currentIndex - lineIndex - 1;
          }
        }
    }

    currentIndex++;
    prevChar = char;
  }
}

const replaceRegex = /:(active|focus(-(visible|within))?|visited|hover)/g;

function forceableStates(selector) {
  // We have to use `:is` to preserve specificity.
  // The added class does not increase the `is:` block specificity.
  return selector.replaceAll(replaceRegex, `:is(:$1, ._force-$1)`);
}

// First capturing group simplifies the logic as it allows to use `replaceAll` while
// "keeping" the last char of the previous component (take away and immediately put back).
const removablePseudoComponents = /([\w\])-])(:(\-[\w-]+|:\-?[\w-]+|before|after|active|focus(-(visible|within))?|visited|hover))+/g;

// Remove all pseudo state and pseudo element components from a selector.
// Note that this results in some pseudo elements matching all elements, even when they refer to
// pseudo elements that can only occur in a subset of HTML elements (many `::-webkit-` prefixed), or under specific conditions (scrollbar).
// With the current logic, these would all bubble up to the root element (but should be all shown and not compete for the same property).
// At a later point, every such pseudo element could have more matching logic to detect whether it's really there (e.g. is scrollbar present?).
function getRidOfPseudos(selector) {
  const replaced = selector
    // Remove pseudo state component where possible.
    // This is necessary to be able to dedupe while locating/testing, but doesn't always work.
    .replaceAll(removablePseudoComponents, '$1')
    // What remains should be standalone occurences like `.foo :hover` and `.foo>:hover`.
    // Simply removing this like in the previous step would result in an inaccurate and possibly invalid selector.
    .replaceAll(replaceRegex, '*')
    // Attempt to remove excess whitespace to decrease the amount of different selectors.
    .replaceAll(/\s+/g, ' ')
    // I think this is safe to do. (ok, in theory this will break some attribute selectors)
    .replaceAll(/\s*,\s*/g, ',')
    // Finally, it's possibly we ended up with `:not(*)`, which we need to get rid of.
    // While it's possible for this to be a standalone component in a selector,
    // and removing would change the matched element to be a parent,
    // that is truly exceptionally rare.
    .replaceAll(/:not\(\*\)/g, '');

    // 1. Possibly all components were removed.
    // 2. Pseudo elements are only valid at the end.
    if (replaced === '' || replaced.startsWith('::')) {
      return '*';
    }

    return replaced.trim();
}

// Name not ideal, it does a bit more but naming is hard.
export function deriveUtilitySelectors({
  rulesWithMap = [],
  keyframesRules = [],
  selectorRules = [],
  testSelectors = new Map(),
}) {

  for (const rule of rulesWithMap) {
    const firstAtRule = rule.atRules[0];
    if (firstAtRule && firstAtRule.startsWith('@keyframes')) {
      if (!keyframesRules.hasOwnProperty(firstAtRule)) {
        keyframesRules[firstAtRule] = {};
      }
      keyframesRules[firstAtRule][rule.text] = rule;

      continue;
    }
    // TODO: also handle fonts and other @ stuff.

    // Get every unique component selector from each (possibly) combined selector.
    // Also create an adapted selector if needed.
    rule.adaptedSelector = forceableStates(rule.text);
    rule.testSelectors = new Set();

    for (const [, sel] of rule.selectors) {
      const stripped = getRidOfPseudos(sel);

      if (testSelectors.has(stripped)) {
        rule.testSelectors.add(testSelectors.get(stripped));
      } else {
        const newOne = {
          text: stripped,
          // For now, let's keep the inspection state on these selectors.
          // I think it will only be used during the inspection.
          lastEl: null,
          origs: new Set(),
        };
        testSelectors.set(stripped, newOne);
        rule.testSelectors.add(newOne);
      }
      testSelectors.get(stripped).origs.add(sel);
    }

    selectorRules.push(rule);
  }
  return {rulesWithMap, keyframesRules, selectorRules, testSelectors}
}
