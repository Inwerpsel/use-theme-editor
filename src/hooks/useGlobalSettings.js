import {useLocalStorage} from './useLocalStorage';
import {useHotkeys} from 'react-hotkeys-hook';
import {useEffect, useState} from 'react';

export function useGlobalSettings(frameRef) {
  const [
    propertyFilter, setPropertyFilter,
  ] = useLocalStorage('property-filter', 'all');
  const [
    propertySearch, setPropertySearch,
  ] = useLocalStorage('property-search', '');
  const [
    fileName, setFileName,
  ] = useLocalStorage('p4-theme-name', 'theme');
  const [
    width, setWidth,
  ] = useLocalStorage('responsive-width', 360);
  const [
    height, setHeight,
  ] = useLocalStorage('responsive-height', 640);
  const [
    isSimpleSizes, setIsSimpleSizes,
  ] = useLocalStorage('responsive-simple-sizes', true);
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
  ] = useLocalStorage('responsive-on-load', false);

  const [
    scales,
    setScales,
  ] = useLocalStorage('responsive-scales', {});
  const scale = scales[`${width}x${height}`] || 1;

  const [dragEnabled, setDragEnabled] = useState(false);

  return {
    // I preserved this line though useSetting was removed. It would be very nice to define the options this terse,
    // however
    // ...useSetting({propertyFilter: 'all'}),
    propertyFilter, setPropertyFilter,
    propertySearch, setPropertySearch,
    fileName, setFileName,
    width, setWidth,
    height, setHeight,
    isSimpleSizes, setIsSimpleSizes,
    frameClickBehavior, setFrameClickBehavior,
    useDefaultsPalette, setUseDefaultsPalette,
    nativeColorPicker, setNativeColorPicker,
    responsiveSticky, setResponsiveSticky,
    scales, setScales,
    scale,
    dragEnabled, setDragEnabled,
  };
}
