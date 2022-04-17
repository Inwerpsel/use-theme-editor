import React from 'react';
import {render} from 'react-dom';
import {ThemeEditor} from './components/ThemeEditor';

export const renderSelectedVars = (rootElement, cssVars = [], lastTarget, groups, rawGroups, allVars, config) => {
  render(
    <ThemeEditor
      config={ config }
      selectedVars={ cssVars }
      groups={ groups }
      lastTarget={ lastTarget }
      allVars={ allVars }
    />,
    rootElement
  );
};
