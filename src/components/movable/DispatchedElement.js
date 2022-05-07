import React, {createContext, useContext, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {AreasContext, DRAG_LEAVE_TIMEOUT} from './MovablePanels';
import {AreaSwitcher} from './AreaSwitcher';
import classNames from 'classnames';

export const DispatchedElementContext = createContext({});

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
  const showHere = !hostAreaId || hostAreaId === homeAreaId || !areaRefs.current[hostAreaId]?.current;
  const [isDragged, setIsDragged] = useState(false);
  const dragTimeoutRef = useRef();
  const isDragHovered = !!overElement && overElement[1] === elementId;
  const [overAreaId, overElementId] = overElement || [];

  const isDefaultDrawerHidden = homeAreaId === 'drawer' && !showDrawer && showHere;
  const isMoveToDrawerHidden = hostAreaId === 'drawer' && !showDrawer;
  const hidden = isDefaultDrawerHidden || isMoveToDrawerHidden;

  if (hidden && !draggedElement) {
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
    onDragStart={event => {
      if (!dragEnabled) {
        return;
      }
      setDraggedElement(elementId);
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragged(true);
      }, 100);
    }}
    onDragEnd={event => {
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
    {showMovers && <AreaSwitcher/>}
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
  return <DispatchedElementContext.Provider value={{areaId: homeAreaId, elementId, hostId: hostAreaId}}>
    {showHere ? wrappedElement : createPortal(wrappedElement, areaRefs.current[hostAreaId].current)}
  </DispatchedElementContext.Provider>;
}
