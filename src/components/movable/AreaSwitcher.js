import React, {useContext} from 'react';
import {DispatchedElementContext} from './DispatchedElement';
import {SelectControl} from '@wordpress/components';
import {valuesAsLabels} from '../inspector/TypedControl';
import {AreasContext} from './MovablePanels';

export function AreaSwitcher() {
  const {panelMap, movePanelTo, areaRefs} = useContext(AreasContext);
  const {areaId, elementId} = useContext(DispatchedElementContext);
  const [currentArea] = panelMap[elementId] || [areaId];

  return <div
    className={'area-switcher'}
    style={{position: 'absolute'}}
  >
    <SelectControl
      style={{
        background: !currentArea ? 'lightyellow' : 'white',
      }}
      value={currentArea}
      options={Object.keys(areaRefs.current).map(valuesAsLabels).map(({value, label}) => ({
        value,
        label: value === areaId && value !== currentArea ? `${label} (default)` : label,
      }))}
      onChange={value => {
        movePanelTo(elementId, value === areaId ? null : value);
      }}
    />
    {!currentArea && <button
      onClick={() => {
        movePanelTo(elementId, null);
      }}
    >reset</button>}
  </div>;
}
