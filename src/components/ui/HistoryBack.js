import React, {useContext} from 'react';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';

export function HistoryBack() {
  const { dispatch, historyStack, historyOffset } = useContext( HistoryNavigateContext);
  const noHistory = historyStack.length - historyOffset < 1;
  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : `${historyStack.length - historyOffset}`}
    onClick={() => dispatch({type: 'HISTORY_BACKWARD'})}
  >undo
  </button>;
}
