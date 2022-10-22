import {useLocalStorage} from '../../hooks/useLocalStorage';
import React, {useContext, useEffect, useRef} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {ServerThemesListItem} from './ServerThemesListItem';

export const ServerThemesList = () => {
  const activeThemeRef = useRef();

  const {
    serverThemes,
    serverThemesLoading,
  } = useContext(ThemeEditorContext);

  const [
    serverThemesHeight,
    setServerThemesHeight
  ] = useLocalStorage('theme-server-theme-height-list', '140px');

  // useEffect(() => {
  //   if (serverThemesLoading) {
  //     return;
  //   }
  //   const timeout = window.setTimeout(() => {
  //     activeThemeRef.current?.scrollIntoView();
  //   }, 200);

  //   return () => {
  //     window.clearTimeout(timeout);
  //   };
  // }, [serverThemes]);

  if (serverThemesLoading) {
    return <div style={{height: serverThemesHeight}}>Loading server themes...</div>;
  }

  return <ul
    className={'server-theme-list'}
    onMouseUp={event => {
      setServerThemesHeight(event.target.closest('ul').style.height);
    }}
    style={{resize: 'vertical', height: serverThemesHeight}}
  >
    {Object.entries(serverThemes).map(([name, serverTheme]) =>
      <ServerThemesListItem key={name} {...{name, serverTheme, activeThemeRef}}/>
    )}
  </ul>;
};
