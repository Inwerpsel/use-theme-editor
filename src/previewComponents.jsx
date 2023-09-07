import React from 'react';
import { COLOR_VALUE_REGEX, GRADIENT_REGEX } from './components/properties/ColorControl';
import {prevGroups} from './components/ThemeEditor';
import { SelectControl } from './components/controls/SelectControl';

const size = 18;

export const previewComponents = {
  OPEN_GROUPS: ({ action: groups }) => (
    <div>
      <pre className="monospace-code" style={{ float: 'left' }}>
        {Object.entries(groups).map(([k, v]) => [
          k,
          <b style={{ float: 'right', color: 'white', background: 'black' }}>
            {v ? 'open' : 'close'}
          </b>,
        ])}
      </pre>
    </div>
  ),

  'inspected-index': ({ action: index }) => (
    <div>
      Inspect
      <pre className="monospace-code">{prevGroups[index][0]?.label}</pre>
    </div>
  ),

  THEME_EDITOR: {
    set: ({ payload: { scope, name, value, alternatives } }) => {
      
      return (
        <div>
          {scope && <pre className="monospace-code">{scope}</pre>}
          <br />
          <b>{name}</b> =
          {(COLOR_VALUE_REGEX.test(value) ||
            GRADIENT_REGEX.test(value) ||
            /var\(/.test(value)) && (
            <span
              draggable
              onDragStart={(e) => e.dataTransfer.setData('value', value)}
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
        </div>
      );
    },

    unset: ({ payload: { scope, name } }) => (
      <div>
        {scope && <pre className="monospace-code">{scope}</pre>}
        <br />
        <b>{name}</b> = default
      </div>
    ),

    createAlias: ({ payload: { name, value, generatedName } }) => (
      <div
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
      </div>
    ),
  },
};