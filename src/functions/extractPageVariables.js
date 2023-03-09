// eslint-disable-next-line no-undef
import {collectRuleVars, definedValues} from './collectRuleVars';
import { allStateSelectorsRegexp, includeDescendants } from './getMatchingVars';

// For now only extract from the same domain.
export const isSameDomain = ({ href }) => !href || href.indexOf(window.location.origin) === 0;
// For now hard coded exclude of WP core files. Could be made configurable.
export const isNotCoreFile = ({ href }) => !href || !href.includes('wp-includes');

const sourceMapConsumers = {};

const warmupConsumers = sheets => sheets.map(sheet => getConsumer(sheet));

const failedConsumers = [];
const getConsumer = async sheetUrl => {
  // console.log(sheetUrl)
  if (failedConsumers.includes(sheetUrl)) {
    return;
  }
  if (!sourceMapConsumers[sheetUrl]) {
    const mapUrl = sheetUrl.split('?')[0] + '.map';
    try {
      let data = await (await fetch(mapUrl)).json();
      sourceMapConsumers[sheetUrl] = await new window.sourceMap.SourceMapConsumer(data);
    } catch (e) {
      // console.log(e);
      failedConsumers.push(sheetUrl);
      return;
    }
  }

  return sourceMapConsumers[sheetUrl];
};

const getLineVarPositions = (varName, sourceMapConsumer, sheet) => (positions, line) => {
  const {text, index} = line;
  if (/^\s*--/.test(text) ) {
    // Skip custom properties, to preserve same logic and ordering as extractPageVariables.
    return positions;
  }
  const occurrenceStart = `var(${varName}`;
  const [pre, ...matches] = text.split(occurrenceStart);

  let column = pre.length;

  for (const match of matches) {
    const line = index + 1;
    if (!/^[\w-]/.test(match)) {
      positions.push({
          ...sourceMapConsumer.originalPositionFor({line, column}),
          generated: {
            line,
            column,
            sheet,
          },
        });
      return positions;
    }
    column += occurrenceStart.length + match.length;
  }
  return positions;
};

const sheetLines = {};

const getSheetLines = async sheetUrl => {
  if (!(sheetUrl in sheetLines)) {
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
    return [];
  }
  const lines = sheetLines[sheet];
  if (!lines) {
    // Shouldn't happen but just in case.
    console.warn('no lines', sheet, Object.keys(sheetLines));
    return [];
  }

  return lines.reduce(getLineVarPositions(varName, sourceMapConsumer, sheet), []);
};

const collectSheetVars = async (vars, sheet) => {
  let rules;
  if (isSameDomain(sheet)) {
    rules = sheet.cssRules;
  } else {
    try {
      const sheetContent = await (await fetch(sheet.href)).text();
      const style = document.createElement('style');
      style.innerText = sheetContent;
      document.head.appendChild(style);
      rules = document.styleSheets[document.styleSheets.length - 1].cssRules;
      document.head.removeChild(style);
    } catch (e) {
      return await vars;
    }
  }
  return [...rules].reduce((sheetVars, rule) => collectRuleVars(sheetVars, rule, sheet), await vars);
};

const isUsed = (vars,sheet) => {
  return vars.some(({usages}) => usages.some(usage => usage.sheet === sheet.href));
};

const warmup = async (vars, sheets) => {
  const filteredSheets = sheets.filter(s => s.href && isUsed(vars, s) && isSameDomain(s));
  // console.log(filteredSheets)
  const promises = filteredSheets.map(sheet => {
    return [
      ...warmupConsumers([sheet.href]),
      ...warmupLines([sheet.href])
    ];
  });
  // return;
  if (promises.length === 0) {
    return await Promise.allSettled([]);
  }
  const joined = promises.reduce((a,p) => [...a, ...p] ,[]);

  return await Promise.allSettled(joined);
};

let activeScopes = [];
export let rootScopes = [];
export const sourceReferences = {}

export function statelessSelector(selectors) {
  return (
    includeDescendants(selectors)
      .replace(allStateSelectorsRegexp, '')
      .replace(/:?:(before|after|first\-letter)/g, '')
      // Try fix remaining descendants pointing to nothing.
      .trim()
      .replaceAll(/^\s*[\>+~]/g, '')
      .replaceAll(/,\s*[\>+~]/g, ',')
      .replaceAll(/[\>+~]\s*,/g, ',')
      .replaceAll(/[\>+~]\s*$/g, '')
      .replaceAll(/[\>+~]\s*\)/g, ')')
      .replaceAll(/\(\s*[\>+~]/g, '(')
      .replaceAll(/,(\s*,)+/g, ',')
      .replaceAll(/:(where|is|not)\([\s,]*\)/g, '')
      .replace(/^(\s*,\s*)+/, '')
      .replace(/(\s*,\s*)+$/, '')
      .replaceAll(/\s*,\s*/g, ',')
      // Seems to happen for Tailwind special.
      // .replaceAll(/\//g, '\\/')
      .replaceAll(/,\s*\)/g, ')')
  );
}

export const extractPageVariables = async() => {
  const startTime = performance.now();
  const sheets = [...document.styleSheets];
  const asObject = await sheets.reduce(collectSheetVars, {});

  activeScopes = Object.keys(definedValues).filter(scopeSelector => document.querySelectorAll(scopeSelector).length > 0);
  // We can only know for sure on active scopes whether they only apply to the root element.
  // Should catch most cases though.
  rootScopes = activeScopes.filter(scopeSelector => document.querySelector(scopeSelector) === document.documentElement);

  const allVars = Object.entries(asObject).map(([k, v]) => ({
    name: k,
    sourceReferences: Object.keys(asObject).filter(
      otherV => asObject[otherV].usages.some(u => u.fullValue.includes(`var(${k},`) || u.fullValue.includes(`var${k})`))
    ),
    ...v,
    statelessSelector: statelessSelector([...new Set(v.usages.map(usage => usage.selector))]),
  }));
  // console.log(allVars.filter(v => v.sourceReferences.length > 0));

  await warmup(allVars, sheets);

  const promises = allVars.map((cssVar) => {
    const {name, usages} = cssVar;
    const sheetsUsingIt = [...new Set(usages.filter(u => u.sheet).map(u => u.sheet))];

    const positions = sheetsUsingIt.reduce((positions, sheet) => {
      const sourceMapConsumer = sourceMapConsumers[sheet];
      if (!sourceMapConsumer) {
        return positions;
      }
      const newPositions = getVarPositions(sheet, name, sourceMapConsumer);

      positions.push(...newPositions);
      return positions;
    }, []);
    cssVar.usages = cssVar.usages.map((u, i) => {
      u.position = positions[i];
      return u;
    });
    cssVar.positions = positions;

    return cssVar;
  });

  const results = await Promise.allSettled( promises );
  Object.values(sourceMapConsumers).forEach(consumer => consumer && consumer.destroy());
  const duration = performance.now() - startTime;
  console.info(`Extracted data in ${duration}ms`);

  return await results.filter(wasFulfilled).map(result => result.value);
};
const wasFulfilled = result => 'fulfilled' === result.status;
