import { useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { courses } from "./courses";
import { MovableElementContext } from "../components/movable/MovableElement";
import { AreasContext } from "../components/movable/MovablePanels";
import { EasyAccessors } from "../functions/getters";
import { get } from "../state";
import * as React from "react";

let activeCourse;

function forceTutorialState() {
    // idk
}

function startTutorial() {
    forceTutorialState();
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
    }

    notifyAll();
    // Ensure we don't trigger anything else when changing step.
    event.stopPropagation();
    event.preventDefault();
    activeCourse && openDrawerIfNeeded();
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

type Task = (get: EasyAccessors) => [label: string, isDone: boolean];

function CheckTask({label, done}: {label: string, done: boolean}) {

    return <li data-done={done}>
        {label}
    </li>
}

function checkTasks(tasks: Task[]): [boolean, [string, boolean][]] {
    const data = [] as [string, boolean][];
    let doneAll = true;
    for (const fn of tasks) {
        const [label, done] = fn(get);
        data.push([label, done]);
        if (doneAll) doneAll = done;
    }
    return [doneAll, data];
}

export function Tutorial({ el, children, tasks = [] }: {el: any, children: any, tasks: Task[]}) {
    const [doneAll, checkedTasks] = checkTasks(tasks);
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
          zIndex: 10,
          // top: '100%',
        }}
      >
        <span
          style={{
            float: 'right',
            fontStyle: 'italic',
            border: '1px solid gray',
          }}
        >
          {activeCourse} {activeStepIndex + 1}/
          {courses[activeCourse].steps.length}
        </span>
        {children}
        <ul>
            {checkedTasks.map(([label, done]) => <CheckTask {...{label, done}} />)}
        </ul>
        <PrevButton />
        <button disabled={!doneAll} onClick={nextStep}>Next</button>
      </div>
    );
}

StartTutorial.fName = 'StartTutorial';