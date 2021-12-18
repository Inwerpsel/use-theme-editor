// eslint-disable-next-line no-undef
const balancedVar = require('./balancedVar');

// For now only extract from the same domain.
export const isSameDomain = ({ href }) => !href || href.indexOf(window.location.origin) === 0;
// For now hard coded exclude of WP core files. Could be made configurable.
export const isNotCoreFile = ({ href }) => !href || !href.includes('wp-includes');

window.sourceMap && window.sourceMap.SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm'
});

const sourceMapConsumers = {};

const warmupConsumers = async sheets => await Promise.allSettled(sheets.map(async sheet => getConsumer(sheet)));

const getConsumer = async sheetUrl => {
  if (!sourceMapConsumers[sheetUrl]) {
    const mapUrl = sheetUrl.split('?')[0] + '.map';
    const data = await (await fetch(mapUrl)).json();
    sourceMapConsumers[sheetUrl] = await new window.sourceMap.SourceMapConsumer(data);
  }

  return sourceMapConsumers[sheetUrl];
};

const getLineVarPositions = (varName, sourceMapConsumer, sheet) => (positions, line, lineIndex) => {
  const occurrenceStart = `var(${varName}`;

  const [pre, ...matches] = line.split(occurrenceStart);

  let column = pre.length;

  for (const match of matches) {
    const line = lineIndex + 1;

    // Don't record position if it's the start of a longer variable name.
    /^[\w-]/.test(match) || positions.push({
      ...sourceMapConsumer.originalPositionFor({line, column}),
      generated: {
        line,
        column,
        sheet,
      }
    });
    column += occurrenceStart.length + match.length;
  }

  return positions;
};

const sheetLines = {};

const getSheetLines = async sheetUrl => {
  if (!sheetLines[sheetUrl]) {
    const text = await (await fetch(sheetUrl)).text();
    sheetLines[sheetUrl] = text.split('\n');
  }

  return sheetLines[sheetUrl];
};

const warmupLines = async sheets => {
  await Promise.allSettled(sheets.map(getSheetLines));
};

const getVarPositions = async (sheet, varName, sourceMapConsumer) => {
  if (!sheet) {
    console.log(varName, 'NO SHEET');
    return [];
  }
  const lines = await getSheetLines(sheet);

  return lines.reduce(getLineVarPositions(varName, sourceMapConsumer, sheet), []);
};

const collectRuleVars = (collected, rule, sheet, media = null, supports = null) => {
  if (rule.type === 1) {
    // Don't collect :root usages for now, it needs special handling and currently causes bugs in the editor.
    if (rule.selectorText.includes(':root')) {
      return collected;
    }
    // Rule is a selector.
    // Parse CSS text to get original declarations.
    const ruleBody = rule.cssText.trim().replace(/^.*{/, '').replace(/;?\s*}\s*$/, '');
    const decls = ruleBody.split(';').map(decl => decl.split(':'));

    decls.forEach(([propertyRaw, ...value]) => {
      // Rejoin in case there could be more ":" inside of the value.
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
    return collected;
  }
  if (rule.type === 4) {
    // No nested media queries for now.
    [...rule.cssRules].forEach(innerRule => collectRuleVars(collected, innerRule, sheet, rule.conditionText, supports));
    return collected;
  }
  if (rule.type === 12) {
    // No nested supports queries for now.
    [...rule.cssRules].forEach(innerRule => collectRuleVars(collected, innerRule, sheet, media, rule.conditionText));
    return collected;
  }

  return collected;
};

const collectSheetVars = (vars, sheet) => {
  return [...sheet.cssRules].reduce((sheetVars, rule) => collectRuleVars(sheetVars, rule, sheet), vars);
};

export const extractPageVariables = async() => {
  const startTime = performance.now();
  const sheets = [...document.styleSheets].filter(isSameDomain).filter(isNotCoreFile);
  const asObject = sheets.reduce(collectSheetVars, {});

  const asArray = Object.entries(asObject).map(([k, v]) => ({name: k, ...v}));

  const promises = await asArray.map(async (cssVar) => {
    const {name, usages} = cssVar;
    const sheetsUsingIt = [...new Set(usages.filter(u => u.sheet).map(u => u.sheet))];

    await Promise.allSettled([await warmupConsumers(sheetsUsingIt), await warmupLines(sheetsUsingIt)]);

    const positions = await sheetsUsingIt.reduce(async (positions, sheet) => {
      const sourceMapConsumer = await getConsumer(sheet);
      const newPositions = await getVarPositions(sheet, name, sourceMapConsumer);

      return [...await positions, ...newPositions];
    }, []);

    return {
      ...cssVar,
      usages: cssVar.usages.map((u, i) => ({...u, position: positions[i]})),
      positions,
    };
  });

  const results = await Promise.allSettled( promises );
  Object.values(sourceMapConsumers).forEach(consumer => consumer.destroy);
  const duration = performance.now() - startTime;
  console.log(`Extracted data in ${duration}ms`);

  const values = await results.filter( wasFulfilled ).map( result => result.value );
  console.log(values);

  return values;
};
const wasFulfilled = result => 'fulfilled' === result.status;
