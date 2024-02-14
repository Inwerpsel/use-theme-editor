import React, { Fragment, MouseEvent, useContext, useEffect, useRef, useState } from 'react';
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
  historyGo,
  removeLock,
} from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { use } from '../../state';

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

function scrollToPoint(length, event: MouseEvent) {
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  const ratio = Math.abs((event.clientX - rect.left) / rect.width);
  const newIndex = Math.round(length * ratio);
  historyGo(length - newIndex);
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

function MiniTimeline() {
  const { past, historyOffset } = useContext(HistoryNavigateContext);

  const percentage = past.length === 0 ? 0 : 100 - (100 * historyOffset / past.length);

  return <div style={{width: '100%', height: '6px', padding:'2px',  background: 'darkgrey'}} onClick={scrollToPoint.bind(null, past.length)}>
    <div style={{width: `${percentage}%`, height: '2px', background: 'rgb(26, 217, 210)', borderRight: '3px solid black', transition: 'width .2s ease'}}></div>
    <Dots amount={past.length + 1} />
  </div>
}

function LockStatus() {
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
      </button>{' '}
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

function scrollHistory(event) {
  const delta = Math.round(event.deltaY / 100);
  delta > 0 ? historyBack(delta) : historyForward(-delta);
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
      </div>
    );
}