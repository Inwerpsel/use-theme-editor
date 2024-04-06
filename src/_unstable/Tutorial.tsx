import { useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { courses } from "./courses";
import { MovableElementContext } from "../components/movable/MovableElement";
import { AreasContext } from "../components/movable/MovablePanels";

let activeCourse;
function startTutorial() {
    activeCourse = 'basics';
    notifyAll();
}

export function StartTutorial() {
    const active = useActiveTutorialElement();
    if (active) return null;

    return <button onClick={startTutorial}>Start tutorial</button>
}

let activeStepIndex = 0;
// let activeStepEl = activeCourse.steps[activeStepIndex];

function openDrawerIfNeeded() {
    lastEl = null;
    setTimeout(() => {
        console.log(lastEl);
        if (lastEl === null) {
            openDrawer(true);
        }
    }, 100)
}

function nextStep(event) {
    if (activeStepIndex >= courses[activeCourse].steps.length - 1) {
        const names = [...Object.keys(courses)];
        const prevIndex = names.indexOf(activeCourse);
        activeCourse = names[prevIndex + 1];
        activeStepIndex = 0;
    } else {
        activeStepIndex++;
    }
    if (!activeCourse) {
        alert('Congratulations, you finished the tutorial!');
        return;
    }

    notifyAll();
    // Ensure we don't trigger anything else when changing step.
    event.stopPropagation();
    event.preventDefault();
    openDrawerIfNeeded();
}

function NextButton() {
    return <button onClick={nextStep}>Next</button>
}
function prevStep(event) {
    if (activeStepIndex === 0) {
        const names = [...Object.keys(courses)];
        const prevIndex = names.indexOf(activeCourse);
        activeCourse = names[prevIndex - 1];
        activeStepIndex = courses[activeCourse].steps.length - 1;
    } else {
        activeStepIndex--;
    }
    if (!activeCourse) {
        alert('Congrats, you finished all courses');
        return;
    }
    notifyAll();

    // Ensure we don't trigger anything else when changing step.
    event.stopPropagation();
    event.preventDefault();
    openDrawerIfNeeded();
}

function PrevButton() {
    if (activeCourse === 'basics' && activeStepIndex === 0) {
        return null;
    }
    return <button onClick={prevStep}>Previous</button>
}

const notifies = new Set();
function notifyAll() {
    for (const fn of notifies) {
        fn();
    }
}
function addNotify(notify) {
    notifies.add(notify);
    return () => {
        notifies.delete(notify);
    }
}
function getSnapshot() {
    if (!activeCourse) return null;
    return courses[activeCourse].steps[activeStepIndex];
}

function useActiveTutorialElement() {
    return useSyncExternalStore(addNotify, getSnapshot);
}

let lastEl = null;
let openDrawer;

export function Tutorial({ el, children }) {
    const {setDrawerOpen} = useContext(AreasContext);
    openDrawer = setDrawerOpen;

    const ref = useRef();
    const isActive = el === useActiveTutorialElement();
    useEffect(() => {
        if (isActive) lastEl = el;
        ref.current?.scrollIntoView({behavior: 'smooth'});
    }, [isActive]);

    if (!isActive) {
        return null;
    }

    return (
        <div
        ref={ref}
        className="tutorial-content"
        style={{
            border: '4px solid purple',
            background: 'white',
            borderRadius: '7px',
            padding: '4px',
            position: 'absolute',
            // top: '100%',
        }}
        >
        {children}
        <PrevButton />
        <NextButton />
        <span
            style={{
            float: 'right',
            fontStyle: 'italic',
            border: '1px solid gray',
            }}
        >
            {activeCourse} {activeStepIndex + 1}/{courses[activeCourse].steps.length}
        </span>
        </div>
    );
}