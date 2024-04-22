import {diffSummary} from '../../functions/diffThemes';
import {ACTIONS, ROOT_SCOPE, editTheme} from '../../hooks/useThemeEditor';
import React from 'react';
import { get, use } from '../../state';

export const ServerThemesListItem = props => {
  const {
    name,
    serverTheme,
    activeThemeRef,
    deleteTheme,
  } = props;
  const {modifiedServerVersion} = get;

  const [fileName, setFileName] = use.fileName();

  const dispatch = editTheme();
  // const currentTheme = scopes[ROOT_SCOPE];
  const isCurrent = fileName === name;

  return <li
    key={name}
    ref={isCurrent ? activeThemeRef : null}
    // title={diffSummary(serverTheme, currentTheme)}
    className={'server-theme ' + ( isCurrent ? 'server-theme-current' : '')}
  >
    {name} {isCurrent && modifiedServerVersion && '(*)'}

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
        !isCurrent && setFileName(name);
        dispatch({type: ACTIONS.loadTheme, payload: {theme: serverTheme}});
      }}
    >{isCurrent ? 'Reset' : 'Switch'}
    </button>
    
    {Object.keys(serverTheme).length > 0 &&
      <span style={{float: 'right'}}>
        ({Object.keys(serverTheme).length})
      </span>
    }
  </li>;
};
