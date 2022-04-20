import React, {createContext, Fragment, useEffect, useRef, useState} from 'react';
import {useLocalStorage} from '../../hooks/useLocalStorage';
import {RenderInfo} from '../RenderInfo';

export const refs = {};

export const AreasContext = createContext({});

function useMovablePanels() {
  const [showMovers, setShowMovers] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(true);
  const [panelMap, setPanelMap] = useLocalStorage('panel-rearrangements', {});

  return {
    showMovers, setShowMovers,
    dragEnabled, setDragEnabled,
    panelMap,
    movePanelTo: (id, hostId) => {
      console.log(`####### MOVING PANEL "${id}" TO "${hostId}"`, panelMap);
      setPanelMap({...panelMap, [id]: hostId});
    },
    resetPanels: () => {
      setPanelMap({});
    }
  };
}

export function MovablePanels({children}) {
  const {
    panelMap, movePanelTo, resetPanels, showMovers, setShowMovers, dragEnabled, setDragEnabled,
  } = useMovablePanels();
  const [order, setOrder] = useState({});
  const timeoutRef = useRef({element: null, area: null});
  const [overElement, setOverElement] = useState(null);
  const [overArea, setOverArea] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [, refresh] = useState(0);
  // Do a refresh after first render so that each panel switcher has the right targets.
  useEffect(() => {
    refresh(1);
  }, []);

  return <Fragment>
    <AreasContext.Provider value={{
      panelMap,
      movePanelTo,
      resetPanels,
      showMovers,
      setShowMovers,
      order, setOrder,
      overElement, setOverElement,
      overArea, setOverArea,
      timeoutRef,
      draggedElement, setDraggedElement,
      dragEnabled, setDragEnabled,
    }}>
      <div
        className={'movable-container ' + (draggedElement ? 'dragging-element' : '')}
      >
        <RenderInfo/>
        {children}
      </div>
    </AreasContext.Provider>
  </Fragment>;
}

export const DRAG_LEAVE_TIMEOUT = 100;

export function getId(element) {
  if (['div', 'p', 'span', 'ul', 'li'].includes(element.type)) {
    // Use ID or first class.
    return element.props.id || element.props.className?.split(' ')[0];
  }

  // Default to the element's type, which is assumed to be unique.
  // Use the
  return `${element.type.name}#${element.id || ''}`;
}

