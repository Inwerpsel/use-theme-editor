import { EasyAccessors, getters } from "../functions/getters";
import { createMagicObject, memo, memoAnon } from "../hooks/useGlobalMemo";
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
    () => useResumableLocalStorage('responsive-scales', {} as {[index: string]: string}),
  uiArrangement:
    () => useResumableLocalStorage('panel-rearrangements', {}),
  propertyFilter:
    () => useResumableLocalStorage('property-filter', 'all'),
  search:
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
    () => [memoAnon(get => get.width * get.height)],
  areaAnon: 
    // "memoAnon" is temporary name, probably just memo if I eliminate the other.
    // This should also work for non anonymous functions.
    // If there is no performance penalty to getting the function code as string,
    // it could replace the previous function.
    () => [memoAnon(get => get.width * get.height)],
  areaDoubled: 
    // Staggered memo.
    () => [memoAnon(get => get.areaAnon * 2)],
  // areaBroken: 
  //   // Just to demonstrate types are working inside the anonymous function.
  //   () => [memoAnon(get => get.area * get.fileName)],
  areaNomemo: 
    // What would actually make sense as this is not very expensive.
    () => [get.width * get.height],
} as const;

// Let's time this for now to show this doesn't take long even if we're creating
// signals that aren't yet used.
console.time('Getters and signals');

export const get = getters(use);

export const $ = signals(use);


// Quick fix to resolve dependency situation.
createMagicObject(use);

console.timeEnd('Getters and signals');
