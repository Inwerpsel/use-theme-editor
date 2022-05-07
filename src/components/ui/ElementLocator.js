import React, {Fragment, useContext, useEffect, useState} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {useId} from '../../hooks/useId';

export function ElementLocator({selector, initialized}) {
  const {
    frameRef,
  } = useContext(ThemeEditorContext);
  const [elements, setElements] = useState([]);
  const [currentElement, setCurrentElement] = useState(0);
  const id = useId();

  useEffect(() => {
    if (!initialized) {
      return;
    }
    const listener = ({data: {type, payload}}) => {
      if (type === 'elements-located') {
        const {elements, selector: messageSelector} = payload;
        if (messageSelector !== selector) {
          return;
        }
        setElements(elements);
      }
    };
    window.addEventListener('message', listener, false);

    frameRef.current?.contentWindow.postMessage(
      {
        type: 'locate-elements', payload: {id, selector},
      },
      window.location.origin,
    );
    return () => {
      window.removeEventListener('message', listener);
    };
  }, [initialized, selector]);

  useEffect(() => {
    if (frameRef.current && elements.length > 0) {
      frameRef.current.contentWindow.postMessage(
        {
          type: 'scroll-in-view', payload: {selector, index: currentElement},
        },
        window.location.href,
      );
    }
  }, [currentElement]);

  if (elements.length === 0) {
    return <Fragment>
      <span title={selector}>No elements found!</span>
      <span style={{fontSize: '12px', color: 'grey'}}>{selector}</span>
    </Fragment>;
  }

  const element = elements[currentElement];

  return <div style={{display: 'flex', justifyContent: 'space-between', maxWidth: '372px', fontSize: '14px'}}>
    <div style={{flexShrink: 1}}>
      <span> {currentElement + 1}/{elements.length} </span>
      <span style={{maxWidth: '120px'}}>
        {element && ` ${element.tagName}.${element.className} ${!element.id ? '' : `#${element.id}`}`}
      </span>
    </div>
    <div style={{flexShrink: 0}}>
      {elements.length > 1 && <Fragment>
        <button
          onClick={() => {
            const next = currentElement === 0 ? elements.length - 1 : currentElement - 1;
            setCurrentElement(next);
          }}
        >↑
        </button>
        <button
          onClick={() => {
            const next = currentElement === elements.length - 1 ? 0 : currentElement + 1;
            setCurrentElement(next);
          }}
        >↓
        </button>
      </Fragment>}
      <button
        onClick={() => {
          if (frameRef.current && elements.length > 0) {
            frameRef.current.contentWindow.postMessage(
              {
                type: 'scroll-in-view', payload: {selector, index: currentElement},
              },
              window.location.href,
            );
          }
        }}
      >Focus
      </button>
    </div>
  </div>;
}
