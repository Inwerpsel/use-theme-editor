// This file is intended to contain all custom hooks that provide the app state.
// 
// TODO: Explore consequences of calling other hooks that use `useSyncExternalStore`
// under the hood. This would result in the hook potentially being called more than
// once for the same value on the same component.
// Does each additional invocation have a significantly higher cost than calling it once and
// passing on the value? Does this register 2 listeners for the same element, or
// is React smart about this?
import { getters } from "../functions/getters";
import { useLocalStorage, useResumableLocalStorage } from "../hooks/useLocalStorage";
import { allScreenOptions, simpleScreenOptions } from "../screenOptions";

export const use = {
  isSimpleSizes: () =>
    useResumableLocalStorage('responsive-simple-sizes', true),
  screenOptions: () =>
    [get.isSimpleSizes ? simpleScreenOptions : allScreenOptions],
  width: () => useResumableLocalStorage('responsive-width', 360),
  height: () => useResumableLocalStorage('responsive-height', 640),
  scales: () => useResumableLocalStorage('responsive-scales', {}),
  uiArrangement: () => useResumableLocalStorage('panel-rearrangements', {}),
  propertyFilter: () => useResumableLocalStorage('property-filter', 'all'),
  propertySearch: () => useResumableLocalStorage('property-search', ''),
  frameClickBehavior: () => useLocalStorage('theme-editor-frame-click-behavior', 'any'),
  nativeColorPicker: () => useLocalStorage('native-color-picker', true),
  includeDefaultPalette: () => useLocalStorage('include-default-palette', false),
} as const;

export const get = getters(use);
