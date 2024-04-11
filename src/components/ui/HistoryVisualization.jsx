import React, { useContext, useState, useEffect, useRef } from 'react';
import { HistoryNavigateContext, addLock, exportHistory, historyBack, historyForward, interestingKeys, isInterestingState, performAction, removeLock } from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { get, use } from '../../state';
import { MovableElementContext } from '../movable/MovableElement';
import { setExcludedArea } from '../movable/Area';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { scrollHistory } from './HistoryControls';
import { Tutorial } from '../../_unstable/Tutorial';

function DisableScrollHistoryInArea() {
    const {hostAreaId, homeAreaId} = useContext(MovableElementContext);
    const id = hostAreaId || homeAreaId;
    useEffect(() => {
      setExcludedArea(id);
    }, [id])
}

function getName(action) {
  return !action
    ? ''
    : typeof action.type === 'function'
    ? action.type.name
    : action.type;
}

// Is the current and next state a single action of the same type?
// This would allow a more compact display for multiple values going into the same place.
// First determine whether a particular action is being rendered in such a sequence.
// Then, pass this as a boolean into the preview components so they can render in a compact state.
// The challenge is some data in the payload needs to be taken into account.
// Particularly, themeEditor.set should only make it compact if next entry has same scope.
function nextHistoryEntryHasSameAction() {

}

function LockState(props) {
  const { id, historyIndex } = props;
  const { locks } = useContext(HistoryNavigateContext);
  const lockedIndex = locks.get(id);
  const lockedHere = historyIndex === lockedIndex;

  return (
    <button
      className={lockedHere ? 'locked-here' : ''}
      style={{
        outline: lockedHere ? '2px solid black' : 'none',
        background: lockedHere ? 'white' : 'transparent',
      }}
      onClick={(event) => {
        lockedHere ? removeLock(id) : addLock(id, historyIndex);
        event.stopPropagation();
      }}
    >
      🔒
    </button>
  );
}

function ActionList(props) {
  const {actions, showPayloads, historyIndex} = props;
  const {
      previewComponents,
      locks,
  } = useContext(HistoryNavigateContext);

  return (
    <ul className='history-actions'>
      {[...actions].map(([id, action], key) => {
        const isObject = typeof action === 'object';
        const isFromReducer = isObject && 'type' in action;
        const value = isFromReducer
          ? JSON.stringify(action.payload, null, 2)
          : isObject
          ? JSON.stringify(action, null, 2)
          : action;

        const name = !isFromReducer ? '' : '::' + getName(action);
        const isPayloadLess = value === '{}';
        const isShortString = !isFromReducer && (typeof value === 'boolean' || typeof value === 'number' || value?.length < 40);

        const previews = previewComponents[id];
        const Preview =
          typeof previews === 'function'
            ? previews
            : !(id in previewComponents)
            ? null
            : previewComponents[id][getName(action)];

        const isLockedElsewhere = locks.has(id) && locks.get(id) !== historyIndex;

        return (
          <li {...{ key }} 
            title={isLockedElsewhere ? 'Overridden by lock' : ''}
            style={{ clear: 'both', opacity: isLockedElsewhere ? .5 : 1}}
          >
            <LockState {...{id, historyIndex}} />
            {!Preview && (
              <span>
                <b>{id}</b>
                {name}
              </span>
            )}

            {!Preview && isShortString && (
              <pre
                style={{ margin: 0, float: 'right' }}
                className="monospace-code"
              >
                {value === false ? 'false' : value === true ? 'true' : value}
              </pre>
            )}
            {!isPayloadLess && showPayloads && !isShortString && (
              <pre className="monospace-code">
                {value === false ? 'false' : value === true ? 'true' : value}
              </pre>
            )}
            {Preview && <Preview {...{action}} payload={action.payload} />}
          </li>
        );
      })}
    </ul>
  );
}

function CurrentActions() {
  const {
    past,
    historyOffset,
    lastActions,
  } = useContext(HistoryNavigateContext);
  const index = past.length - historyOffset;
  const actions = historyOffset === 0 ? lastActions : past[index].lastActions;
  
  return (
    <div onWheelCapture={scrollHistory} style={{minWidth: '170px', minHeight: '240px', overflow: 'hidden visible'}}>
      <ActionList historyIndex={index} actions={actions.entries()} />
      {/* Quick fix for el not always shown... */}
      <Tutorial el={HistoryVisualization}>Since history visualization is disabled, this only shows current history entry.</Tutorial>
    </div>
  ); 
}

