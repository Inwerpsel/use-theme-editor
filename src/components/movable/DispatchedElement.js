import React, {createContext, useContext, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {AreasContext, DRAG_LEAVE_TIMEOUT} from './MovablePanels';
import {AreaSwitcher} from './AreaSwitcher';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import classnames from 'classnames';

export const DispatchedElementContext = createContext({});

// Current best attempt at generating a stable ID.
//
// It always works because it defaults to the index within the home area,
// however that's not resilient to changes in the source code order.
// For that to work it also includes the home area in the ID,
// which makes moving any component to another area in source mess up the location map.
// Likely the ID logic should be flexible and configurable.
// Would be nice to use the component name, however this usually is not 
// preserved in the prod build. I'll investigate if it's desirable to
// make the code use it in prod anyway (impact on bundle size/perf in general, ease of config).
function getId(element, index) {
  // Assume string means a default DOM node.
  if (typeof element.type === 'string') {
    // Use ID or first class.
    return element.props.id || element.props.className?.split(' ')[0] || index;
  }

  // Default to the element's type, which is assumed to be unique.
  return `${element.type?.name || 'component'}#${element.id || index}`;
}

export function useCompactSetting() {
  const {elementId} = useContext(DispatchedElementContext);

  return useLocalStorage(`compact::${elementId}`, true);
}

export function DispatchedElement({homeAreaId, element, index}) {
  const {
    origLocationsRef,
    panelMap,
    showMovers,
    movePanelTo,
    overElement, setOverElement,
    overArea, setOverArea,
    timeoutRef,
    draggedElement, setDraggedElement,
    dragEnabled,
    drawerOpen,
    areaRefs,
  } = useContext(AreasContext);

  const elementId = useMemo(
    () => `${homeAreaId}~~${getId(element, index)}`,
    []
  );

  if (!origLocationsRef.current[elementId]) {
    origLocationsRef.current[elementId] = homeAreaId;
  }

  const [hostAreaId, order] = panelMap[elementId] || [];
  // There are 3 cases where we want to render in its default place.
  // 1) Element wasn't moved.
  // 2) Element was moved to its home area.
  // 3) The host area doesn't exist yet. A new render will get triggered after all areas have been rendered.
  const showHere = !hostAreaId || hostAreaId === homeAreaId || !areaRefs.current[hostAreaId]?.current;

  const [isDragged, setIsDragged] = useState(false);
  // Allow dragging individually if not generally enabled in MovablePanels.
  const [forceDrag, setForceDrag] = useState(false);

  const context = useMemo(
    () => ({
      homeAreaId,
      elementId,
      hostAreaId,
      forceDrag,
      setForceDrag,
    }),
    [hostAreaId, forceDrag]
  );

  if (!drawerOpen && (hostAreaId || homeAreaId) === 'drawer') {
    return null;
  }

  const [overAreaId, overElementId] = overElement || [];
  const isDragHovered = overElementId === elementId;

  const draggable = dragEnabled || forceDrag;

  const wrappedElement = (
    <div
      {...{draggable}}
      style={{
        position: 'relative',
        order: order || null,
      }}
      title={!dragEnabled ? null : elementId}
      className={classnames('dispatched-element', { 'is-dragged': isDragged })}
      onDragStart={() => {
        if (dragEnabled || forceDrag) {
          setDraggedElement(elementId);
          forceDrag && setForceDrag(false);
          setTimeout(() => {
            // Without timeout there's no drag element snapshot.
            setIsDragged(true);
          }, 0);
        }
      }}
      onDragEnd={() => {
        setDraggedElement(null);
        setIsDragged(false);
        if (overElement) {
          if (timeoutRef.current.element) {
            clearTimeout(timeoutRef.current.element);
            timeoutRef.current.element = null;
          }
          if (timeoutRef.current.area) {
            clearTimeout(timeoutRef.current.area);
            timeoutRef.current.area = null;
          }
          movePanelTo(elementId, overAreaId, overElementId);
          setOverElement(null);
          return;
        }
        if (overArea) {
          movePanelTo(elementId, overArea);
        }
      }}
    >
      {draggedElement && draggedElement !== elementId && (
        <span
          style={{
            color: 'yellowgreen',
            position: 'absolute',
            top: '-12px',
            fontSize: '12px',
            right: '0',
            zIndex: 1001,
            fontWeight: 'bold !important',
          }}
        >
          {elementId}
        </span>
      )}

      <DispatchedElementContext.Provider
        value={context}
      >
        {element}
      </DispatchedElementContext.Provider>

      {showMovers && <AreaSwitcher {...{elementId, homeAreaId, hostAreaId}}/>}

      {draggedElement && draggedElement !== elementId && (
        <div
          style={{ zIndex: 1000 }}
          className={classnames('dropzone', {
            'drag-hovered': isDragHovered ,
          })}
          onDragEnter={() => {
            timeoutRef.current.lastEntered = elementId;
            if (timeoutRef.current.element) {
              clearTimeout(timeoutRef.current.element);
              timeoutRef.current.element = null;
            }
            setOverArea(null);
            setOverElement([
              hostAreaId || homeAreaId,
              elementId,
              order || index,
            ]);
          }}
          onDragLeave={() => {
            timeoutRef.current.element &&
              clearTimeout(timeoutRef.current.element);

            if (timeoutRef.current.lastEntered === elementId) {
              timeoutRef.current.element = setTimeout(() => {
                setOverElement(null);
              }, DRAG_LEAVE_TIMEOUT);
            }
          }}
        ></div>
      )}
    </div>
  );

  // Changing to another portal host will un- and then remount the component.
  return showHere
    ? wrappedElement
    : createPortal(wrappedElement, areaRefs.current[hostAreaId].current);
}
