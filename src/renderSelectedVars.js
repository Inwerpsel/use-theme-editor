import React from 'react';
import {render} from 'react-dom';
import { createRoot} from 'react-dom/client';
import { COLOR_VALUE_REGEX, GRADIENT_REGEX } from './components/properties/ColorControl';
import {ThemeEditor} from './components/ThemeEditor';
import { SharedActionHistory } from './hooks/useResumableReducer';

let root;
const size = 18;


export const previewComponents = {
  THEME_EDITOR: {
    set: ({ payload: { scope, name, value } }) => (
      <div>
        {scope && <pre className="monospace-code">{scope}</pre>}
        <br />
        <b>{name}</b> =
        {(COLOR_VALUE_REGEX.test(value) || GRADIENT_REGEX.test(value)) && (
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
      </div>
    ),
    unset: ({ payload: { scope, name } }) => (
      <div>
        {scope && <pre className="monospace-code">{scope}</pre>}
        <br />
        <b>{name}</b> = default
      </div>
    ),
  },
};

let lastInspectedIndex = -1;

export const renderSelectedVars = (
  rootElement,
  lastTarget,
  groups,
  allVars,
  config,
  defaultValues,
  inspectedIndex,
) => {
  const isNewInspection = inspectedIndex > lastInspectedIndex;
  if (isNewInspection) {
    lastInspectedIndex = inspectedIndex;
  }
  const el = (
    <SharedActionHistory {...{previewComponents}}>
      <ThemeEditor
        {...{ config, groups, lastTarget, allVars, defaultValues, inspectedIndex, isNewInspection }}
        lastInspectTime={performance.now()}
      />
    </SharedActionHistory>
  );

  if (!root) {
    root = createRoot(rootElement);
  }
  root.render(el);
};
