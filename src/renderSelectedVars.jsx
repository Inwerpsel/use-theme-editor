import React from 'react';
import { createRoot} from 'react-dom/client';
import {ThemeEditor} from './components/ThemeEditor';
import { SharedActionHistory } from './hooks/useResumableReducer';
import { previewComponents } from './previewComponents';

let root;

export const renderSelectedVars = (
  rootElement,
  allVars,
  defaultValues,
) => {
  const el = (
    <SharedActionHistory {...{ previewComponents }}>
      <ThemeEditor {...{ allVars, defaultValues }} />
    </SharedActionHistory>
  );

  if (!root) {
    root = createRoot(rootElement);
  }
  root.render(el);
};
