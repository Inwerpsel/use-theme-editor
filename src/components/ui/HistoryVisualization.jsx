import React, { useContext, useState } from 'react';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { use } from '../../state';

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
    <ul>
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
  const [, setVissualizeAlways] = use.visualizeHistoryAlways();
  const [showJson, setShowJson] = useState(false);
  const [showPayloads, setShowPayloads] = useState(false);
  const {
    historyStack,
    historyOffset,
    lastActions,
    currentStates,
    dispatch,
  } = useContext(HistoryNavigateContext);

  const currentIndex = historyStack.length - historyOffset;
  let isInFuture = false;

  return (
    <div className="history">
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

      <h2>History</h2>
      <ul style={{ display: 'flex', flexDirection: 'column-reverse' }}>
        {historyStack.map(({ states, lastActions }, index) => {
          const isPresent = index === currentIndex;
          // We don't use this in the present so it can be true already.
          isInFuture = isInFuture || isPresent;
          const amount = Math.abs(index - currentIndex);
          const type = isInFuture ? 'HISTORY_FORWARD' : 'HISTORY_BACKWARD';

          // Check if simple state would be changed by replaying.
          // Reducer actions are assumed to always be able to change state.
          const canReplay = Object.entries(lastActions).some(
            ([id, action]) =>
              typeof action === 'object' || states[id] !== currentStates[id]
          );

          return (
            <li
              className='historical-actions'
              key={index}
              style={{
                position: 'relative',
                border:
                  index === currentIndex
                    ? '2px solid yellow'
                    : '2px solid black',
              }}
            >
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
                          setVissualizeAlways(true);
                          dispatch({ type: 'HISTORY_FORWARD', payload: { amount: historyOffset } });
                        }
                      : () => {
                          dispatch({ type, payload: { amount } });
                        }
                  }
                >
                  {isPresent ? 'jump to end' : 'jump here'}
                </button>
                {canReplay && (
                  <button
                    style={{width: '50%'}}
                    onClick={(event) => {
                      Object.entries(lastActions).forEach(([id, action]) =>
                        dispatch({
                          type: 'PERFORM_ACTION',
                          payload: { id, action },
                          options: {},
                        })
                      );
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
            // Whether the present is in the future?
            dispatch({ type: 'HISTORY_FORWARD', payload: { amount: historyOffset } });
          }}
          key={'latest'}
          style={{
            border:
              historyOffset === 0 ? '2px solid yellow' : '2px solid black',
          }}
        >
          LATEST
          <ActionList
            actions={Object.entries(lastActions)}
            {...{ showPayloads }}
          />
        </li>
      </ul>
    </div>
  );
}
