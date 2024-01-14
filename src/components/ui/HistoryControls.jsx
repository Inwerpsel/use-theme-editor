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
  const { past, historyOffset } = useContext(HistoryNavigateContext);
  const remainingLength = past.length - historyOffset;
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
  const { past, historyOffset } = useContext(HistoryNavigateContext);
  const remainingLength = past.length - historyOffset;
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

function MiniTimeline() {
  const { past, historyOffset } = useContext(HistoryNavigateContext);

  const percentage = 100 - (100 * historyOffset / past.length);

  return <div style={{width: '100%', height: '2px', background: 'darkgrey'}}>
    <div style={{width: `${percentage}%`, height: '2px', background: 'yellow'}}></div>
  </div>
}

export function HistoryControls() { 
    const [visualize, setVissualize] = use.visualizeHistory();
    const [visualizeAlways, setVissualizeAlways] = use.visualizeHistoryAlways();

    return (
      <div>
        <MiniTimeline />
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