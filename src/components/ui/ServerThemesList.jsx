import {useLocalStorage} from '../../hooks/useLocalStorage';
import React, {Fragment, useContext, useEffect, useRef} from 'react';
import {ServerThemesListItem} from './ServerThemesListItem';
import { Tutorial } from '../../_unstable/Tutorial';
import { use } from '../../state';

export const ServerThemesList = () => {
  const activeThemeRef = useRef();

  const [serverThemes ,{
    serverThemesLoading,
    deleteTheme,
  }] = use.serverThemes();

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

  return <Fragment><ul
    className={'server-theme-list'}
    onMouseUp={event => {
      setServerThemesHeight(event.target.closest('ul').style.height);
    }}
    style={{resize: 'vertical', height: serverThemesHeight}}
  >
    {Object.entries(serverThemes).map(([name, serverTheme]) =>
      <ServerThemesListItem key={name} {...{name, serverTheme, activeThemeRef, deleteTheme}}/>
    )}
  </ul><Tutorial el={ServerThemesList}>Here are all your saved themes.</Tutorial></Fragment>;
};
