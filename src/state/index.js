// This file is intended to contain all custom hooks that provide the app state.
// 
// TODO: Explore consequences of calling other hooks that use `useSyncExternalStore`
// under the hood. This would result in the hook potentially being called more than
// once for the same value on the same component.
// Does each additional invocation have a significantly higher cost than calling it once and
// passing on the value? Does this register 2 listeners for the same element, or
// is React smart about this?
import { useResumableLocalStorage } from "../hooks/useLocalStorage";
import { allScreenOptions, simpleScreenOptions } from "../screenOptions";

export function useIsSimpleSizes() {
    return useResumableLocalStorage('responsive-simple-sizes', true);
}

export function useScreenOptions() {
    const [isSimple] = useIsSimpleSizes();

    return isSimple ? simpleScreenOptions : allScreenOptions;
}

export function useWidth() {
    return useResumableLocalStorage('responsive-width', 360);
}

export function useHeight() {
    return useResumableLocalStorage('responsive-height', 640);
}

export function useScales() {
    return useResumableLocalStorage('responsive-scales', {});
}

export function useLocallyStoredPanel() {
    return useResumableLocalStorage('panel-rearrangements', {})
}
