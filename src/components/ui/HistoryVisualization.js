import React, { useContext } from 'react';
import { HistoryNavigateContext, SharedHistoryContext } from '../../hooks/useResumableReducer';

export function HistoryVisualization() {
  const { states, historyStack, historyOffset, currentId, lastAction } =
    useContext(HistoryNavigateContext);

  const currentType = !lastAction
    ? ''
    : typeof lastAction.type === 'function'
    ? lastAction.type.name
    : lastAction.type;

  const {THEME_EDITOR, ...otherState} = states;

  const currentIndex = historyStack.length - historyOffset;

  return (
    <div>
        <div title={JSON.stringify(states, null, 2)}>
      Current: {currentId}
      Last action: <b>{currentType}</b>
        </div>
      {/* <pre className='monospace-code'>
        {JSON.stringify(otherState, null, 2)}
      </pre> */}
      <h2>History</h2>
      <ul>
        {historyStack.map(({ id, lastAction, states }, index) => {
          if (index > currentIndex) {
            return null;
          }
          const _type = lastAction.type;
          const type = typeof _type === 'function' ? _type.name : _type;
          return (
            <li key={Math.random()} style={{border: index === currentIndex ? '2px solid yellow' : 'none'}}>
              {id}: <b>{type}</b>
              <div>
                {typeof lastAction === 'string'
                  ? lastAction
                  : typeof lastAction === 'string' ? lastAction : JSON.stringify(lastAction.payload || '', null, 2)}
              </div>
            </li>
          );
        })}
      </ul>
      <h2>Future</h2>
      <ul>
        {historyStack.map(({ id, lastAction, states }, index) => {
          if (index <= currentIndex) {
            return null;
          }
          const _type = lastAction.type;
          const type = typeof _type === 'function' ? _type.name : _type;

          return (
            <li key={Math.random()}>
              {id}: <b>{type}</b>
              <div>{typeof lastAction === 'string' ? lastAction : JSON.stringify(lastAction.payload || 'none', null, 2)}</div>
            </li>
          );
        })}
        {historyOffset > 0 && <li key={Math.random()}>
              {currentId}: 
              <div>{typeof lastAction === 'string' ? lastAction : JSON.stringify(lastAction.payload || 'none', null, 2)}</div>
            </li>}
      </ul>
    </div>
  );
}
