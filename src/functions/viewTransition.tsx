import { Checkbox } from "../components/controls/Checkbox";
import { useLocalStorage } from "../hooks/useLocalStorage";

const supports = !!document.startViewTransition;

let enableTransitions = localStorage.getItem('enableTransitions') !== 'false', setState = null;

export function ToggleViewTransitions() {
    const [on, setOn] = useLocalStorage('enableTransitions', enableTransitions);

    function toggle(on) {
        enableTransitions = on;
        setOn(on);
    }

    return <Checkbox controls={[on, toggle]}>View transitions</Checkbox>
}

export function toggleViewTransitions(on: boolean) {
    enableTransitions = on;
}

function actuallyDoTransition(changeDom) {
    document.startViewTransition(changeDom);
}

function performChangesDirectly(changeDom) {
    changeDom();
}

export const doTransition =
    supports
        ? (changeDom => enableTransitions ? actuallyDoTransition(changeDom) : performChangesDirectly(changeDom))
        : performChangesDirectly;
