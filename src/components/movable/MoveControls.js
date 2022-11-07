import React, {useMemo, useContext} from 'react';
import { useLocalStorage, useResumableLocalStorage } from '../../hooks/useLocalStorage';
import {Checkbox} from '../controls/Checkbox';
import { SelectControl } from '../controls/SelectControl';
import { ThemeEditorContext } from '../ThemeEditor';
import {AreasContext} from './MovablePanels';

export function MoveControls() {
  const {
    panelMap, setPanelMap,
    resetPanels,
    dragEnabled, setDragEnabled,
    showMovers, setShowMovers,
  } = useContext(AreasContext);

  const { 
    windowArrangments, setWindowArrangments,
  } = useContext(ThemeEditorContext);

  const [inputName, setInputName] = useResumableLocalStorage('panel-arrangements-name', '');
  const isIdenticalToExisting = useMemo(() => {
    return JSON.stringify(panelMap) === windowArrangments[inputName];
  }, [windowArrangments, panelMap, inputName]);

  return (
    <div>
      <Checkbox controls={[showMovers, setShowMovers]}>Move elements</Checkbox>
      <Checkbox controls={[dragEnabled, setDragEnabled]}>
        Drag elements
      </Checkbox>
      {Object.keys(panelMap).length > 0 && (
        <button onClick={() => confirm('Reset to default?') && resetPanels()}>
          reset
        </button>
      )}
      <div>
        <input
          type="text"
          value={inputName}
          onChange={({ target: { value } }) => setInputName(value)}
        />
        <button
          disabled={inputName.length === 0}
          onClick={() => {
            if (
              inputName in windowArrangments &&
              !confirm('Update arrangement?')
            ) {
              return;
            }
            if (inputName.length === 0) {
              return;
            }
            setWindowArrangments({
              ...windowArrangments,
              [inputName]: JSON.stringify(panelMap),
            });
          }}
        >
          Save
        </button>
        <SelectControl
          value={isIdenticalToExisting ? inputName : ''}
          options={[
            { label: '', value: '' },
            ...Object.entries(windowArrangments).filter(([name])=>!name.toLowerCase().includes('prod')).map(([name]) => ({
              label: name,
              value: name,
            })),
          ]}
          onChange={(name) => {
            setInputName(name);
            if (name === '') {
              return;
            }
            setPanelMap(JSON.parse(windowArrangments[name]));
          }}
        />
      </div>
    </div>
  );
}
