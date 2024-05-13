import { ResizableFrame } from "../components/ResizableFrame";
import { RemoveAnnoyingPrefix } from "../components/inspector/RemoveAnnoyingPrefix";
import { MoveControls } from "../components/movable/MoveControls";
import { FrameScaleSlider } from "../components/ui/FrameScaleSlider";
import { FrameSizeSettings } from "../components/ui/FrameSizeSettings";
import { HistoryControls, LockStatus, MiniTimeline } from "../components/ui/HistoryControls";
import { HistoryStash } from "../components/ui/HistoryStash";
import { HistoryVisualization } from "../components/ui/HistoryVisualization";
import { Inspector } from "../components/ui/Inspector";
import { Palette } from "../components/ui/Palette";
import { ScreenSwitcher } from "../components/ui/ScreenSwitcher";
import { ServerThemesList } from "../components/ui/ServerThemesList";
import { ThemeEditorExtraOptions } from "../components/ui/ThemeEditorExtraOptions";

export let courses;

// Need to make this in a function to avoid circular deps apparently.
export function makeCourses() {
    courses = {
        basics: {
            name: 'basics',
            steps: [
                ResizableFrame,
                Inspector,
                ScreenSwitcher,
                FrameSizeSettings,
                RemoveAnnoyingPrefix,
                FrameScaleSlider,
            ],
        },
        history: {
            name: 'history',
            steps: [
                HistoryControls,
                MiniTimeline,
                HistoryVisualization,
                // Keep next one out because it's more confusing than helpful
                // HistoryStash,
                LockStatus,
            ],
        },
        movable: {
            name: 'movable',
            steps: [
                MoveControls,
            ],
        },
        // inspection: { 
        //     name: 'inspection', 
        //     steps: [
        //         ThemeEditorExtraOptions,
        //     ],
        // },
        changes: {
            name: 'changes',
            steps: [
                Palette,
            ],
        },
        themes: {
            name: 'themes',
            steps: [
                ServerThemesList,
            ],
        },
    };
}

