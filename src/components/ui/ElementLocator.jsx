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
import { get, use } from '../../state';
import { isInPath, toNode, toPath } from '../../functions/nodePath';
import { addHighlight, removeHighlight } from '../../functions/highlight';

function removeStateSelectors(selector) {
  return selector
    .replaceAll(allStateSelectorsRegexp, '')
    .replaceAll(/:?:(before|after)/g, '')
    .replaceAll(residualNotRegexp, '')
  .trim()
}

let lastInspectedSelector, lastHighlightTimeout;

function viewHighLightSingle(element) {
  element.scrollIntoView({behavior: 'smooth', block: 'center'});
  addHighlight(element);
  if (lastHighlightTimeout) {
    const [timeout, handler, timeoutElement] = lastHighlightTimeout;

    window.clearTimeout(timeout);
    // If previous timeout was on another element, execute it immediately.
    // Removes its focus border.
    if (timeoutElement !== element) {
      handler();
    }
  }
  const handler = () => {
    removeHighlight(element);
    lastHighlightTimeout = null;
  };

  lastHighlightTimeout = [setTimeout(handler, 1500), handler, element];
}

export function ElementLocator({
  selector,
  hideIfNotFound,
  hideIfOne,
  children,
  showLabel = true,
  property = null,
  label,
}) {
  const { frameLoaded } = get;
  const [inspectedPath, setInspectedPath] = use.inspectedPath();
  const strippedSelector = useMemo(() => removeStateSelectors(selector), []);
  const didLastInspectHere = strippedSelector === lastInspectedSelector;
  const { frameRef } = useContext(ThemeEditorContext);

  const elements = useMemo(() => {
    if (!frameLoaded || strippedSelector === '') return [];
    const results =
      frameRef.current.contentWindow.document.querySelectorAll(
        strippedSelector
      );

    return [...results].map((el, index) => ({
      index,
      node: el,
      tagName: `${el.tagName}`,
      id: `${el.id}`,
      className: `${el.className}`,
      isCurrentlyInspected: isInPath(el, inspectedPath),
    }));
  }, [selector, frameLoaded]);

  const [currentElement, setCurrentElement] = useState(
    Math.max(elements.findIndex((el) => el.isCurrentlyInspected),  0)
  );

  if (elements.length === 0) {
    if (hideIfNotFound || hideIfOne) {
      return null;
    }
    return (
      <div style={{ opacity: 0.6 }}>
        {showLabel && (
          <div className="monospace-code">
            {(label || selector).trim()}
            <span className={'var-control-property monospace-code'}>
              {property}
            </span>
          </div>
        )}

        {children}
      </div>
    );
  }

  if (hideIfOne && elements.length === 1) {
    // If the locator is shown in the context of a selected element,
    // it should be the same one if it's the only result.
    return null;
  }

  const element = elements[currentElement];

  return (
    <div
      style={{
        outline: didLastInspectHere ? '4px solid rgb(26, 217, 210)' : 'none',
      }}
    >
      {showLabel && (
        <div className="monospace-code">
          {(label || selector).trim()}
          <span className={'var-control-property monospace-code'}>
            {property}
          </span>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          maxWidth: '372px',
          fontSize: '16px',
        }}
      >
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'row' }}>
          {elements.length > 0 && (
            <button
              className="scroll-in-view"
              onClick={() => {
                viewHighLightSingle(elements[currentElement].node);
              }}
            >
              👁
            </button>
          )}

          {elements.length > 1 && (
            <Fragment>
              <button
                onClick={() => {
                  const next =
                    currentElement === 0
                      ? elements.length - 1
                      : currentElement - 1;
                  setCurrentElement(next);
                  viewHighLightSingle(elements[next].node);
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
                  viewHighLightSingle(elements[next].node);
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
                setInspectedPath(toPath(element.node));
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
              ` ${element.tagName.toLowerCase()}.${element.className
                .trim()
                .replaceAll(' ', '.')} ${!element.id ? '' : `#${element.id}`}`}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
