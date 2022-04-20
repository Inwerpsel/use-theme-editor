import React, {useContext} from 'react';
import {DispatchedElementContext} from './DispatchedElement';
import {SelectControl} from '@wordpress/components';
import {valuesAsLabels} from '../inspector/TypedControl';
import {AreasContext, refs} from './MovablePanels';

export function AreaSwitcher() {
  const {panelMap, movePanelTo} = useContext(AreasContext);
  const {areaId, elementId} = useContext(DispatchedElementContext);
  const currentArea = panelMap[elementId] || areaId;

  return <div
    className={'area-switcher'}
    style={{position: 'absolute'}}
  >
    <SelectControl
      style={{
        background: !panelMap[elementId] ? 'white' : 'lightyellow',
      }}
      value={currentArea}
      options={Object.keys(refs).map(valuesAsLabels).map(({value, label}) => ({
        value,
        label: value === areaId && value !== currentArea ? `${label} (default)` : label,
      }))}
      onChange={value => {
        movePanelTo(elementId, value === areaId ? null : value);
      }}
    />
    {!!panelMap[elementId] && <button
      onClick={() => {
        movePanelTo(elementId, null);
      }}
    >reset</button>}
  </div>;
}
