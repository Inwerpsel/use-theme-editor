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