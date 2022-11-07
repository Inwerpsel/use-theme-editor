import React from 'react';
import {render} from 'react-dom';
import { createRoot} from 'react-dom/client';
import {ThemeEditor} from './components/ThemeEditor';
import { SharedActionHistory } from './hooks/useResumableReducer';

let root;

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
    <SharedActionHistory>
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
