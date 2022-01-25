import {useLocalStorage} from '../hooks/useLocalStorage';
import {diffSummary} from '../diffThemes';
import {THEME_ACTIONS} from '../hooks/useThemeEditor';
import {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

export const ServerThemesList = props => {
  const {
    serverThemes,
    deleteTheme,
    fileName,
    setFileName,
    activeThemeRef,
    modifiedServerVersion,
  } = props;

  const {
    theme: currentTheme,
    dispatch,
  } = useContext(ThemeEditorContext);

  const [
    serverThemesHeight,
    setServerThemesHeight
  ] = useLocalStorage('p4-theme-server-theme-height-list', '140px');

  return <ul
    className={'server-theme-list'}
    onMouseUp={event => {
      setServerThemesHeight(event.target.closest('ul').style.height);
    }}
    style={{resize: 'vertical', height: serverThemesHeight}}
  >
    {Object.entries(serverThemes).map(([name, serverTheme]) => <li
      key={name}
      ref={name === fileName ? activeThemeRef : null}
      title={diffSummary(serverTheme, currentTheme)}
      className={'server-theme ' + (fileName === name ? 'server-theme-current' : '')}
    >
      {name} {modifiedServerVersion && name === fileName && '(*)'}
      {name !== 'default' && <button
        style={{float: 'right'}}
        onClick={async () => {
          if (!confirm('Delete theme from server?')) {
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
    </li>)}
  </ul>;
};
