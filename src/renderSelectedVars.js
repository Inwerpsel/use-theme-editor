import {render} from 'react-dom';
import { ThemeEditor } from './ThemeEditor';

export const renderSelectedVars = (rootElement, cssVars = [], lastTarget, groups, rawGroups, allVars, config) => {
  render(
    <ThemeEditor
      config={ config }
      initialOpen={ false }
      selectedVars={ cssVars }
      groups={ groups }
      lastTarget={ lastTarget }
      allVars={ allVars }
    />,
    rootElement
  );
};
