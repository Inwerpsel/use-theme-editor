import React from 'react';
import { TextControl } from "../controls/TextControl";

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

  return operators[operator](a, b);
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
      // Locate closing and evaluate inner expression.
      let nests = 0;
      const startPosition = cursor + 1;
      let closingBracketPosition = cursor + 1;
      for (; closingBracketPosition <= expression.length; closingBracketPosition++) {
        if (expression[closingBracketPosition] === ')') {
          if (nests === 0) {
            break;
          }
          nests--;
          if (nests < 0) {
            throw new Error('Unmatched closing bracket.')
          }
        }
        if (expression[closingBracketPosition] === '(') {
          nests++;
        }
      }
      if (buffer === 'var') {
        // Might be some other functions possible here if they return the right values.
        throw new Error('var inside calc support coming soon.')
      } else {
        buffer = evaluateCalc(
          expression.substring(startPosition, closingBracketPosition),
          scenario
        );
        cursor = closingBracketPosition;
      }

    },
    ')'() {
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
  const {value, onChange} = props;

  const expression = value
  // Extract only inner expression.
  .replace(/calc\(/, '')
  .replace(/\)$/, '')
  // Replace inner `calc` expressions with just parentheses.
  .replaceAll('calc(', '(');

  const results = evaluateScenarios(expression, [
    {width: 360, height: 640, remFactor: 16, resultUnit: 'px'},
    {width: 1920, height: 1080, remFactor: 16, resultUnit: 'px'},
    {width: 360, height: 640, remFactor: 16, resultUnit: 'rem'},
    {width: 1920, height: 1080, remFactor: 16, resultUnit: 'rem'},
  ]);

  return (
    <div>
      <h3>Calculation</h3>
      <TextControl {...{value: expression, onChange: v => onChange(`calc(${v})`)}} />
      <h4>Evaluates to</h4>
      <ul>
        {results.map(([{ width, height, resultUnit, remFactor }, result]) => {
          const k = `${width}x${height}~${resultUnit}~${remFactor}`;
          return (
            <li key={k}><code onClick={() => onChange(`${result}${resultUnit}`)}>{result}{resultUnit}</code> at {width} x {height}</li>
          );
        })}
      </ul>
    </div>
  );
}
