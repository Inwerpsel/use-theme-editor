import { getters } from "../functions/getters";
import { createMagicObject, memoAnon } from "../hooks/useGlobalMemo";
import { useLocalStorage, useResumableLocalStorage } from "../hooks/useLocalStorage";
import { allScreenOptions, simpleScreenOptions } from "../screenOptions";
import { signals } from "../functions/signals";

// TODO: Since each of these requires a string key as an argument,
// it could be more convenient to fabricate the object from a simpler config,
// rather than defining the full hook call each time.
// The downside of that is it makes the overall approach less simple in other ways.
// In the current form, you can easily move in any argumentless hook.
// Would be nice if TypeScript could enforce using the same string key
// in certain functions. Perhaps a linting rule is easier to achieve.
// TODO: How to order these things? In general, each piece of state is independent,
// and can potentially be combined with any other piece. Still, it's annoying
// to not have a rule of where to put things.
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
  prefersColorScheme:
    () => useResumableLocalStorage('prefersColorScheme', 'light' as 'light' | 'dark'),
  uiArrangement:
    () => useResumableLocalStorage('panel-rearrangements', {}),
  propertyFilter:
    () => useResumableLocalStorage('property-filter', 'all' as 'all' | 'colors'),
  search:
    () => useResumableLocalStorage('property-search', ''),
  filteredSelectors:
    () => [[]],
    // () => useResumableLocalStorage('class-filter', ['.btn-rounded', '.btn-lg'] as string[]),
  showRawValues:
    () => useResumableLocalStorage('displayRawValues', false),
  excludedRawValues:
    () => useResumableLocalStorage('excludedRawValues', ['initial', 'none'] as string[]),
  frameClickBehavior:
    () => useLocalStorage('theme-editor-frame-click-behavior', 'any' as 'any' | 'alt'),
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
console.timeEnd('Getters and signals');
