import {useLocalStorage, useResumableLocalStorage} from './useLocalStorage';
import {useHotkeys} from 'react-hotkeys-hook';
import {useEffect} from 'react';

export function useGlobalSettings(frameRef) {
  const [
    propertyFilter, setPropertyFilter,
  ] = useResumableLocalStorage('property-filter', 'all');
  const [
    propertySearch, setPropertySearch,
  ] = useResumableLocalStorage('property-search', '');
  const [
    fileName, setFileName,
  ] = useResumableLocalStorage('theme-name', 'theme');
  const [
    frameClickBehavior, setFrameClickBehavior,
  ] = useLocalStorage('theme-editor-frame-click-behavior', 'any');
  useHotkeys('alt+a', () => {
    setFrameClickBehavior(value => value === 'alt' ? 'any' : 'alt');
  }, [frameClickBehavior]);
  useEffect(() => {
    if (!frameRef?.current) {
      return;
    }
    const message = {type: 'theme-edit-alt-click', payload: {frameClickBehavior}};
    frameRef.current.contentWindow.postMessage(message, window.location.origin);

  }, [frameClickBehavior, frameRef.current]);
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
    propertyFilter, setPropertyFilter,
    propertySearch, setPropertySearch,
    fileName, setFileName,
    frameClickBehavior, setFrameClickBehavior,
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
