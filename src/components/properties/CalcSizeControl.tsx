import React, { useContext } from 'react';
import { TextControl } from "../controls/TextControl";
import { ThemeEditorContext } from '../ThemeEditor';
import { findClosingBracket } from '../../functions/compare';
import { splitCommaSafeParentheses } from '../../functions/getOnlyMostSpecific';
import { get } from '../../state';

// True if the expression is a single `calc` expression,
// or a single mathematical function (min, max, clamp).
export function isSingleMathExpression(value = '') {
  if (!value.includes('(')) {
    return false;
  }
  const openingBracket = value.indexOf('(');
  const fName = value.slice(0, openingBracket).toLowerCase();
  if (!['calc', 'min', 'max', 'clamp'].includes(fName)) {
    // console.log('No math function', fName)
    return false;
  }

  if (findClosingBracket(value, openingBracket) < value.length - 1) {
    // console.log('Not a single expression', value);
    return false;
  }

  return true;
}

const operators = {
  '+'(a, b) {
    return parseFloat(a) + parseFloat(b);
  },
  '-'(a, b) {
    return parseFloat(a) - parseFloat(b);
  },
  '*'(a, b) {
    return parseFloat(a) * parseFloat(b);
  },
  '/'(a, b) {
    return parseFloat(a) / parseFloat(b);
  },
}

const mathConstants = {
  e: Math.E,
  pi: Math.PI,
  infinity: Infinity,
  // Let's ignore minus infinity, seems useless as a keyword and it makes parsing a lot harder.
}

function resolveUnits(value, scenario) {
  // Resolve constants
  if (value in mathConstants) {
    return mathConstants[value];
  }
  const numericPart = value.replaceAll(/[^\d\.]/g, '');
  let unitPart = value.replace(/\d|\./g, '');
  if (unitPart === 'em') {
    unitPart = 'rem';
  }
  if (unitPart === '') {
    return numericPart;
  }
  const {width = 360, height = 640, remFactor = 16, resultUnit = 'px'} = scenario;

  if (unitPart === '%') {
    const up = new Error('Cannot handle percentages.')
    throw up;
  }

  if (resultUnit === 'rem') {
    if (unitPart === 'rem') {
      return numericPart;
    }
    if (unitPart === 'px') {
      return numericPart / remFactor;
    }
    if (unitPart === 'vw') {
      return (numericPart / 100) * width / 26;
    }
    if (unitPart === 'vh') {
      return (numericPart / 100) * height / 26;
    }
    throw new Error(`Unsupported unit. "${unitPart}"`)
  } else if (resultUnit === 'px') {
    if (unitPart === 'rem') {
      return numericPart * remFactor;
    }
    if (unitPart === 'px') {
      return numericPart;
    }
    if (unitPart === 'vw') {
      return width * numericPart / 100;
    }
    if (unitPart === 'vh') {
      return height * numericPart / 100;
    }
    throw new Error(`Unsupported unit. "${unitPart}"`)
  }

  throw new Error('Unsupported result unit.')
}

function resolveOperation([operator, arg1], arg2, scenario) {
  if (!(operator in operators)) {
    throw new Error('Unknown operator');
  }

  const a = resolveUnits(`${arg1}`.trim(), scenario);
  const b = resolveUnits(`${arg2}`.trim(), scenario);

  const result = operators[operator](a, b);

  console.log('operation', {orig: {arg1, arg2}, a, operator, b, result})

  return result;
}

const precedence = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 3,
};

