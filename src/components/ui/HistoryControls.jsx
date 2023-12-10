import React, { useContext } from 'react';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { HistoryBack} from "./HistoryBack";
import { HistoryForward} from "./HistoryForward";
import { use } from '../../state';

export function HistoryControls() { 
    const { dispatch } = useContext(HistoryNavigateContext);

    const [visualize, setVissualize] = use.visualizeHistory();
    const [visualizeAlways, setVissualizeAlways] = use.visualizeHistoryAlways();

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
      </div>
    );
}