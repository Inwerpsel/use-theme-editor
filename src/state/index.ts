import { getters } from "../functions/getters";
import { mem } from "../hooks/mem";
import { signals } from "../functions/signals";
import { useLocalStorage, useResumableLocalStorage } from "../hooks/useLocalStorage";
import { allScreenOptions, simpleScreenOptions } from "../screenOptions";
import { useResumableState } from "../hooks/useResumableReducer";
import { useServerThemes } from "../hooks/useServerThemes";
import { ROOT_SCOPE, useThemeEditor } from "../hooks/useThemeEditor";
import { byHexValue, extractColorUsages } from "../components/properties/ColorControl";
import { getDefaults } from "../initializeThemeEditor";

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
    // Resumable to make restoring UI state and exact scroll positions easier.
    () => useResumableLocalStorage('isSimpleSizes', true),
  screenOptions:
    () => [get.isSimpleSizes ? simpleScreenOptions : allScreenOptions],
  width:
    () => useResumableLocalStorage('width', 1024),
  height:
    () => useResumableLocalStorage('height', 768),
  scales:
    () => useResumableLocalStorage('scales', {} as {[index: string]: string}),
  prefersColorScheme:
    () => useResumableLocalStorage('prefersColorScheme', 'light' as 'light' | 'dark'),
  uiLayout:
    () => useResumableLocalStorage('uiLayout', {}),
  propertyFilter:
    () => useResumableLocalStorage('propertyFilter', 'all' as 'all' | 'colors'),
  search:
    () => useResumableLocalStorage('search', ''),
  filteredSelectors:
    () => [[]],
    // () => useResumableLocalStorage('filteredSelectors', ['.btn-rounded', '.btn-lg'] as string[]),
  showRawValues:
    () => useResumableLocalStorage('showRawValues', false),
  excludedRawValues:
    () => useResumableLocalStorage('excludedRawValues', ['initial', 'none'] as string[]),
  frameClickBehavior:
    () => useLocalStorage('frameClickBehavior', 'any' as 'any' | 'alt'),
  nativeColorPicker:
    () => useLocalStorage('nativeColorPicker', true),
  includeDefaultPalette:
    () => useLocalStorage('includeDefaultPalette', false),
  colorUsages:
    () => [mem(
      get => extractColorUsages(
        get.themeEditor.scopes[ROOT_SCOPE], !get.includeDefaultPalette ? {} : getDefaults()).sort(byHexValue)
    )],
  fileName:
    () => useResumableLocalStorage('fileName', 'theme'),
  annoyingPrefix:
    () => useLocalStorage('annoyingPrefix', ''),
  nameReplacements:
    () => useLocalStorage(
      'nameReplacements',
      [] as { id: string, from: string, to: string, order: number, active: boolean }[]
    ),
  showCssProperties:
    () => useLocalStorage('showCssProperties', true),
  linkCssProperties:
    () => useLocalStorage('linkCssProperties', false),
  showSourceLinks:
    () => useLocalStorage('showSourceLinks', false),
  windowArrangments:
    () => useLocalStorage('windowArrangments', {}),
  webpackHome:
    () => useLocalStorage('webpackHome', ''),
  visualizeHistory: 
    () => useLocalStorage('visualizeHistory', false),
  visualizeHistoryAlways: 
    () => useLocalStorage('visualizeHistoryAlways', true),
  svgDarkBg:
    () => useLocalStorage('svgDarkBg', false),
  inspectedIndex:
    () => useResumableState('inspected-index', -1),
  serverThemes:
    () => useServerThemes(),
  existsOnServer:
    () => [get.fileName in get.serverThemes],
  localThemeJson: 
    // I preserved the old code even though using JSON.stringify here doesn't make much sense.
    () => [mem(get => JSON.stringify(get.themeEditor.scopes))],
  remoteThemeJson: 
    () => [mem(get => JSON.stringify(get.serverThemes[get.fileName]?.scopes))],
  modifiedServerVersion:
    () => [mem(get => {
      const isSame = get.localThemeJson !== get.remoteThemeJson;
      return get.existsOnServer && isSame;
    })],
  themeEditor:
    () => useThemeEditor(),
  

  // 
  // State below this is only used in a demo element.
  //
  area: 
    () => [mem(get => get.width * get.height)],
  areaDoubled: 
    // Staggered memo.
    () => [mem(get => get.area * 2)],
  // areaBroken: 
  //   // Just to demonstrate types are working inside the anonymous function.
  //   () => [mem(get => get.area * get.fileName)],
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
