import {useLocalStorage} from '../hooks/useLocalStorage';
import {useContext, useEffect, useRef} from 'react';
import {ThemeEditorContext} from './ThemeEditor';
import {ServerThemesListItem} from './ServerThemesListItem';

export const ServerThemesList = props => {
  const activeThemeRef = useRef();

  const {
    serverThemes,
  } = useContext(ThemeEditorContext);

  const [
    serverThemesHeight,
    setServerThemesHeight
  ] = useLocalStorage('p4-theme-server-theme-height-list', '140px');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      activeThemeRef.current?.scrollIntoView();
    }, 200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [serverThemes])

  return <ul
    className={'server-theme-list'}
    onMouseUp={event => {
      setServerThemesHeight(event.target.closest('ul').style.height);
    }}
    style={{resize: 'vertical', height: serverThemesHeight}}
  >
    {Object.entries(serverThemes).map(([name, serverTheme]) =>
      <ServerThemesListItem {...{name, serverTheme, activeThemeRef}}/>
    )}
  </ul>;
};
