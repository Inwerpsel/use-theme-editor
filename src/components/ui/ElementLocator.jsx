import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
  useId,
} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import { allStateSelectorsRegexp, residualNotRegexp } from '../../functions/getMatchingVars';

function removeStateSelectors(selector) {
  return selector
    .replaceAll(allStateSelectorsRegexp, '')
    .replaceAll(/:?:(before|after)/g, '')
    .replaceAll(residualNotRegexp, '')
  .trim()
}

let lastInspectedSelector, lastInspectedIndex;

export function ElementLocator({
  selector,
  initialized,
  hideIfNotFound,
  hideIfOne,
  children,
  showLabel = true,
  property = null,
  label,
}) {
  const strippedSelector = useMemo(() => removeStateSelectors(selector), []);
  const didLastInspectHere = strippedSelector === lastInspectedSelector;
  const { frameRef, lastInspectTime } = useContext(ThemeEditorContext);
  const [elements, setElements] = useState([]);
  const [currentElement, setCurrentElement] = useState(didLastInspectHere ? lastInspectedIndex : 0);
  const [interacted, setInteracted] = useState(false);
  const id = useId();
  // Should happen up front for all selectors, so that they're properly grouped from the start.

  useEffect(() => {
    if (!initialized) {
      return;
    }
    const listener = ({data: {type, payload}}) => {
      if (type === 'elements-located') {
        const {elements, selector: messageSelector} = payload;
        if (messageSelector === strippedSelector) {
          let currentInspected = 0;
          for (const index in elements) {
            if (elements[index].isCurrentlyInspected) {
              currentInspected = +index;
              break;
            }
          }

          currentElement === 0 && setCurrentElement(currentInspected);
          setElements(elements);
        }
      }
    };
    window.addEventListener('message', listener, false);

    frameRef.current?.contentWindow.postMessage(
      {
        type: 'locate-elements', payload: {id, selector: strippedSelector},
      },
      window.location.origin,
    );

    return () => {
      window.removeEventListener('message', listener);
    };
  }, [initialized, selector, !hideIfOne || lastInspectTime]);

  useEffect(() => {
    if (interacted && elements.length > 0) {
      frameRef.current?.contentWindow.postMessage(
        {
          type: 'scroll-in-view', payload: {selector: strippedSelector, index: currentElement},
        },
        window.location.href,
      );
    }
  }, [currentElement]);

  if (elements.length === 0) {
    if ((hideIfNotFound && initialized) || hideIfOne) {
      return null;
    }
    return <div style={{opacity: 0.6}}>
      {showLabel && <div className='monospace-code'>
      {(label || selector).trim()}
          <span className={'var-control-property monospace-code'}>{property}</span>
      </div>}

        <span>Not found on page</span>
        {children}
    </div>;
  }

  if (hideIfOne && elements.length === 1) {
    // If the locator is shown in the context of a selected element,
    // it should be the same one if it's the only result.
    return null;
  }

  const element = elements[currentElement];

  return (
    <div style={{outline: didLastInspectHere ? '4px solid rgb(26, 217, 210)' : 'none'}}>
      {showLabel && (
        <div className="monospace-code">
          {(label || selector).trim()}
          <span className={'var-control-property monospace-code'}>{property}</span>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          maxWidth: '372px',
          fontSize: '16px'
        }}
      >
        <div style={{flexShrink: 0, display: 'flex', flexDirection: 'row'}}>
          {elements.length > 0 && <button
            className='scroll-in-view'
              onClick={() => {
                frameRef.current?.contentWindow.postMessage(
                  {
                    type: 'scroll-in-view',
                    payload: {
                      selector: strippedSelector,
                      index: currentElement,
                    },
                  },
                  window.location.href
                );
              }}
          >👁
          </button>}
          

          {elements.length > 1 && (
            <Fragment>
              <button
                onClick={() => {
                  const next =
                    currentElement === 0
                      ? elements.length - 1
                      : currentElement - 1;
                  setCurrentElement(next);
                  setInteracted(true);
                }}
              >
                ↑
              </button>
              <button
                onClick={() => {
                  const next =
                    currentElement === elements.length - 1
                      ? 0
                      : currentElement + 1;
                  setCurrentElement(next);
                  setInteracted(true);
                }}
              >
                ↓
              </button>
            </Fragment>
          )}
        </div>
        <div style={{ flexShrink: 1 }}>
          {!!element && !element.isCurrentlyInspected && (
            <button
              onClick={() => {
                lastInspectedSelector = strippedSelector;
                lastInspectedIndex = currentElement;
                frameRef.current?.contentWindow.postMessage(
                  {
                    type: 'inspect-located',
                    payload: {
                      index: currentElement,
                      selector: strippedSelector,
                    },
                  },
                  window.location.origin
                );
              }}
              style={{ fontSize: '10px' }}
            >
              inspect
            </button>
          )}
          <span>
            {' '}
            {currentElement + 1}/{elements.length}{' '}
          </span>
          <span
            style={{
              maxWidth: '120px',
              fontWeight:
                element && element.isCurrentlyInspected ? 'bold' : 'normal',
            }}
          >
            {element &&
              ` ${element.tagName.toLowerCase()}.${element.className.trim().replaceAll(' ', '.')} ${
                !element.id ? '' : `#${element.id}`
              }`}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
