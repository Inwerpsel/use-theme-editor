import React, { useContext } from 'react';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { use } from '../../state';

function HistoryBack() {
  const { dispatch, historyStack, historyOffset } = useContext( HistoryNavigateContext);
  const remainingLength = historyStack.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    onClick={() => dispatch({type: 'HISTORY_BACKWARD'})}
  >←
  </button>;
}

function HistoryForward() {
  const { dispatch, historyStack, historyOffset } = useContext(
    HistoryNavigateContext
  );

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={() => dispatch({type: 'HISTORY_FORWARD'})}
  >→
  </button>;
}

function HistoryBackFast() {
  const { dispatch, historyStack, historyOffset } = useContext( HistoryNavigateContext);
  const remainingLength = historyStack.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    onClick={() => dispatch({type: 'HISTORY_BACKWARD_FAST'})}
  >←!
  </button>;
}

function HistoryForwardFast() {
  const { dispatch, historyStack, historyOffset } = useContext(
    HistoryNavigateContext
  );

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={() => dispatch({type: 'HISTORY_FORWARD_FAST'})}
  >!→
  </button>;
}

export function HistoryControls() { 
    const { dispatch } = useContext(HistoryNavigateContext);

    const [visualize, setVissualize] = use.visualizeHistory();
    const [visualizeAlways, setVissualizeAlways] = use.visualizeHistoryAlways();

    return (
      <div>
        <HistoryBackFast />
        <HistoryBack />
        <HistoryForward />
        <HistoryForwardFast />
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