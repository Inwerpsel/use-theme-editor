import React, { Fragment, useContext } from 'react';
import { TextControl } from "../controls/TextControl";
import { ThemeEditorContext } from '../ThemeEditor';
import { findClosingBracket } from '../../functions/compare';
import { splitCommaSafeParentheses } from '../../functions/getOnlyMostSpecific';
import { get, use } from '../../state';
import { VariableControl } from '../inspector/VariableControl';
import { ACTIONS } from '../../hooks/useThemeEditor';

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

function resolveUnits(_value, scenario) {
  const isNegative = _value[0] === '-';
  const sign = isNegative ? -1 : 1;
  const value = isNegative ? _value.slice(1) : _value;

  // Resolve constants
  if (value.toLowerCase() in mathConstants) {
    return mathConstants[value.toLowerCase()] * sign;
  }
  const numericPart = parseFloat(value.replaceAll(/[^\d\.]/g, '')) * sign;
  let unitPart = value.replace(/\d|\./g, '');
  // Todo: Inject correct value measured from element.
  // This is also needed for other units and probably needs other things, like container dimensions.
  // Now wrongly using root size to be able to use the expression anyway for testing.
  if (unitPart === 'em') {
    unitPart = 'rem';
  }
  if (unitPart === '') {
    return numericPart;
  }
  const {width = 360, height = 640, remFactor = 16, resultUnit = 'px'} = scenario;

  if (unitPart === '%') {
    throw new Error('Cannot handle percentages.')
  }

  if (resultUnit === 'rem') {
    if (unitPart === 'rem') {
      return numericPart;
    }
    if (unitPart === 'px') {
      return numericPart / remFactor;
    }
    if (unitPart === 'vw') {
      return (numericPart / 100) * width / remFactor;
    }
    if (unitPart === 'vh') {
      return (numericPart / 100) * height / remFactor;
    }
    throw new Error(`Unsupported unit. "${unitPart}"`)

  } else if (resultUnit === 'px') {
    if (unitPart === 'rem') {
      const result = numericPart * remFactor;
      scenario.steps.push({
        before: value,
        result:
          numericPart === 1
            ? result
            : `${numericPart} * ${remFactor} = ${result}`,
      });
      return result;
    }
    if (unitPart === 'px') {
      return numericPart;
    }
    if (unitPart === 'vw') {
      const result = width * numericPart / 100;
      scenario.steps.push({
        before: value,
        result: `${width} * ${numericPart}/100 = ${result}`,
      });
      return result;
    }
    if (unitPart === 'vh') {
      const result = height * numericPart / 100;
      scenario.steps.push({
        before: value,
        result: `${height} * ${numericPart}/100 = ${result}`,
      });
      return result;
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

  scenario.steps.push({orig: {arg1, arg2}, a, operator, b, result});

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
  let cursor = 0, previousChar = '', char = '', nextChar = '';

  const parser = {
    '('() {
      const closingBracketPosition = findClosingBracket(expression, cursor);
      if (buffer === 'var') {
        throw new Error('Expression contains unresolved variable.')
      }

      const inside = expression.substring(cursor + 1, closingBracketPosition);
      const possibleFunction = buffer.toLowerCase();

      if (possibleFunction === 'clamp') {
        const args = splitCommaSafeParentheses(inside).map(v => evaluateCalc(v.trim(), scenario));
        const [min, preferred, max] = args;
        // console.log('CLAMP', args);
        buffer = parseFloat(preferred) < parseFloat(min) ? min : parseFloat(preferred) > parseFloat(max) ? max : preferred;

        scenario.steps.push({mathFunc: 'clamp', args, result: buffer});

      } else if (possibleFunction === 'min') {
        const args = splitCommaSafeParentheses(inside).map(v => evaluateCalc(v.trim(), scenario));
        buffer = args.reduce(
          (lowest, v) => (v < lowest ? v : lowest),
          Infinity
        );
        scenario.steps.push({mathFunc: 'min', args, result: buffer});
      } else if (possibleFunction === 'max') {
        const args = splitCommaSafeParentheses(inside).map(v => evaluateCalc(v.trim(), scenario));
        buffer = args.reduce(
          (highest, v) => (v > highest ? v : highest),
          -Infinity
        );
        scenario.steps.push({mathFunc: 'max', args, result: buffer});
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
      if (previousChar !== ' ' && previousChar !== undefined) {
        throw new Error('Plus operator cannot be preceded by a space.')
      }
      if (nextChar === ' ') {
        pendingOperation = ['+', buffer];
      }
      buffer = '';
    },
    '-'() {
      if (previousChar !== ' ' && previousChar !== undefined) {
        throw new Error('Minus operator cannot be preceded by a space.')
      }
      if (nextChar === ' ') {
        pendingOperation = ['-', buffer];
        buffer = '';
      } else {
        buffer = '-';
      }
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
    previousChar = expression[cursor - 1];
    char = expression[cursor];
    nextChar = expression[cursor + 1];

    if (char in parser) {
      const isPlusOrMinusSomething = (nextChar !== ' ') && (char === '+' || char === '-');
      if (!isPlusOrMinusSomething && char !== '(' && pendingOperation) {
        if (precedence[char] > precedence[pendingOperation[0]]) {
          console.log('higher precedence, delay', pendingOperation, buffer, char);
          pendingStack.push(pendingOperation);
        } else {
          console.log('lower or equal precedence, perform', pendingOperation, buffer, char);
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
    scenario.steps = [];
    try {
      results.push([scenario, evaluateCalc(expression, scenario)]);
    } catch(e) {
      results.push([scenario, e.message]);
    }
  }

  return results;
}

type Args = (string|number)[];

const describeInvocation = {
  min(args: Args, result) {
    return `Take lowest of [${args.join(', ')}] = ${result}`
  },
  max(args: Args, result) {
    return `Take highest of [${args.join(', ')}] = ${result}`
  },
  clamp([min, preferred, max], result) {
    return `Clamp ${preferred} between ${min} and ${max} = ${result}`;
  },
};

export function CalcSizeControl(props) {
  const {value, resolvedValue, referencedVars, onChange, elementScopes} = props;
  const {width, height} = get;
  const [{scopes}, dispatch] = use.themeEditor();
  const {
    frameRef,
    allVars,
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

  const remFactor = parseFloat(rootFontSize.replace('px', ''));

  const results = evaluateScenarios(resolvedExpression, [
    {width, height, remFactor, resultUnit: 'px'},
    // {width, height, remFactor, resultUnit: 'rem'},
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
        {results.map(([{ width, height, resultUnit, remFactor, steps }, result]) => {
          const k = `${width}x${height}~${resultUnit}~${remFactor}`;
          return (
            <li key={k}>
              <code style={{cursor: 'pointer', fontSize: '2rem'}} onClick={() => onChange(`${result}${resultUnit}`)}>
                {result}
                {resultUnit}
              </code>
              <pre><code>at {width}x{height}</code></pre>
              <br />
              <br />
              <code>{resolvedOuter}</code>
              <h5>Steps</h5>
              <ul>
                {steps.map((step, i) => {
                  let comp;
                  if (step.mathFunc) {
                    const {mathFunc, args, result} = step;
                    comp = <code>{describeInvocation[mathFunc](args, result)}</code>;
                  } else if (step.operator) {
                    const {orig: {arg1, arg2}, a, operator, b, result} = step;
                    comp = <code title={`${arg1} ${operator} ${arg2}`}>{a} {operator} {b} = {result}</code>;
                  } else {
                    const {before, result} = step;
                    comp = <code>{before} = {result}</code>;
                  }

                  return <li key={i}>{comp}</li>;
                })}
              </ul>
              {referencedVars?.length > 0 && <Fragment>
                <br />
                <br />
                <h5>Variables</h5>
                <ul style={{border: '1px solid black'}}>
                  {referencedVars.map(name => {
                    const cssVar = allVars.find(v=>v.name===name) || {
                      name,
                      usages: [
                        {
                          property: 'width',
                        },
                      ],
                      properties: {width: {isFullProperty: true, fullValue: value, isImportant: false}},
                      maxSpecific: {property: 'width'},
                      positions: [],
                  };;
                    return <li key={name}>
                      <VariableControl
                        {...{
                          cssVar,
                          scopes: elementScopes,
                        }}
                        referenceChain={[{name: expression}]}
                        onChange={value => {
                          dispatch({
                            type: ACTIONS.set,
                            payload: {
                              name: cssVar.name, 
                              value,
                            }
                          });
                        }}
                        onUnset={() => {
                          dispatch({ type: ACTIONS.unset, payload: { name: cssVar.name } });
                        }}
                      />
                    </li>
                  })}
                </ul>
              </Fragment>}
            </li>
          );
        })}
      </ul>
      <br />
      <i>Root font size: {remFactor}px</i>
    </div>
  );
}