function evaluateCalc(expression, scenario) {
  let buffer = '';
  // [operator, first arg] sits waiting for new arg as it's discovered.
  let pendingOperation;

  const pendingStack = [];

  // Position in expression.
  let cursor = 0;

  const parser = {
    '('() {
      const closingBracketPosition = findClosingBracket(expression, cursor);
      if (buffer === 'var') {
        throw new Error('Expression contains unresolved variable.')
      }

      const inside = expression.substring(cursor + 1, closingBracketPosition);
      const possibleFunction = buffer.toLowerCase();

      if (possibleFunction === 'clamp') {
        const args = splitCommaSafeParentheses(inside).map(v => evaluateCalc(v, scenario));
        const [min, preferred, max] = args;
        // console.log('CLAMP', args);
        buffer = parseFloat(preferred) < parseFloat(min) ? min : parseFloat(preferred) > parseFloat(max) ? max : preferred;
      } else if (possibleFunction === 'min') {
        const args = splitCommaSafeParentheses(inside).map(v => evaluateCalc(v, scenario));
        buffer = args.reduce(
          (lowest, v) => (v < lowest ? v : lowest),
          Infinity
        );
      } else if (possibleFunction === 'max') {
        const args = splitCommaSafeParentheses(inside).map(v => evaluateCalc(v, scenario));
        buffer = args.reduce(
          (highest, v) => (v > highest ? v : highest),
          -Infinity
        );
      } else {
        buffer = evaluateCalc(
          inside,
          scenario
        );
      }
      cursor = closingBracketPosition;
    },
    ')'() {
        // 
        throw new Error('Unmatched closing bracket.')
    },
    '+'() {
      pendingOperation = ['+', buffer];
      buffer = '';
    },
    '-'() {
      pendingOperation = ['-', buffer];
      buffer = '';
    },
    '/'() {
      pendingOperation = ['/', buffer];
      buffer = '';
    },
    '*'() {
      pendingOperation = ['*', buffer];
      buffer = '';
    },
  }
  while (cursor < expression.length) {
    const char = expression[cursor];
    if (char in parser) {
      if (char !== '(' && pendingOperation) {
        if (precedence[char] > precedence[pendingOperation[0]]) {
            // throw new Error('Help I cannot handle this precedence thing yet.')
            pendingStack.push(pendingOperation);
       } else {
            buffer = resolveOperation(pendingOperation, buffer, scenario);
            pendingOperation = null;
        }
      }
      parser[char]();
    } else {
        if (buffer !== '' || char !== ' ') {
            buffer += char;
        }
    }
    cursor++;
  }
  if (pendingOperation) {
    buffer = resolveOperation(pendingOperation, `${buffer}`.trim(), scenario);
  }
  while (pendingStack.length > 0) {
    buffer = resolveOperation(pendingStack.pop(), buffer, scenario);
  }
  return resolveUnits(`${buffer}`.trim(), scenario);
}

function evaluateScenarios(expression, scenarios) {
  const results = [];
  for (const scenario of scenarios) {
    try {
      results.push([scenario, evaluateCalc(expression, scenario)]);
    } catch(e) {
      results.push([scenario, e.message]);
    }
  }

  return results;
}

export function CalcSizeControl(props) {
  const {value, resolvedValue, onChange} = props;
  const {width, height} = get;
  const {
    frameRef,
  } = useContext(ThemeEditorContext);

  const outer = value.startsWith('calc(') 
    ? value.replace(/calc\(/, '').replace(/\)$/, '')
    : value;

  // Replace inner `calc` expressions with just parentheses.
  const expression = outer.replaceAll('calc(', '(');

  const resolvedOuter = resolvedValue.startsWith('calc(')
    ? resolvedValue.replace(/calc\(/, '').replace(/\)$/, '')
    : resolvedValue;
  const resolvedExpression = resolvedOuter.replaceAll('calc(', '(');

  const rootFontSize = getComputedStyle(frameRef.current.contentWindow.document.documentElement).getPropertyValue('font-size');

  const remFactor = parseInt(rootFontSize.replace('px', ''));

  const results = evaluateScenarios(resolvedExpression, [
    {width, height, remFactor, resultUnit: 'px'},
    {width, height, remFactor, resultUnit: 'rem'},
    // {width: 360, height: 640, remFactor, resultUnit: 'px'},
    // {width: 360, height: 640, remFactor, resultUnit: 'rem'},
    // {width: 1920, height: 1080, remFactor, resultUnit: 'px'},
    // {width: 1920, height: 1080, remFactor, resultUnit: 'rem'},
  ]);

  return (
    <div>
      <h3>Calculation</h3>
      <TextControl
        {...{
          style: { width: '100%' },
          value: expression,
          onChange: (v) => onChange(isSingleMathExpression(v) ? v : `calc(${v})`),
        }}
      />
      <h4>Evaluates to</h4>
      <ul>
        {results.map(([{ width, height, resultUnit, remFactor }, result]) => {
          const k = `${width}x${height}~${resultUnit}~${remFactor}`;
          return (
            <li key={k}>
              <code onClick={() => onChange(`${result}${resultUnit}`)}>
                {result}
                {resultUnit}
              </code>{' '}
              at {width} x {height}
            </li>
          );
        })}
      </ul>
      <br />
      <i>Root font size: {remFactor}px</i>
    </div>
  );
}
