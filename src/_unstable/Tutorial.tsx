import { useContext, useEffect, useRef, useSyncExternalStore, Fragment } from "react";
import { courses } from "./courses";
import { AreasContext } from "../components/movable/MovablePanels";
import { EasyAccessors } from "../functions/getters";
import { get } from "../state";
import * as React from "react";

let activeCourse;

function startTutorial() {
    activeCourse = 'prep';
    notifyAll();
}

function exitTutorial() {
    activeCourse = null;
    activeStepIndex = 0;
    notifyAll();
}

// Todo: check which page user is on and list preferred tutorial pages.
const intro = (
  <Tutorial el={StartTutorial}>
    <div style={{minWidth: '600px'}}></div>
    <h1>Preparation</h1>
    <h2>Checklist</h2>
    <ul>
      <li>
        <b>Use a large screen. </b>
        On smaller screens you will likely have to remove some UI elements from the screen.
      </li>
      {/* <li>
        <b>Switch to one of the preset layouts (TODO)</b>
      </li> */}
      <li>
        <b>Mouse is required for some interactions</b>. Other types of input will be added at a later point to simplify development.
      </li>
      <li>
        For now, <b>a P3 capable monitor</b> is required to properly display the
        `oklch` color pickers, but the UI does not validate this yet. You can use
        the external <a target="_blank" href="https://oklch.com/">"online picker" link</a> below
        color pickers, and enable the "Show P3" toggle, which will then indicate
        whether your current environment (monitor + OS/software settings) supports P3.
      </li>
    </ul>
    {/* <h2>Focus of the online demo</h2>
    <p>
      The focus is on the front end experience, in fact the back end is a very
      simple mock in local storage. The idea is to have the frontend be able to
      produce the new CSS (or representation thereof), so that the task of the
      back end becomes basically file hosting and some version control.
    </p>
    <p>
      Even within the front end, the question of what the changes mean is being
      left open as much as possible. It could either be for managing theme
      variations of a main theme (in which case the current solution is already
      quite complete), or for changing a main theme over time.
    </p> */}
    <h2>Things to be aware of / watch out for</h2>
    <ul>
      {/* <li>
        While the shown data should be accurate, sometimes more specific rules
        are missed, causing it to not show the most specific value.
      </li> */}
      <li>
        The quality and mostly the quantity of CSS on a page has a big impact on
        the quality of the experience. 
        The <a href="https://inwerpsel.github.io/use-theme-editor/demo/halfmoon/docs/forms">halfmoon demo</a> currently
        has the most complete and glitch free experience.
      </li>
      <li>You can display data that does not use CSS variables, but can't modify those values yet.</li>
      <li>
        There are some bugs and possible crashes when using pin together with
        lock system.
      </li>
    </ul>
  </Tutorial>
);

export function StartTutorial() {
  const active = useActiveTutorialElement();
  if (active) {
    if (activeCourse === 'prep') {
      return (
        <Fragment>
          <button onClick={exitTutorial}>Exit tutorial</button>
          {intro}
        </Fragment>
      );
    }
    return intro;
  }

  return <button onClick={startTutorial}>Start tutorial</button>;
}

let activeStepIndex = 0;
// let activeStepEl = activeCourse.steps[activeStepIndex];

function openDrawerIfNeeded() {
    lastEl = null;
    setTimeout(() => {
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
    if (activeCourse === 'prep' && activeStepIndex === 0) {
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
    const buttonRef = useRef();
    const isActive = el === useActiveTutorialElement();
    useEffect(() => {
        if (isActive) lastEl = el;
        ref.current?.scrollIntoView({behavior: 'smooth'});
    }, [isActive]);

    useEffect(() => {
      buttonRef?.current?.focus();
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
        <button ref={buttonRef} disabled={!doneAll} onClick={nextStep}>Next</button>
      </div>
    );
}

StartTutorial.fName = 'StartTutorial';