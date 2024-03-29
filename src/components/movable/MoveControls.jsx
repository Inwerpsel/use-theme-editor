import React, {useMemo, useContext} from 'react';
import { useResumableLocalStorage } from '../../hooks/useLocalStorage';
import { use } from '../../state';
import {Checkbox} from '../controls/Checkbox';
import { SelectControl } from '../controls/SelectControl';
import { TextControl } from '../controls/TextControl';
import {AreasContext} from './MovablePanels';

export function MoveControls() {
  const {
    uiState, setUiState,
    resetPanels,
    dragEnabled, setDragEnabled,
    showMovers, setShowMovers,
  } = useContext(AreasContext);

  const [windowArrangments, setWindowArrangments] = use.windowArrangments();

  const [inputName, setInputName] = useResumableLocalStorage('panel-arrangements-name', '');
  const isIdenticalToExisting = useMemo(() => {
    return JSON.stringify(uiState) === windowArrangments[inputName];
  }, [windowArrangments, uiState, inputName]);

  return (
    <div>
      <Checkbox controls={[showMovers, setShowMovers]}>Move elements</Checkbox>
      <Checkbox controls={[dragEnabled, setDragEnabled]}>
        Drag elements
      </Checkbox>
      {Object.keys(uiState.map).length > 0 && (
        <button onClick={() => confirm('Reset to default?') && resetPanels()}>
          reset
        </button>
      )}
      <div>
        <TextControl
          value={inputName}
          onChange={setInputName}
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
              [inputName]: JSON.stringify(uiState),
            });
          }}
        >
          Save
        </button>
        <SelectControl
          value={isIdenticalToExisting ? inputName : ''}
          options={[
            { label: '', value: '' },
            ...Object.entries(windowArrangments)
              // .filter(([name]) => !name.toLowerCase().includes('prod'))
              .map(([name]) => ({
                label: name,
                value: name,
              })),
          ]}
          onChange={(name) => {
            setInputName(name);
            if (name === '') {
              return;
            }
            setUiState(JSON.parse(windowArrangments[name]));
          }}
        />
      </div>
    </div>
  );
}
