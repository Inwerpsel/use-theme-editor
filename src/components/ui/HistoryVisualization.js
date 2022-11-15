import React, { useContext, useState } from 'react';
import { HistoryNavigateContext } from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';

function getName(action) {
  // console.log(action);
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
          <li {...{ key }}>
            <b>{id}</b>
            {name}
            {isShortString && (
              <pre style={{ margin: 0, float: 'right' }} className="monospace-code">
                {value === false ? 'false' : value === true ? 'true' : value}
              </pre>
            )}
            {!isPayloadLess && showPayloads && !isShortString && (
              <pre className="monospace-code">
                {value === false ? 'false' : value === true ? 'true' : value}
              </pre>
            )}
            {Preview && <Preview payload={action.payload} />}
          </li>
        );
      })}
    </ul>
  );
}

export function HistoryVisualization() {
  const [showJson, setShowJson] = useState(false);
  const [showPayloads, setShowPayloads] = useState(false);
  const { states, historyStack, historyOffset, currentId, lastActions, currentStates } =
    useContext(HistoryNavigateContext);


  // const {THEME_EDITOR, ...otherState} = states;

  const currentIndex = historyStack.length - historyOffset;

  return (
    <div className='history'>
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
      <ul style={{display: 'flex', flexDirection: 'column-reverse'}}>
        {historyStack.map(({ lastActions, states }, index) => {
          return (
            <li
              key={index}
              style={{
                border: index === currentIndex ? '2px solid yellow' : '2px solid black',
              }}
            >
              <ActionList actions={Object.entries(lastActions)}  {...{showPayloads}}/>
            </li>
          );
        })}
        <li key={'latest'} style={{
              border: historyOffset === 0 ? '2px solid yellow' : '2px solid black',
        }}>
          LATEST
          <ActionList actions={Object.entries(lastActions)} {...{showPayloads}}/>
        </li>
      </ul>
    </div>
  );
}
