import React, {useContext} from 'react';
import {Checkbox} from '../controls/Checkbox';
import {AreasContext} from './MovablePanels';
import {ThemeEditorContext} from '../ThemeEditor';

export function MoveControls() {
  const {
    panelMap,
    resetPanels,
    showMovers, setShowMovers,
  } = useContext(AreasContext);

  const {
    dragEnabled, setDragEnabled,
  } = useContext(ThemeEditorContext);

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
