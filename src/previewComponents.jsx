import React, { Fragment } from 'react';
import { COLOR_VALUE_REGEX, GRADIENT_REGEX } from './components/properties/ColorControl';
import {prevGroups} from './components/ThemeEditor';
import { SelectControl } from './components/controls/SelectControl';

const size = 18;

export const previewComponents = {
  OPEN_GROUPS: ({ action: groups }) => (
    <pre className="monospace-code" style={{ display: 'inline-block' }}>
      {Object.entries(groups).map(([k, v]) => [
        k,
        <b style={{ float: 'right', color: 'white', background: 'black' }}>
          {v ? 'open' : 'close'}
        </b>,
      ])}
    </pre>
  ),

  'inspected-index': ({ action: index }) => (
    <Fragment>
      Inspect
      <pre className="monospace-code">{prevGroups.length <= index ? '' : prevGroups[index][0]?.label}</pre>
    </Fragment>
  ),

  THEME_EDITOR: {
    set: ({ payload: { scope, name, value, alternatives } }) => {
      
      return (
        <Fragment>
          {scope && <pre className="monospace-code">{scope}</pre>}
          <br />
          <b draggable onDragStart={e=>e.dataTransfer.setData('value', `var(${name})`)}>{name}</b> =
          <span draggable onDragStart={e=>e.dataTransfer.setData('value', value)}>
            {(COLOR_VALUE_REGEX.test(value) ||
              GRADIENT_REGEX.test(value) ||
              /var\(/.test(value)) && (
              <span
                style={{
                  width: size,
                  height: size,
                  border: '1px solid black',
                  borderRadius: '6px',
                  backgroundImage: `${value}`,
                  backgroundColor: `${value}`,
                  backgroundRepeat: `no-repeat`,
                  backgroundSize: 'cover',
                  display: 'inline-block',
                  textShadow: 'white 0px 10px',
                  // backgroundSize: 'cover',
                }}
              ></span>
            )}
            {value}
          </span>
          {alternatives?.length > 0 && (
            <div>
              Alternatives (WIP, can't switch yet):{' '}
              <SelectControl
                onChange={(e) => {
                  const choice = alternatives[e.target.value];
                  console.log(choice);
                }}
                options={alternatives.map((a, i) => ({
                  label: `${a.varName} [element ${a.element} ${a.property}]`,
                  value: i,
                }))}
              />
            </div>
          )}
        </Fragment>
      );
    },

    unset: ({ payload: { scope, name } }) => (
      <Fragment>
        {scope && <pre className="monospace-code">{scope}</pre>}
        <br />
        <b>{name}</b> = default
      </Fragment>
    ),

    createAlias: ({ payload: { name, value, generatedName } }) => (
      <span
        draggable
        onDragStart={e=>e.dataTransfer.setData('value', `var(${generatedName})`)}
      >
        Alias
        <br />
        {(COLOR_VALUE_REGEX.test(value) ||
          GRADIENT_REGEX.test(value) ||
          /var\(/.test(value)) && (
          <span
            style={{
              width: size,
              height: size,
              border: '1px solid black',
              borderRadius: '6px',
              backgroundImage: `${value}`,
              backgroundColor: `${value}`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: 'cover',
              display: 'inline-block',
              textShadow: 'white 0px 10px',
            }}
          ></span>
        )}
        <b>{generatedName} = {value}</b>
      </span>
    ),
  },
};