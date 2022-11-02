import React, {useContext} from 'react';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';

export function HistoryForward() {
  const { dispatch, historyStack, historyOffset } = useContext(
    HistoryNavigateContext
  );

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={() => dispatch({type: 'HISTORY_FORWARD'})}
  >redo
  </button>;
}
