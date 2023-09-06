import React, { useContext, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { HistoryBack} from "./HistoryBack";
import { HistoryForward} from "./HistoryForward";
import { HistoryVisualization } from "./HistoryVisualization";
import { use } from '../../state';

export function HistoryControls() { 
    const { dispatch, historyOffset } = useContext(HistoryNavigateContext);

    const [visualize, setVissualize] = useLocalStorage('visualize-history', false);
    const [visualizeAlways, setVissualizeAlways] = use.visualizeHistoryAlways();

    const showHistory = visualize && (visualizeAlways || historyOffset !== 0);

    return (
      <div>
        <HistoryBack />
        <HistoryForward />
        <Checkbox controls={[visualize, setVissualize]}>Visualize</Checkbox>
        {visualize && <Checkbox title='Always or only when in a previous state' controls={[visualizeAlways, setVissualizeAlways]}>Always</Checkbox>}

        <button
          onClick={() => {
            confirm('Clear all history, keeping only current state?') && dispatch({ type: 'CLEAR_HISTORY' });
          }}
        >
          Clear
        </button>
        {showHistory && <HistoryVisualization />}
      </div>
    );
}