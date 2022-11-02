import {balancedVar} from './balancedVar';
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
    // Keep track of visited shorthands so they're only added once.
    const visitedShorthands = [];
    // Rule is a selector.
    // Parse cssText to get original declarations.
    const selector = rule.selectorText;

    for (let property of rule.style) {
      const isCustomDeclaration = property.startsWith('--');
      const couldBeValue = rule.style.getPropertyValue(property);

      // If empty value is returned, it should be from a shorthand.
      // A stylemap should not have any empty values where this is not the case.
      const isPartOfShorthand = couldBeValue === '';
      // In case of shorthand we can't test yet.
      const isPotentialVar = isPartOfShorthand || /var\(/.test(couldBeValue);

      if (!isCustomDeclaration && !isPotentialVar) {
        continue;
      }

      let value = rule.style.getPropertyValue(property).trim();

      if (isCustomDeclaration) {
        // The rule is setting a custom property.
        if (!definedValues[selector]) {
          definedValues[selector] = {};
        }

        definedValues[selector][property] = value;

        // Index them both ways, might pick just one later.
        if (!scopesByProperty[property]) {
          scopesByProperty[property] = {};
        }
        scopesByProperty[property][selector] = value;

        continue;
      }

      if (isPotentialVar) {
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

          visitedShorthands.push(shorthandProperty);
          value = shorthandValue;
          property = shorthandProperty;
        }

        const fullValue = value;
        const isImportant = rule.style.getPropertyPriority(property);
      
        while ((match = balancedVar(value))) {
          // Split at the comma to find variable name and fallback value.
          const varArguments = match.body.split(',').map((str) => str.trim());
          const isFullProperty =
            first &&
            match.pre.trim() === '' &&
            (match.post.replace(/\s*\!important$/, '') === '');
          // Does the variable represent all the arguments of a function?
          const isOnlyFunctionArgument = /^\s*\)/.test(match.post) && /\w+(-\w+)*\(\s*$/.test(match.pre);
          const cssFunc = !isOnlyFunctionArgument ? null : match.pre.match(/(\w+(-\w+)*)\(\s*$/)[1];

          first = false;

          // There may be other commas in the values so this isn't necessarily just 2 pieces.
          // By spec everything after the first comma (including commas) is a single default value we'll join again.
          const [variableName, ...defaultValueSplit] = varArguments;

          const defaultValue = defaultValueSplit.join(',');

          const usage = {
            selector,
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
          if (!(variableName in collected)) {
            collected[variableName] = { properties: {}, usages: [] };
          }
          collected[variableName].usages.push(usage);
          collected[variableName].properties[property] = {isFullProperty, fullValue, isImportant};

          // Replace variable name (first occurrence only) from result, to avoid circular loop
          value =
            (match.pre || '') +
            match.body.replace(variableName, '') +
            (match.post || '');
        }
      }
    }
  }
  if (rule.type === 4) {
    // No nested media queries for now.
    [...rule.cssRules].forEach(innerRule => collectRuleVars(collected, innerRule, sheet, rule.conditionText.includes('prefers-reduced-motion') ?  null : rule.conditionText, supports));
  }
  if (rule.type === 12) {
    // No support for nested supports queries for now.
    [...rule.cssRules].forEach(innerRule => collectRuleVars(collected, innerRule, sheet, media, rule.conditionText));
  }

  return collected;
};

