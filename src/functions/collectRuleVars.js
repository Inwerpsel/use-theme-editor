import {balancedVar} from './balancedVar';
import { statelessSelector } from './extractPageVariables';
import { HIGHLIGHT_CLASS } from './highlight';
import { resolveOriginalShorthand } from './resolveOriginalShorthand';

export const definedValues = { 
  ':root': {},
  // Todo, dynamically create these so they don't have to be checked when accessing.
  // Hard coded for now to make an example work.
  ':where(html)': {},
 };

export const scopesByProperty = {};

export const collectRuleVars = (collected, rule, sheet, media = null, supports = null) => {
  if (rule.type === 1) {
    // Rule is a selector.

    // Keep track of visited shorthands so they're only added once.
    const visitedShorthands = [];
    const selector = rule.selectorText;
    if (selector === `.${HIGHLIGHT_CLASS}`) {
      // return early
      return collected;
    }

    for (let property of rule.style) {
      const isCustomDeclaration = property.startsWith('--');
      const couldBeValue = rule.style.getPropertyValue(property);

      // If empty value is returned, it should be from a shorthand.
      // A stylemap should not have any empty values where this is not the case.
      const isPartOfShorthand = couldBeValue === '';

      let value = rule.style.getPropertyValue(property).trim();

      if (isCustomDeclaration) {
        if (!definedValues[selector]) {
          definedValues[selector] = {};
        }

        // For now exclude dark theme rules, they're not properly handled yet.
        // This check will obviously break some use cases, but for now it fixes more.
        if (!media || !/prefers\-color\-scheme\: ?dark/.test(media)) {
          definedValues[selector][property] = value;

          // Index them both ways, might pick just one later.
          if (!scopesByProperty[property]) {
            scopesByProperty[property] = {};
          }
          scopesByProperty[property][selector] = value;
        }

        continue;
      }

      let match;
      let first = true;
      let index = 0;

      if (isPartOfShorthand) {
        const [shorthandProperty, shorthandValue] = resolveOriginalShorthand(property, rule);

        if (visitedShorthands.includes(shorthandProperty)) {
          continue;
        }

        if (shorthandValue === '') {
          // In some cases shorthand value can't be resolved, skip these for now.
          // Happens when a shorthand containing mulitple custom properties is used,
          // and the syntax doesn't allow unambiguously determining the type of each.
          continue;
        }
        if (shorthandValue === undefined) {
          // quick fix
          continue;
        }

        visitedShorthands.push(shorthandProperty);
        value = shorthandValue;
        property = shorthandProperty;
      }

      const fullValue = value;
      const isImportant = rule.style.getPropertyPriority(property) === 'important';
    
      while ((match = balancedVar(value))) {
        // Split at the comma to find variable name and fallback value.
        const varArguments = match.body.split(',').map((str) => str.trim());
        const isFullProperty =
          first &&
          match.pre.trim() === '' &&
          (match.post.replace(/\s*\!important$/, '') === '');
        // Does the variable represent all the arguments of a function?
        const isOnlyFunctionArgument = /^\s*\)\s*/.test(match.post) && /\w+(-\w+)*\(\s*$/.test(match.pre);
        const cssFunc = !isOnlyFunctionArgument ? null : match.pre.match(/(\w+(-\w+)*)\(\s*$/)[1];

        first = false;

        // There may be other commas in the values so this isn't necessarily just 2 pieces.
        // By spec everything after the first comma (including commas) is a single default value we'll join again.
        const [variableName, ...defaultValueSplit] = varArguments;

        const defaultValue = defaultValueSplit.join(',');

        const usage = {
          selector,
          statelessSelector: statelessSelector(selector),
          property,
          defaultValue,
          media,
          supports,
          sheet: sheet.href,
          isFullProperty,
          fullValue,
          isImportant,
          index,
          cssFunc,
        };
        index++;
        if (!collected.hasOwnProperty(variableName)) {
          collected[variableName] = { properties: {}, usages: [], statelessSelector: null, cssFunc };
        }
        collected[variableName].usages.push(usage);
        collected[variableName].cssFunc = collected[variableName].cssFunc || cssFunc;
        collected[variableName].properties[property] = {isFullProperty, fullValue, isImportant};

        // Replace variable name (first occurrence only) from result, to avoid circular loop
        value =
          (match.pre || '') +
          match.body.replace(variableName, '') +
          (match.post || '');
      }
      const remaining = value?.trim() || '';

      // Collect non variable values.
      if (remaining !== '' && !remaining.startsWith(',')) {
        if (!(fullValue in collected)) {
          collected[fullValue] = {
            isRawValue: true,
            properties: {},
            usages: [],
            statelessSelector: null,
          };
        }
        collected[fullValue].usages.push({
          selector,
          statelessSelector: statelessSelector(selector),
          property,
          defaultValue: fullValue,
          media,
          supports,
          sheet: sheet.href,
          isFullProperty: true,
          fullValue,
          isImportant,
          index,
        });
        collected[fullValue].properties[property] = {isFullProperty: true, fullValue, isImportant};
      }

    }
  }
  if (rule.type === 4) {
    // No nested media queries for now.
    [...rule.cssRules].forEach(innerRule => collectRuleVars(collected, innerRule, sheet, rule.conditionText, supports));
  }
  if (rule.type === 12) {
    // No support for nested supports queries for now.
    [...rule.cssRules].forEach(innerRule => collectRuleVars(collected, innerRule, sheet, media, rule.conditionText));
  }

  return collected;
};

