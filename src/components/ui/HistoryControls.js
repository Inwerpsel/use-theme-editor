import React, { useContext, useState } from 'react';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { HistoryBack} from "./HistoryBack";
import { HistoryForward} from "./HistoryForward";
import { HistoryVisualization } from "./HistoryVisualization";

export function HistoryControls() { 
    const { dispatch } = useContext(HistoryNavigateContext);

    const [visualize, setVissualize] = useState(true);

    return (
      <div>
        <HistoryBack />
        <HistoryForward />
        <Checkbox controls={[visualize, setVissualize]}>Visualize</Checkbox>
        <button onClick={() => {
            dispatch({type: 'CLEAR_HISTORY'})
        }}>Clear</button>
        {visualize && <HistoryVisualization />}
      </div>
    );
}