import React, {createContext, useContext, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {AreasContext, DRAG_LEAVE_TIMEOUT, refs} from './MovablePanels';
import {AreaSwitcher} from './AreaSwitcher';

export const DispatchedElementContext = createContext({});

function getId(element, index) {
  if (['div', 'p', 'span', 'ul', 'li'].includes(element.type)) {
    // Use ID or first class.
    return element.props.id || element.props.className?.split(' ')[0];
  }

  // Default to the element's type, which is assumed to be unique.
  // Use the
  return `${element.type?.name}#${element.id || index}`;
}

export function DispatchedElement({areaId, element, index}) {
  const {
    panelMap,
    showMovers,
    movePanelTo,
    overElement, setOverElement,
    overArea,
    timeoutRef,
    draggedElement, setDraggedElement,
    dragEnabled,
    showDrawer,
  } = useContext(AreasContext);

  const elementId = `${areaId}~~${getId(element, index)}`;
  const [hostAreaId, order] = panelMap[elementId] || [];
  const showHere = !hostAreaId || !refs[hostAreaId]?.current;
  const [isDragged, setIsDragged] = useState(false);
  const dragTimeoutRef = useRef();
  const isDragHovered = !!overElement && overElement[1] === elementId;

  const isDefaultDrawerHidden = areaId === 'drawer' && !showDrawer && showHere;
  const isMoveToDrawerHidden = hostAreaId === 'drawer' && !showDrawer;
  const hidden = isDefaultDrawerHidden || isMoveToDrawerHidden;

  if (hidden && !draggedElement) {
    return null;
  }

  const wrappedElement = <div
    style={{position: 'relative', order: order || ''}}
    className={isDragged ? 'is-dragged' : '' }
    draggable={dragEnabled}
    onDragStart={() => {
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
        const [areaId, overElementId] = overElement;
        movePanelTo(elementId, areaId, overElementId);
        setOverElement(null);
        return;
      }
      if (overArea) {
        movePanelTo(elementId, overArea);
      }
    }}
  >
    {element}
    {showMovers && <AreaSwitcher/>}
    {draggedElement && draggedElement !== elementId && <div
      className={'dropzone' + (isDragHovered ? ' drag-hovered' : '')}
      onDragEnter={() => {
        timeoutRef.current.lastEntered = elementId;
        if (timeoutRef.current.element) {
          clearTimeout(timeoutRef.current.element);
          timeoutRef.current.element = null;
        }
        setOverElement([hostAreaId || areaId, elementId, order || index]);
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
  return <DispatchedElementContext.Provider value={{areaId, elementId, hostId: hostAreaId}}>
    {showHere ? wrappedElement : createPortal(wrappedElement, refs[hostAreaId].current)}
  </DispatchedElementContext.Provider>;
}
