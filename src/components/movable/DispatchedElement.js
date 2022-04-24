import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {RenderInfo} from '../RenderInfo';
import {createPortal} from 'react-dom';
import {AreasContext, DRAG_LEAVE_TIMEOUT, getId, refs} from './MovablePanels';
import {AreaSwitcher} from './AreaSwitcher';

export const DispatchedElementContext = createContext({});

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
  } = useContext(AreasContext);

  const elementId = `${areaId}~~${getId(element) || index}`;
  useEffect(() => {
    console.log('MOVABLE ELEMENT', element, elementId);
  }, []);
  const [hostAreaId, order] = panelMap[elementId] || [];
  const showHere = !hostAreaId || !refs[hostAreaId]?.current;
  const [isDragged, setIsDragged] = useState(false);
  const dragTimeoutRef = useRef();
  const isDragHovered = !!overElement && overElement[1] === elementId;

  const wrappedElement = <div
    style={{position: 'relative', order: order || ''}}
    className={isDragged ? 'is-dragged' : '' }
    draggable={dragEnabled}
    onDragStart={() => {
      setDraggedElement(elementId);
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragged(true);
      }, 120);
    }}
    onDragEnd={() => {
      dragTimeoutRef.current && clearTimeout(dragTimeoutRef.current);
      setDraggedElement(null);
      setIsDragged(false);
      console.log(`END ${elementId} over "${overElement || '(none)'}" over area "${overArea}"`);
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
    <RenderInfo/>
    {showMovers && <AreaSwitcher/>}
    {draggedElement && draggedElement !== elementId && <div
      className={'dropzone' + (isDragHovered ? ' drag-hovered' : '')}
      onDragEnter={() => {
        // console.log('ENTER', elementId, hostAreaId);
        timeoutRef.current.lastEntered = elementId;
        if (timeoutRef.current.element) {
          clearTimeout(timeoutRef.current.element);
          timeoutRef.current.element = null;
        }
        setOverElement([hostAreaId || areaId, elementId, order || index]);
      }}
      onDragLeave={() => {
        // console.log('LEAVE', elementId, hostAreaId, areaId);
        timeoutRef.current.element && clearTimeout(timeoutRef.current.element);

        if (timeoutRef.current.lastEntered === elementId) {
          timeoutRef.current.element = setTimeout(() => {
            console.log('UNSET after', DRAG_LEAVE_TIMEOUT, 'ELEMENT', elementId, 'HOST', hostAreaId, 'HOME', areaId);
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
