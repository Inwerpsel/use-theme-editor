import React, {useContext} from 'react';
import { SelectControl } from '../controls/SelectControl';
import {AreasContext} from './MovablePanels';

export function AreaSwitcher(props) {
  const { movePanelTo, areaRefs } = useContext(AreasContext);
  const { homeAreaId, elementId, hostAreaId: currentArea } = props;

  return <div
    className={'area-switcher'}
    style={{display: 'flex', position: 'absolute'}}
  >
    <SelectControl
      style={{
        background: !currentArea ? 'lightyellow' : 'white',
      }}
      value={currentArea}
      options={Object.keys(areaRefs.current).map((value) => ({
        value,
        label: value === homeAreaId && value !== currentArea ? `${value} (default)` : value,
      }))}
      onChange={value => {
        movePanelTo(elementId, value);
      }}
    />
 </div>;
}
