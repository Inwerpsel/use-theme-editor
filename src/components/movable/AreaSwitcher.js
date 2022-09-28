import React, {useContext} from 'react';
import {DispatchedElementContext} from './DispatchedElement';
import {SelectControl} from '@wordpress/components';
import {AreasContext} from './MovablePanels';

export function AreaSwitcher() {
  const { movePanelTo, areaRefs } = useContext(AreasContext);
  const { homeAreaId, elementId, hostAreaId: currentArea } = useContext(DispatchedElementContext);

  return <div
    className={'area-switcher'}
    style={{position: 'absolute'}}
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
    {!currentArea && <button
      onClick={() => {
        movePanelTo(elementId, null);
      }}
    >reset</button>}
  </div>;
}
