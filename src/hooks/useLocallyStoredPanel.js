import { useResumableLocalStorage } from "./useLocalStorage";

export function useLocallyStoredPanel() {
    return useResumableLocalStorage('panel-rearrangements', {})
}
