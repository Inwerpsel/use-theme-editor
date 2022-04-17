import {diffSummary} from '../functions/diffThemes';
import {THEME_ACTIONS} from '../hooks/useThemeEditor';
import React, {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

export const ServerThemesListItem = props => {
  const {
    name,
    serverTheme,
    activeThemeRef,
  } = props;

  const {
    theme: currentTheme,
    dispatch,
    fileName,
    setFileName,
    modifiedServerVersion,
    deleteTheme,
  } = useContext(ThemeEditorContext);

  return <li
    key={name}
    ref={name === fileName ? activeThemeRef : null}
    title={diffSummary(serverTheme, currentTheme)}
    className={'server-theme ' + (fileName === name ? 'server-theme-current' : '')}
  >
    {name} {modifiedServerVersion && name === fileName && '(*)'}

    {name !== 'default' && <button
      style={{float: 'right'}}
      onClick={async () => {
        if (!confirm(`Remove theme "${name}" from server?`)) {
          return;
        }
        deleteTheme(name);
      }}
    >Delete</button>}

    <button
      style={{float: 'right'}}
      onClick={() => {
        if (modifiedServerVersion && !confirm('You have some local changes that are not on the server. Cancel if you want to save changes.')) {
          return;
        }
        setFileName(name);
        dispatch({type: THEME_ACTIONS.LOAD_THEME, payload: {theme: serverTheme}});
      }}
    >Switch
    </button>
    {Object.keys(serverTheme).length > 0 &&
      <span style={{float: 'right'}}>
        ({Object.keys(serverTheme).length})
      </span>
    }
  </li>;
};
