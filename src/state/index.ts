import { EasyAccessors, getters } from "../functions/getters";
import { createMagicObject, useGlobalMemo, useGlobalMemoAnon } from "../hooks/useGlobalMemo";
import { useLocalStorage, useResumableLocalStorage } from "../hooks/useLocalStorage";
import { allScreenOptions, simpleScreenOptions } from "../screenOptions";
import { signals } from "../functions/signals";

export const use = {
  isSimpleSizes:
    () => useResumableLocalStorage('responsive-simple-sizes', true),
  screenOptions:
    () => [get.isSimpleSizes ? simpleScreenOptions : allScreenOptions],
  width:
    () => useResumableLocalStorage('responsive-width', 360),
  height:
    () => useResumableLocalStorage('responsive-height', 640),
  scales:
    // Even though scales are a number, the input that manages it returns a string,
    // and the end use is also as a string.
    // Double converting just to get the type right goes a bit too far.
    () => useResumableLocalStorage('responsive-scales', {} as {[index: string]: string}),
  uiArrangement:
    () => useResumableLocalStorage('panel-rearrangements', {}),
  propertyFilter:
    () => useResumableLocalStorage('property-filter', 'all'),
  propertySearch:
    () => useResumableLocalStorage('property-search', ''),
  frameClickBehavior:
    () => useLocalStorage('theme-editor-frame-click-behavior', 'any'),
  nativeColorPicker:
    () => useLocalStorage('native-color-picker', true),
  includeDefaultPalette:
    () => useLocalStorage('include-default-palette', false),
  fileName:
    () => useResumableLocalStorage('theme-name', 'theme'),
  responsiveSticky:
    () => useLocalStorage('responsive-on-load', true),
  annoyingPrefix:
    () => useLocalStorage('annoying-prefix', ''),
  nameReplacements:
    () => useLocalStorage(
      'name-replacements',
      [] as { id: string, from: string, to: string, order: number, active: boolean }[]
    ),
  showCssProperties:
    () => useLocalStorage('show-css-properties', false),
  linkCssProperties:
    () => useLocalStorage('link-css-properties', true),
  showSourceLinks:
    () => useLocalStorage('show-source-links', false),
  windowArrangments:
    () => useLocalStorage('window-arrangments', {}),
  webpackHome:
    () => useLocalStorage('webpack-home', ''),
  // 
  // State below this is only used in a demo element.
  //
  area: 
    () => [useGlobalMemo(calculateArea)],
  areaAnon: 
    () => [useGlobalMemoAnon(get => get.width * get.height )],
  areaDoubled: 
    // Staggered memo.
    () => [useGlobalMemoAnon(get => get.area * 2)],
  areaAnonBroken: 
    // Just to demonstrate types are working for the anonymous function.
    () => [useGlobalMemoAnon(get => get.area * get.annoyingPrefix)],
  areaNomemo: 
    // What would actually make sense as this is not very expensive.
    () => [get.width * get.height],
} as const;


function calculateArea(get: EasyAccessors) {
  return get.width * get.height;
}

export const get = getters(use);

export const $ = signals(use);

// Quick fix to resolve dependency situation.
createMagicObject(use);