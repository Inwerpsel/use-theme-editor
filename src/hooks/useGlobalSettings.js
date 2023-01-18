// This file is the initial approach of managing application wide state.
// At first, this was all done with context, which worked well... until it
// didn't. This started causing quite a lot of overhead, especially in
// complex trees.
// I think most things can use custom hooks instead, that internally connect
// to a global store.
// Open questions: 
// - Avoid multiple separate reads and writes from local storage? Is it even slow?
// - Easier hot keys registering? Replace hotkeys dependency? It likely has scaling issues
import {useLocalStorage, useResumableLocalStorage} from './useLocalStorage';
import {useHotkeys} from 'react-hotkeys-hook';
import {useEffect} from 'react';

export function useGlobalSettings(frameRef) {
  const [
    fileName, setFileName,
  ] = useResumableLocalStorage('theme-name', 'theme');
  const [
    useDefaultsPalette, setUseDefaultsPalette,
  ] = useLocalStorage('use-defaults-palette', false);
  const [
    nativeColorPicker, setNativeColorPicker,
  ] = useLocalStorage('native-color-picker', true);

  const [
    responsiveSticky,
    setResponsiveSticky
  ] = useLocalStorage('responsive-on-load', true);

  const [annoyingPrefix, setAnnoyingPrefix] = useLocalStorage(
    'annoying-prefix',
    ''
  );
  const [nameReplacements, setNameReplacements] = useLocalStorage(
    'name-replacements',
    []
  );
  const [showCssProperties, setShowCssProperties] = useLocalStorage(
    'hide-css-properties',
    false
  );
  const [showSourceLinks, setShowSourceLinks] = useLocalStorage(
    'show-source-links',
    false
  );
  const [windowArrangments, setWindowArrangments] = useLocalStorage(
    'window-arrangements',
    {}
  );
  const [webpackHome, setWebpackHome] = useLocalStorage('webpack-home', '')

  return {
    // I preserved this line though useSetting code was removed. It would be very nice to define the options this terse.
    // However not having the setter symbol picked up by IDE was prohibitive. Perhaps there's a fix for that.
    // ...useSetting({propertyFilter: 'all'}),
    fileName, setFileName,
    useDefaultsPalette, setUseDefaultsPalette,
    nativeColorPicker, setNativeColorPicker,
    responsiveSticky, setResponsiveSticky,
    annoyingPrefix, setAnnoyingPrefix,
    showCssProperties, setShowCssProperties,
    nameReplacements, setNameReplacements,
    showSourceLinks, setShowSourceLinks,
    windowArrangments, setWindowArrangments,
    webpackHome, setWebpackHome,
  };
}
