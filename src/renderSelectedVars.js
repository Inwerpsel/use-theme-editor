import React from 'react';
import {render} from 'react-dom';
import { createRoot} from 'react-dom/client';
import {ThemeEditor} from './components/ThemeEditor';
import { SharedActionHistory } from './hooks/useResumableReducer';

let root;
const size = 22;

export const previewComponents = {
  THEME_EDITOR: {
    set: ({ payload: { scope, name, value } }) => (
      <div>
        {scope && <pre className='monospace-code'>{scope}</pre>}<br/>
        <b>{name}</b> = {value}
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
      </div>
    ),
    unset: ({ payload: { scope, name } }) => (
      <div>
        {scope && <pre className='monospace-code'>{scope}</pre>}<br/>
        
        <b>{name}</b> = default 
      </div>
    )
  },
};

export const renderSelectedVars = (
  rootElement,
  cssVars = [],
  lastTarget,
  groups,
  rawGroups,
  allVars,
  config,
  defaultValues
) => {
  const el = (
    <SharedActionHistory {...{previewComponents}}>
      <ThemeEditor
        {...{ config, groups, lastTarget, allVars, defaultValues }}
        selectedVars={cssVars}
        lastInspectTime={performance.now()}
      />
    </SharedActionHistory>
  );

  if (createRoot) {
    if (!root) {
      root = createRoot(rootElement);
    }
    root.render(el);
    return;
  }
  render(el, rootElement);
};
