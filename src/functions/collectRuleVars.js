import {balancedVar} from './balancedVar';

export const collectRuleVars = (collected, rule, sheet, media = null, supports = null) => {
  if (rule.type === 1) {
    // Don't collect :root usages for now, it needs special handling and currently causes bugs in the editor.
    if (rule.selectorText.includes(':root')) {
      return collected;
    }
    // Rule is a selector.
    // Parse cssText to get original declarations.
    const ruleBody = rule.cssText.trim().replace(/^.*{/, '').replace(/;?\s*}\s*$/, '');
    const decls = ruleBody.split(';').map(decl => decl.split(':'));

    decls.forEach(([propertyRaw, ...value]) => {
      // Rejoin in case there could be more ":" inside the value.
      let remainingValue = value.join(':');
      let match;
      while ( (match = balancedVar( remainingValue )) ) {
        // Split at the comma to find variable name and fallback value.
        const varArguments = match.body.split( ',' ).map( str => str.trim() );

        // There may be other commas in the values so this isn't necessarily just 2 pieces.
        // By spec everything after the first comma (including commas) is a single default value we'll join again.
        const [variableName, ...defaultValue] = varArguments;

        const usage = {
          selector: rule.selectorText,
          property: propertyRaw.trim(),
          defaultValue: defaultValue.join(','),
          media,
          supports,
          sheet: sheet.href,
        };
        if (!(variableName in collected)) {
          collected[variableName] = { usages: [] };
        }
        collected[variableName].usages.push(usage);
        // Replace variable name (first occurrence only) from result, to avoid circular loop
        remainingValue = (match.pre || '') + match.body.replace(variableName, '') + (match.post || '');
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

