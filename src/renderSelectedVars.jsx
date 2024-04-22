import React from 'react';
import { createRoot} from 'react-dom/client';
import {ThemeEditor, prevGroups} from './components/ThemeEditor';
import { SharedActionHistory } from './hooks/useResumableReducer';
import { previewComponents } from './previewComponents';

let root, lastInspectedIndex = -1;

export const INSPECTIONS = 'history-inspections';

let previnspections = getPrevinspections();

export function getPrevinspections() {
  return JSON.parse(localStorage.getItem(INSPECTIONS) || '[]');
}

export function resetInspections() {
  previnspections = [];
}

export const renderSelectedVars = (
  rootElement,
  lastTarget,
  groups,
  allVars,
  defaultValues,
  inspectedIndex,
  inspectionPath,
) => {
  const isNewInspection = inspectedIndex > lastInspectedIndex;
  if (isNewInspection) {
    lastInspectedIndex = inspectedIndex;
    if (!inspectionPath) {
      prevGroups[inspectedIndex] = groups;
      // Replayed inspection for history.
      return;
    }
    // Quick hack
    if (inspectionPath !== 'ignore') {
      previnspections[inspectedIndex] = inspectionPath;
      localStorage.setItem(INSPECTIONS, JSON.stringify(previnspections));
    }
  }
  // inspectedIndex = groups.length === 0 ? 0 : inspectedIndex;
  const el = (
    <SharedActionHistory {...{previewComponents}}>
      <ThemeEditor
        {...{ groups, lastTarget, allVars, defaultValues, inspectedIndex, isNewInspection }}
        lastInspectTime={performance.now()}
      />
    </SharedActionHistory>
  );

  if (!root) {
    root = createRoot(rootElement);
  }
  root.render(el);
};
