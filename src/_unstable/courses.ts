import { ResizableFrame } from "../components/ResizableFrame";
import { RemoveAnnoyingPrefix } from "../components/inspector/RemoveAnnoyingPrefix";
import { MoveControls } from "../components/movable/MoveControls";
import { FrameScaleSlider } from "../components/ui/FrameScaleSlider";
import { FrameSizeSettings } from "../components/ui/FrameSizeSettings";
import { HistoryControls, ActivePins, MiniTimeline } from "../components/ui/HistoryControls";
import { HistoryStash } from "../components/ui/HistoryStash";
import { HistoryVisualization } from "../components/ui/HistoryVisualization";
import { Inspector } from "../components/ui/Inspector";
import { Palette } from "../components/ui/Palette";
import { ScreenSwitcher } from "../components/ui/ScreenSwitcher";
import { ServerThemesList } from "../components/ui/ServerThemesList";
import { CursorBehavior } from "../components/ui/ThemeEditorExtraOptions";
import { StartTutorial } from "./Tutorial";

export let courses;

// Need to make this in a function to avoid circular deps apparently.
export function makeCourses() {
    courses = {
        prep: {
            name: 'prep',
            steps: [
                StartTutorial
            ],
        },
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
                ActivePins,
                HistoryStash,
            ],
        },
        // movable: {
        //     name: 'movable',
        //     steps: [
        //         MoveControls,
        //     ],
        // },
        inspection: { 
            name: 'inspection', 
            steps: [
                CursorBehavior,
            ],
        },
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

