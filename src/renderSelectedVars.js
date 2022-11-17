import React from 'react';
import {render} from 'react-dom';
import { createRoot} from 'react-dom/client';
import {ThemeEditor} from './components/ThemeEditor';
import { SharedActionHistory } from './hooks/useResumableReducer';

let root;
const size = 18;

export const previewComponents = {
  THEME_EDITOR: {
    set: ({ payload: { scope, name, value } }) => (
      <div>
        {scope && <pre className='monospace-code'>{scope}</pre>}<br/>
        <b>{name}</b> = 
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
        {value}
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
  lastTarget,
  groups,
  allVars,
  config,
  defaultValues,
  inspectedIndex,
) => {
  const el = (
    <SharedActionHistory {...{previewComponents}}>
      <ThemeEditor
        {...{ config, groups, lastTarget, allVars, defaultValues, inspectedIndex }}
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
