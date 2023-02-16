// This file is intended to contain all custom hooks that provide the app state.

import { getters } from "../functions/getters";
import { useLocalStorage, useResumableLocalStorage } from "../hooks/useLocalStorage";
import { allScreenOptions, simpleScreenOptions } from "../screenOptions";

export const use = {
  isSimpleSizes: () =>
    useResumableLocalStorage('responsive-simple-sizes', true),
  screenOptions: () =>
    [get.isSimpleSizes ? simpleScreenOptions : allScreenOptions],
  width: () =>
    useResumableLocalStorage('responsive-width', 360),
  height: () =>
    useResumableLocalStorage('responsive-height', 640),
  scales: () =>
    useResumableLocalStorage('responsive-scales', {}),
  uiArrangement: () =>
    useResumableLocalStorage('panel-rearrangements', {}),
  propertyFilter: () =>
    useResumableLocalStorage('property-filter', 'all'),
  propertySearch: () =>
    useResumableLocalStorage('property-search', ''),
  frameClickBehavior: () =>
    useLocalStorage('theme-editor-frame-click-behavior', 'any'),
  nativeColorPicker: () =>
    useLocalStorage('native-color-picker', true),
  includeDefaultPalette: () =>
    useLocalStorage('include-default-palette', false),
  fileName: () =>
    useResumableLocalStorage('theme-name', 'theme'),
  responsiveSticky: () =>
    useLocalStorage('responsive-on-load', true),
  annoyingPrefix: () =>
    useLocalStorage('annoying-prefix', ''),
  nameReplacements: () =>
    useLocalStorage('name-replacements', []),
  showCssProperties: () =>
    useLocalStorage('show-css-properties', false),
  showSourceLinks: () =>
    useLocalStorage('show-source-links', false),
  windowArrangments: () =>
    useLocalStorage('window-arrangments', {}),
  webpackHome: () =>
    useLocalStorage('webpack-home', ''),
} as const;

export const get = getters(use);
