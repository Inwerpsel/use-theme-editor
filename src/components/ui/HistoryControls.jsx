import React, { useContext } from 'react';
import {
  HistoryNavigateContext,
  clearHistory,
  historyBackFast,
  historyBackOne,
  historyForwardFast,
  historyForwardOne,
} from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { use } from '../../state';

function HistoryBack() {
  const { historyStack, historyOffset } = useContext(HistoryNavigateContext);
  const remainingLength = historyStack.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    onClick={historyBackOne}
  >←
  </button>;
}

function HistoryForward() {
  const { historyOffset } = useContext(HistoryNavigateContext);

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={historyForwardOne}
  >→
  </button>;
}

function HistoryBackFast() {
  const { historyStack, historyOffset } = useContext(HistoryNavigateContext);
  const remainingLength = historyStack.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    onClick={historyBackFast}
  >←!
  </button>;
}

function HistoryForwardFast() {
  const { historyOffset } = useContext(HistoryNavigateContext);

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={historyForwardFast}
  >!→
  </button>;
}

export function HistoryControls() { 
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
            confirm('Clear all history, keeping only current state?') && clearHistory();
          }}
        >
          Clear
        </button>
      </div>
    );
}