import React, {useMemo, useContext} from 'react';
import { useResumableLocalStorage } from '../../hooks/useLocalStorage';
import { use } from '../../state';
import {Checkbox} from '../controls/Checkbox';
import { SelectControl } from '../controls/SelectControl';
import { TextControl } from '../controls/TextControl';
import {AreasContext} from './MovablePanels';
import { Tutorial } from '../../_unstable/Tutorial';
import { MovableElementContext } from './MovableElement';
import { DragHandle } from './DragHandle';

export function MoveControls() {
  const {
    uiState, setUiState,
    resetPanels,
    dragEnabled, setDragEnabled,
    showMovers, setShowMovers,
    drawerOpen,
  } = useContext(AreasContext);

  const [windowArrangments, setWindowArrangments] = use.windowArrangments();

  const [inputName, setInputName] = useResumableLocalStorage('panel-arrangements-name', '');
  const isIdenticalToExisting = useMemo(() => {
    return JSON.stringify(uiState) === windowArrangments[inputName];
  }, [windowArrangments, uiState, inputName]);

  const supportsDrag = matchMedia('(pointer:fine)').matches;

  return (
    <div>
      <DragHandle/>
      <Tutorial el={MoveControls} tasks={[
        () => ['Enable dragging elements', useContext(MovableElementContext).hostAreaId === 'area-right' || dragEnabled],
        () => ['Drag this element into the right area', useContext(MovableElementContext).hostAreaId === 'area-right'],
        () => ['Close the drawer', !drawerOpen],
      ]}>Turn on "drag elements" to drag any element to any area. "Move elements" is very broken atm.</Tutorial>
      {supportsDrag && <Checkbox controls={[dragEnabled, setDragEnabled]}>
        Drag elements
      </Checkbox>}
      <Checkbox controls={[showMovers, setShowMovers]}>Move elements</Checkbox>
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

MoveControls.fName = 'MoveControls';