export function HistoryVisualization() {
  const [visualizeAlways, setVisualizeAlways] = use.visualizeHistoryAlways();
  const [debug, setDebug] = useState(false);
  const [showAll, setShowAll] = useLocalStorage('showAllHistory', true);
  const [showJson, setShowJson] = useState(false);
  const [showPayloads, setShowPayloads] = useState(false);
  const {
    past,
    historyOffset,
    lastActions,
    pointedStates,
    locks,
  } = useContext(HistoryNavigateContext);

  const showHistory = get.visualizeHistory && (visualizeAlways || historyOffset !== 0);

  let currentRef = useRef();

  useEffect(() => {
    currentRef.current?.scrollIntoView({block: 'nearest'});
  }, [historyOffset]);

  if (!showHistory) {
    return <CurrentActions />;
  }

  const currentIndex = past.length - historyOffset;
  let isInFuture = false;

  return (
    <div className="history">
      <Tutorial el={HistoryVisualization}>
        See all steps you took here.
      </Tutorial>
      <DisableScrollHistoryInArea/>
      <Checkbox controls={[showAll, setShowAll]}>Show all</Checkbox>
      <Checkbox controls={[debug, setDebug]}>Debug</Checkbox>

      {debug && <div>
        <Checkbox controls={[showJson, setShowJson]}>
          Inspect current state
        </Checkbox>
        <Checkbox controls={[showPayloads, setShowPayloads]}>
          Show payloads
        </Checkbox>
        <button onClick={() => console.log(pointedStates)}>console.log</button>
        <button onClick={exportHistory}>export</button>
        {showJson && (
          <pre className="monospace-code">
            {JSON.stringify(Object.fromEntries(pointedStates), null, 2)}
          </pre>
        )}
      </div>}

      <ul className='connected-list'>
        {past.map(({ states, lastActions }, index) => {
          const isPresent = index === currentIndex;
          // We don't use this in the present so it can be true already.
          isInFuture = isInFuture || isPresent;
          const amount = Math.abs(index - currentIndex);

          // Check if simple state would be changed by replaying.
          // Reducer actions are assumed to always be able to change state.
          const canReplay = [...lastActions.entries()].some(
            ([id, action]) =>
              typeof action === 'object' || states.get(id) !== pointedStates.get(id)
          );

          if (!isPresent && !showAll && index !== 0 && !isInterestingState(lastActions)) {
            // Always display an entry if state is locked to its index
            const keys = [...lastActions.keys()];
            const anyLockedHere = keys.some(id=>locks.has(id) && locks.get(id) === index);
            if (!anyLockedHere && !keys.some(k=>interestingKeys.includes(k))) {
              return null;
            }
          }

          return (
            <li
              key={index}
              id={isPresent ? 'history-current-state' : ''}
              ref={index === currentIndex ? currentRef : null}
              style={{
                position: 'relative',
                outline:
                  index === currentIndex
                    ? '2px solid yellow'
                    : 'none',
              }}
            >
              <span style={{marginLeft: '-32px'}}>
                { index }
              </span>
              <ActionList
                historyIndex={index}
                actions={lastActions.entries()}
                {...{ showPayloads }}
              />
              <div
                className='history-state-buttons'
                style={{
                  display: 'flex',
                  justifyContent: 'stretch',
                }}
              >
                <button
                  style={{width: '50%'}}
                  onClick={
                    isPresent
                      ? () => {
                        // Ensure history doesn't collapse.
                          setVisualizeAlways(true);
                          historyForward(historyOffset);
                        }
                      : isInFuture 
                        ? () => {historyForward(amount)} 
                        : () => {historyBack(amount)}
                  }
                >
                  {isPresent ? 'jump to end' : 'jump here'}
                </button>
                {canReplay && (
                  <button
                    style={{width: '50%'}}
                    onClick={(event) => {
                      for (const [id, action] of lastActions.entries()) {
                        performAction(id, action);
                      }
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    do again
                  </button>
                )}
              </div>
            </li>
          );
        })}
        <li
          onClick={!isInFuture ? null : () => {
            historyForward(historyOffset);
          }}
          key={'latest'}
          style={{
            outline:
              historyOffset === 0 ? '2px solid yellow' : 'none',
          }}
        >
          <span style={{marginLeft: '-32px'}}>
            Latest
          </span>
          <ActionList
            historyIndex={past.length}
            actions={lastActions.entries()}
            {...{ showPayloads }}
          />
        </li>
      </ul>
    </div>
  );
}

HistoryVisualization.fName = 'HistoryVisualization';