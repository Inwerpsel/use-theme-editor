import {useLocalStorage} from './useLocalStorage';
import {useHotkeys} from 'react-hotkeys-hook';
import {useEffect} from 'react';

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
    isResponsive, setResponsive,
  ] = useLocalStorage('p4-theme-responsive', false);
  useHotkeys('alt+v', () => {
    setResponsive(!isResponsive);
  }, [isResponsive]);
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
    if (!isResponsive || !frameRef?.current) {
      return;
    }
    const message = {type: 'theme-edit-alt-click', payload: {frameClickBehavior}};
    frameRef.current.contentWindow.postMessage(message, window.location.origin);

  }, [frameClickBehavior, frameRef.current, isResponsive]);
  const [
    useDefaultsPalette, setUseDefaultsPalette,
  ] = useLocalStorage('use-defaults-palette', false);
  const [
    nativeColorPicker, setNativeColorPicker,
  ] = useLocalStorage('native-color-picker', true);

  return {
    // ...useSetting({propertyFilter: 'all'}),
    propertyFilter, setPropertyFilter,
    propertySearch, setPropertySearch,
    fileName, setFileName,
    isResponsive, setResponsive,
    width, setWidth,
    height, setHeight,
    isSimpleSizes, setIsSimpleSizes,
    frameClickBehavior, setFrameClickBehavior,
    useDefaultsPalette, setUseDefaultsPalette,
    nativeColorPicker, setNativeColorPicker,
  };
}
