import React, {useContext} from 'react';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';

export function HistoryBack() {
  const { dispatch, historyStack, historyOffset } = useContext( HistoryNavigateContext);
  const remainingLength = historyStack.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    onClick={() => dispatch({type: 'HISTORY_BACKWARD'})}
  >undo
  </button>;
}
