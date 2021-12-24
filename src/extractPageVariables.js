// eslint-disable-next-line no-undef
import {collectRuleVars} from './collectRuleVars';

// For now only extract from the same domain.
export const isSameDomain = ({ href }) => !href || href.indexOf(window.location.origin) === 0;
// For now hard coded exclude of WP core files. Could be made configurable.
export const isNotCoreFile = ({ href }) => !href || !href.includes('wp-includes');

const sourceMapConsumers = {};

const warmupConsumers = sheets => sheets.map(sheet => getConsumer(sheet));

const getConsumer = async sheetUrl => {
  if (!sourceMapConsumers[sheetUrl]) {
    const mapUrl = sheetUrl.split('?')[0] + '.map';
    const data = await (await fetch(mapUrl)).json();
    sourceMapConsumers[sheetUrl] = await new window.sourceMap.SourceMapConsumer(data);
  }

  return sourceMapConsumers[sheetUrl];
};

const getLineVarPositions = (varName, sourceMapConsumer, sheet) => async (positions, line) => {
  const {text, index} = line;
  const occurrenceStart = `var(${varName}`;
  const [pre, ...matches] = text.split(occurrenceStart);

  let column = pre.length;

  for (const match of matches) {
    const line = index + 1;
    if (!/^[\w-]/.test(match)) {
      return [
        ...await positions,
        {
          ...sourceMapConsumer.originalPositionFor({line, column}),
          generated: {
            line,
            column,
            sheet,
          },
        }
      ];
    }
    column += occurrenceStart.length + match.length;
  }
  return await positions;
};

const sheetLines = {};

const getSheetLines = async sheetUrl => {
  if (!(sheetUrl in sheetLines)) {
    console.warn('getting sheet lines');
    const sheetText = await (await fetch(sheetUrl)).text();

    sheetLines[sheetUrl] = sheetText.split('\n').reduce((linesWithVar, line, index) => {
      if (line.includes('var(')) {
        linesWithVar.push({text: line, index});
      }
      return linesWithVar;
    }, []);
  }

  return sheetLines[sheetUrl];
};

const warmupLines = sheets => sheets.map(sheet=>getSheetLines(sheet));

const getVarPositions = (sheet, varName, sourceMapConsumer) => {
  if (!sheet) {
    console.log(varName, 'NO SHEET');
    return [];
  }
  const lines = sheetLines[sheet];
  if (!lines) {
    // Shouldn't happen but just in case.
    console.log('no lines', sheet, Object.keys(sheetLines));
    return [];
  }

  return lines.reduce(getLineVarPositions(varName, sourceMapConsumer, sheet), []);
};

const collectSheetVars = (vars, sheet) => {
  return [...sheet.cssRules].reduce((sheetVars, rule) => collectRuleVars(sheetVars, rule, sheet), vars);
};

const isUsed = (vars,sheet) => {
  return vars.some(({usages}) => usages.some(usage => usage.sheet === sheet.href));
};

const warmup = async (vars, sheets) => {
  const promises = sheets.filter(s => s.href && isUsed(vars, s)).map(sheet => {
    return [
      ...warmupConsumers([sheet.href]),
      ...warmupLines([sheet.href])
    ];
  });
  return await Promise.allSettled(...promises);
};

export const extractPageVariables = async() => {
  const startTime = performance.now();
  const sheets = [...document.styleSheets].filter(isSameDomain).filter(isNotCoreFile);
  const asObject = sheets.reduce(collectSheetVars, {});

  const allVars = Object.entries(asObject).map(([k, v]) => ({name: k, ...v}));

  await warmup(allVars, sheets);

  const promises = allVars.map(async (cssVar) => {
    const {name, usages} = cssVar;
    const sheetsUsingIt = [...new Set(usages.filter(u => u.sheet).map(u => u.sheet))];

    const positions = await sheetsUsingIt.reduce(async (positions, sheet) => {
      const sourceMapConsumer = sourceMapConsumers[sheet];
      const newPositions = getVarPositions(sheet, name, sourceMapConsumer);

      return [...await positions, ...await newPositions];
    }, []);

    return {
      ...cssVar,
      usages: cssVar.usages.map((u, i) => ({...u, position: positions[i]})),
      positions,
    };
  });

  const results = await Promise.allSettled( promises );
  Object.values(sourceMapConsumers).map(async consumer => {
    consumer.destroy;
  });
  const duration = performance.now() - startTime;
  console.log(`Extracted data in ${duration}ms`);

  return await results.filter(wasFulfilled).map(result => result.value);
};
const wasFulfilled = result => 'fulfilled' === result.status;
