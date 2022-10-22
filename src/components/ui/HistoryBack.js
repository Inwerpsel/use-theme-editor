import {diffSummary} from '../../functions/diffThemes';
import {ACTIONS} from '../../hooks/useThemeEditor';
import React, {useContext} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';

export function HistoryBack({history}) {
  const {
    dispatch,
  } = useContext(ThemeEditorContext);

  return <button
    className={'history-button'}
    disabled={history.length === 0}
    title={history.length === 0 ? 'No history' : `${history.length}`}
    onClick={() => dispatch({type: ACTIONS.historyBackward})}
  >undo
  </button>;
}
