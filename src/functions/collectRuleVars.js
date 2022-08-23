import {balancedVar} from './balancedVar';

export const definedValues = {':root': {}};

export const scopesByProperty = {};

export const collectRuleVars = (collected, rule, sheet, media = null, supports = null) => {
  if (rule.type === 1) {
    // Rule is a selector.
    // Parse cssText to get original declarations.
    const ruleBody = rule.cssText.trim().replace(/^.*{/, '').replace(/;?\s*}\s*$/, '');
    const decls = ruleBody.split(';').map(decl => decl.split(':'));
    const selector = rule.selectorText.trim();

    decls.forEach(([propertyRaw, ...splitValue]) => {
      // Rejoin in case there could be more ":" inside the value.
      let value = splitValue.join(':').trim();
      let match;
      const property = propertyRaw.trim();

      if (/^--/.test(property)) {
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

        return; // from decls.forEach
      }

      let first = true;
      while ( (match = balancedVar( value )) ) {
        // Split at the comma to find variable name and fallback value.
        const varArguments = match.body.split( ',' ).map( str => str.trim() );
        const isImportant = first && match.post.trim() === '!important';
        const isFullProperty = first && match.pre.trim() === '' && (
          match.post.trim() === ''
          || isImportant
          );
        first = false;

        // There may be other commas in the values so this isn't necessarily just 2 pieces.
        // By spec everything after the first comma (including commas) is a single default value we'll join again.
        const [variableName, ...defaultValueSplit] = varArguments;

        let defaultValue = defaultValueSplit.join(',');
        if (defaultValue === '') {
          defaultValue = definedValues[':root'][variableName];
        }

        const usage = {
          selector,
          property,
          defaultValue,
          media,
          supports,
          sheet: sheet.href,
          isFullProperty,
          fullValue: value,
        };
        if (!(variableName in collected)) {
          collected[variableName] = { properties: {}, usages: [] };
        }
        collected[variableName].usages.push(usage);
        collected[variableName].properties[property] = isFullProperty;
        // Replace variable name (first occurrence only) from result, to avoid circular loop
        value = (match.pre || '') + match.body.replace(variableName, '') + (match.post || '');
      }
    });
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

