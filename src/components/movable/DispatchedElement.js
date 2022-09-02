import React, {createContext, useContext, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {AreasContext, DRAG_LEAVE_TIMEOUT} from './MovablePanels';
import {AreaSwitcher} from './AreaSwitcher';

export const DispatchedElementContext = createContext({});

// Current best attempt at generating a stable ID.
//
// It always works because it defaults to the index within the home area,
// however that's not resilient to changes in the source code order.
// For that to work it also includes the home area in the ID,
// which makes moving any component to another area in source mess up the location map.
// Likely the ID logic should be flexible and configurable.
function getId(element, index) {
  // Assume string means a default DOM node.
  if (typeof element.type === 'string') {
    // Use ID or first class.
    return element.props.id || element.props.className?.split(' ')[0] || index;
  }

  // Default to the element's type, which is assumed to be unique.
  // Use the
  return `${element.type?.name || 'component'}#${element.id || index}`;
}

export function DispatchedElement({homeAreaId, element, index}) {
  const {
    origLocationsRef,
    panelMap,
    showMovers,
    movePanelTo,
    overElement, setOverElement,
    overArea,
    timeoutRef,
    draggedElement, setDraggedElement,
    dragEnabled,
    showDrawer,
    areaRefs,
  } = useContext(AreasContext);

  const elementId = `${homeAreaId}~~${getId(element, index)}`;

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
  const dragTimeoutRef = useRef();
  const [overAreaId, overElementId] = overElement || [];
  const isDragHovered = overElementId === elementId;

  const isDefaultDrawerHidden = homeAreaId === 'drawer' && !showDrawer && showHere;
  const isMoveToDrawerHidden = hostAreaId === 'drawer' && !showDrawer;
  const hidden = isDefaultDrawerHidden || isMoveToDrawerHidden;

  if (hidden) {
    return null;
  }

  const wrappedElement = <div
    style={{
      position: 'relative',
      order: order || '',
    }}
    title={!dragEnabled ? null : elementId}
    className={'dispatched-element' + (!isDragged ? '' : ' is-dragged')}
    draggable={dragEnabled}
    onDragStart={() => {
      if (!dragEnabled) {
        return;
      }
      setDraggedElement(elementId);
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragged(true);
      }, 100);
    }}
    onDragEnd={() => {
      dragTimeoutRef.current && clearTimeout(dragTimeoutRef.current);
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
    {draggedElement && draggedElement !== elementId && <span
      style={{
        color: 'yellowgreen',
        position: 'absolute',
        top: '-12px',
        fontSize: '12px',
        right: '0',
        zIndex: 1001,
        fontWeight: 'bold !important',
      }}
    >{elementId}</span>}

    {element}

    {showMovers && <AreaSwitcher />}

    {draggedElement && draggedElement !== elementId && <div
      style={{zIndex: 1000}}
      className={'dropzone' + (isDragHovered ? ' drag-hovered' : '')}
      onDragEnter={() => {
        timeoutRef.current.lastEntered = elementId;
        if (timeoutRef.current.element) {
          clearTimeout(timeoutRef.current.element);
          timeoutRef.current.element = null;
        }
        setOverElement([hostAreaId || homeAreaId, elementId, order || index]);
      }}
      onDragLeave={() => {
        timeoutRef.current.element && clearTimeout(timeoutRef.current.element);

        if (timeoutRef.current.lastEntered === elementId) {
          timeoutRef.current.element = setTimeout(() => {
            setOverElement(null);
          }, DRAG_LEAVE_TIMEOUT);
        }
      }}
    >

    </div>}

  </div>;
  return <DispatchedElementContext.Provider
    value={{
      homeAreaId,
      elementId,
      hostAreaId,
    }}
  >
    {showHere ? wrappedElement : createPortal(wrappedElement, areaRefs.current[hostAreaId].current)}
  </DispatchedElementContext.Provider>;
}
