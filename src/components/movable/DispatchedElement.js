import React, {createContext, useContext, useEffect} from 'react';
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
    order,
    setOrder,
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
  const hostId = panelMap[elementId];
  const showHere = !hostId || !refs[hostId]?.current;

  const wrappedElement = <div
    style={{position: 'relative', order: !order[hostId] ? '' : order[hostId][elementId]}}
    draggable={dragEnabled}
    onDragStart={() => {
      setDraggedElement(elementId);
    }}
    onDragEnd={() => {
      setDraggedElement(null);
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
        movePanelTo(elementId, areaId);
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
      className="dropzone"
      onDragEnter={() => {
        console.log('ENTER', elementId, hostId, panelMap[elementId]);
        timeoutRef.current.lastEntered = elementId;
        if (timeoutRef.current.element) {
          clearTimeout(timeoutRef.current.element);
          timeoutRef.current.element = null;
        }
        setOverElement([panelMap[elementId] || areaId, elementId]);
      }}
      onDragLeave={() => {
        console.log('LEAVE', elementId, hostId, areaId);
        timeoutRef.current.element && clearTimeout(timeoutRef.current.element);

        if (timeoutRef.current.lastEntered === elementId) {
          timeoutRef.current.element = setTimeout(() => {
            console.log('UNSET after', DRAG_LEAVE_TIMEOUT, 'ELEMENT', elementId, 'HOST', hostId, 'HOME', areaId);
            setOverElement(null);
          }, DRAG_LEAVE_TIMEOUT);
        }
      }}
    >

    </div>}

  </div>;
  return <DispatchedElementContext.Provider value={{areaId, elementId, hostId}}>
    {showHere ? wrappedElement : createPortal(wrappedElement, refs[hostId].current)}
  </DispatchedElementContext.Provider>;
}
