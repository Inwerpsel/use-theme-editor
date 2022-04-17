import {diffSummary} from '../functions/diffThemes';
import {THEME_ACTIONS} from '../hooks/useThemeEditor';
import React, {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

export function HistoryBack({history}) {
  const {
    dispatch,
    theme,
  } = useContext(ThemeEditorContext);

  return <button
    className={'history-button'}
    disabled={history.length === 0}
    title={history.length === 0 ? 'No history' : diffSummary(history[0], theme)}
    onClick={() => dispatch({type: THEME_ACTIONS.HISTORY_BACKWARD})}
  >undo
  </button>;
}
