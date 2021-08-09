import {render} from 'react-dom';
import { VarPicker } from './VarPicker';

export const renderSelectedVars = (rootElement, cssVars = [], lastTarget, groups, rawGroups, allVars, config) => {
  render(
    <VarPicker
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
