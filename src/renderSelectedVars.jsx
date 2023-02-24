import React from 'react';
import { createRoot} from 'react-dom/client';
import {ThemeEditor} from './components/ThemeEditor';
import { SharedActionHistory } from './hooks/useResumableReducer';
import { previewComponents } from './previewComponents';

let root, lastInspectedIndex = -1;

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
