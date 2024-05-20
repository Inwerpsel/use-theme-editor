import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import {
  HistoryNavigateContext,
  addLock,
  clearHistory,
  historyBack,
  historyBackFast,
  historyBackOne,
  historyForward,
  historyForwardFast,
  historyForwardOne,
  removeLock,
} from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { use } from '../../state';
import { Tutorial } from '../../_unstable/Tutorial';

function HistoryBack() {
  const { past, historyOffset } = useContext(HistoryNavigateContext);
  const remainingLength = past.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    onClick={historyBackOne}
  >←
  </button>;
}

function HistoryForward() {
  const { historyOffset } = useContext(HistoryNavigateContext);

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={historyForwardOne}
  >→
  </button>;
}

function HistoryBackFast() {
  const { past, historyOffset } = useContext(HistoryNavigateContext);
  const remainingLength = past.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    onClick={historyBackFast}
  >←!
  </button>;
}

function HistoryForwardFast() {
  const { historyOffset } = useContext(HistoryNavigateContext);

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={historyForwardFast}
  >!→
  </button>;
}

function Dots({amount}) {
  const dots = [];
  for (let i = 0; i < amount; i++) {
    dots.push(i);
  }

  return <div style={{position: 'absolute', top: '4px', left: '2.4px', width: 'calc(100% - 7px)', display: 'flex', justifyContent: 'space-between'}}>
    {dots.map(i => <span key={i} style={{height: '4px', borderLeft: '1px solid #646262'}}/>)}
  </div>
}

export function MiniTimeline() {
  const { past, historyOffset } = useContext(HistoryNavigateContext);

  const percentage = past.length === 0 ? 0 : 100 - (100 * historyOffset / past.length);

  return <div style={{width: '100%', height: '6px', padding:'2px', background: 'darkgrey', boxSizing: 'border-box'}}>
    <div style={{width: `${percentage}%`, height: '2px', background: 'rgb(26, 217, 210)', borderRight: '3px solid black', transition: 'width .3s ease-out', boxSizing: 'border-box'}}></div>
    <Dots amount={past.length + 1} />
    <Tutorial el={MiniTimeline}>
      Here's a compact version of the history timeline.

      You can scroll above the history section to move the timeline one step at a time,
      however fast you and your mouse like to work with.

      <h1>
        Warning!
      </h1>
      <p>
        This will restore the UI state across the whole screen,
        which definitely is a concern for people with epilepsy.
      </p>
      <p>
        After having changed the page background color multiple times, for example,
        going through this history timeline fast will cause the whole preview screen to flash.
      </p>
      <p>
        It's recommended to only use it when controlled, small nudges of the wheel are possible.
      </p>
      <p>
        Keeping some state locked can help reduce the amount of changes happening in rapid succession.
      </p>
    </Tutorial>
  </div>
}

export function LockStatus() {
  const { locks } = useContext(HistoryNavigateContext);

  const [open, setOpen] = useState(false);

  const amount = locks.size;

  // if (amount === 0) {
  //   return null;
  // }

  return (
    <Fragment>
      <button
        title={open ? '' : [...locks.keys()].join(', ')} 
        onClick={(event) => {
          setOpen(!open);
        }}
      >
        🔒{amount}
      <Tutorial el={LockStatus}>
        <p>
          This button shows how many locks are applied and allows you to toggle each.
        </p>
        <strong>Tutorial is currently covering the lock list, sorry 'bout that.</strong>
        <p>
          Notice how the timeline now jumps over the entries we locked earlier.
        </p>
      </Tutorial>
      </button>
      {open && <LocksList close={() => setOpen(false)}/>}
    </Fragment>
  );
}

function LocksList({close}) {
  const { locks, past, states } = useContext(HistoryNavigateContext);
  const [origLocks] = useState(new Map(locks));
  const entries = [...origLocks.entries()];
  const ref = useRef();
  let i = 0;

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current.parentNode.contains(event.target)) {
        close();
      }
    };
    document.addEventListener('click', listener);
    return () => {
      document.removeEventListener('click', listener);
    };
  }, [])

  return (
    <ul
      {...{ref}}
      style={{
        position: 'absolute',
        background: 'white',
        border: '1px solid black',
      }}
    >
      {entries.map(([key, index]) => {
        const active = locks.has(key);
        const enable = () => addLock(key, index);
        const disable = () => removeLock(key);
        const entry = index < past.length ? past[index].states : states;
        const value = entry.has(key) ? entry.get(key) : 'default';
        i++;

        return (
          <li {...{ key }}>
            <button autoFocus={i === 1} onClick={active ? disable : enable}>
              {active ? 'on' : 'off'}
            </button>
            {key}: { typeof value === 'object' ? '[obj]' : value}
          </li>
        );
      })}
    </ul>
  );
}

export function scrollHistory(event) {
  const delta = Math.round(event.deltaY / 100);
  delta > 0 ? historyBack(delta, true) : historyForward(-delta, true);
}

export function HistoryControls() { 
    const [visualize, setVissualize] = use.visualizeHistory();
    const [visualizeAlways, setVissualizeAlways] = use.visualizeHistoryAlways();

    return (
      <div onWheelCapture={scrollHistory}>
        <MiniTimeline />
        <LockStatus />
        <HistoryBackFast />
        <HistoryBack />
        <HistoryForward />
        <HistoryForwardFast />
        <Checkbox controls={[visualize, setVissualize]}>Visualize</Checkbox>
        {visualize && <Checkbox title='Always or only when in a previous state' controls={[visualizeAlways, setVissualizeAlways]}>Always</Checkbox>}

        <button
          onClick={() => {
            confirm('Clear all history, keeping only current state?') && clearHistory();
          }}
        >
          Clear
        </button>
        <Tutorial el={HistoryControls}>
          <p>
            Every step you do in the editor is tracked in a history timeline.
            Keyboard shortcuts (control+z and others) work like anywhere else.
          </p>

          <p>
            On top of "normal" history buttons, there's the fast button (!→),
            which jumps to the most important changes like edits to style rules,
            newly inspected elements, and editor UI layout changes. It jumps
            over the less interesting steps, while still applying their result.
          </p>
        </Tutorial>
      </div>
    );
}

HistoryControls.fName = 'HistoryControls';