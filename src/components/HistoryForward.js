import {diffSummary} from '../functions/diffThemes';
import {THEME_ACTIONS} from '../hooks/useThemeEditor';
import {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

export function HistoryForward({future}) {
  const {
    dispatch,
    theme,
  } = useContext(ThemeEditorContext);

  return <button
    className={'history-button'}
    disabled={future.length === 0}
    title={future.length === 0 ? 'No future' : diffSummary(theme, future[0])}
    onClick={() => dispatch({type: THEME_ACTIONS.HISTORY_FORWARD})}
  >redo
  </button>;
}
