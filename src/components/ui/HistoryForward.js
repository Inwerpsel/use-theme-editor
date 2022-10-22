import {diffSummary} from '../../functions/diffThemes';
import {ACTIONS} from '../../hooks/useThemeEditor';
import React, {useContext} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';

export function HistoryForward({future}) {
  const {
    dispatch,
  } = useContext(ThemeEditorContext);

  return <button
    className={'history-button'}
    disabled={future.length === 0}
    title={future.length === 0 ? 'No future' : `${future.length}`}
    onClick={() => dispatch({type: ACTIONS.historyForward})}
  >redo
  </button>;
}
