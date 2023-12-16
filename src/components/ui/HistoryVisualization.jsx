import React, { useContext, useState, useEffect } from 'react';
import { HistoryNavigateContext, historyBack, historyForward, isInterestingState, performAction } from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { get, use } from '../../state';
import { DispatchedElementContext } from '../movable/DispatchedElement';
import { setExcludedArea } from '../movable/Area';
import { useLocalStorage } from '../../hooks/useLocalStorage';

function DisableScrollHistoryInArea() {
    const {hostAreaId, homeAreaId} = useContext(DispatchedElementContext);
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

function ActionList(props) {
  const {actions, showPayloads} = props;
  const {
      previewComponents,
  } = useContext(HistoryNavigateContext);

  return (
    <ul className='history-actions'>
      {actions.map(([id, action], key) => {
        const isObject = typeof action === 'object';
        const isFromReducer = isObject && 'type' in action;
        const value = isFromReducer
          ? JSON.stringify(action.payload, null, 2)
          : isObject
          ? JSON.stringify(action, null, 2)
          : action;

        const name = !isFromReducer ? '' : '::' + getName(action);
        const isPayloadLess = value === '{}';
        const isShortString = !isFromReducer && (typeof value === 'boolean' || typeof value === 'number' || value.length < 40);

        const previews = previewComponents[id];
        const Preview =
          typeof previews === 'function'
            ? previews
            : !(id in previewComponents)
            ? null
            : previewComponents[id][getName(action)];

        return (
          <li {...{ key }} style={{ clear: 'both' }}>
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

export function HistoryVisualization() {
  const [visualizeAlways, setVisualizeAlways] = use.visualizeHistoryAlways();
  const [debug, setDebug] = useState(false);
  const [showAll, setShowAll] = useLocalStorage('showAllHistory', true);
  const [showJson, setShowJson] = useState(false);
  const [showPayloads, setShowPayloads] = useState(false);
  const {
    historyStack,
    historyOffset,
    lastActions,
    currentStates,
  } = useContext(HistoryNavigateContext);

  const showHistory = get.visualizeHistory && (visualizeAlways || historyOffset !== 0);

  if (!showHistory) {
    return null;
  }

  const currentIndex = historyStack.length - historyOffset;
  let isInFuture = false;

  return (
    <div className="history">
      <DisableScrollHistoryInArea/>
      <Checkbox controls={[debug, setDebug]}>Debug</Checkbox>
      <Checkbox controls={[showAll, setShowAll]}>Show all</Checkbox>

      {debug && <div>
        <Checkbox controls={[showJson, setShowJson]}>
          Inspect current state
        </Checkbox>
        <Checkbox controls={[showPayloads, setShowPayloads]}>
          Show payloads
        </Checkbox>
        <button onClick={() => console.log(currentStates)}>console.log</button>
        {showJson && (
          <pre className="monospace-code">
            {JSON.stringify(currentStates, null, 2)}
          </pre>
        )}
      </div>}

      <ul className='connected-list'>
        {historyStack.map(({ states, lastActions }, index) => {
          const isPresent = index === currentIndex;
          // We don't use this in the present so it can be true already.
          isInFuture = isInFuture || isPresent;
          const amount = Math.abs(index - currentIndex);

          // Check if simple state would be changed by replaying.
          // Reducer actions are assumed to always be able to change state.
          const canReplay = Object.entries(lastActions).some(
            ([id, action]) =>
              typeof action === 'object' || states[id] !== currentStates[id]
          );

          if (!isPresent && !showAll && index !== 0 && !isInterestingState(lastActions)) {
            return null;
          }

          return (
            <li
              key={index}
              id={isPresent ? 'history-current-state' : ''}
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
                actions={Object.entries(lastActions)}
                {...{ showPayloads }}
              />
              <div
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
                      : () => {
                          isInFuture
                            ? historyForward(amount)
                            : historyBack(amount);
                        }
                  }
                >
                  {isPresent ? 'jump to end' : 'jump here'}
                </button>
                {canReplay && (
                  <button
                    style={{width: '50%'}}
                    onClick={(event) => {
                      Object.entries(lastActions).forEach(([id, action]) => {
                        performAction(id, action);
                      });
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
            actions={Object.entries(lastActions)}
            {...{ showPayloads }}
          />
        </li>
      </ul>
    </div>
  );
}
