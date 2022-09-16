import React, {useContext} from 'react';
import {Checkbox} from '../controls/Checkbox';
import {AreasContext} from './MovablePanels';

export function MoveControls() {
  const {
    panelMap,
    resetPanels,
    dragEnabled, setDragEnabled,
    showMovers, setShowMovers,
  } = useContext(AreasContext);

  return <div>
    <Checkbox controls={[showMovers, setShowMovers]}>
      Move elements
    </Checkbox>
    <Checkbox controls={[dragEnabled, setDragEnabled]}>
      Drag elements
    </Checkbox>
    {Object.keys(panelMap).length > 0 && <button onClick={resetPanels}>reset</button>}
  </div>;
}
