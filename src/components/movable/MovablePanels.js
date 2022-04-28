import React, {createContext, Fragment, useEffect, useRef, useState} from 'react';
import {useLocalStorage} from '../../hooks/useLocalStorage';

export const refs = {};

export const AreasContext = createContext({});

const sortMap = ([, [otherHostIdA, otherOrderA]], [, [otherHostIdB, otherOrderB]]) => {
  if (otherHostIdA === otherHostIdB) {
    return otherOrderA > otherOrderB ? 1 : -1;
  }
  return otherHostIdA > otherHostIdB ? 1 : -1;
};

export function MovablePanels({children}) {
  const [showMovers, setShowMovers] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [panelMap, setPanelMap] = useLocalStorage('panel-rearrangements', {});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHovered, setDrawerHovered] = useState(false);

  const movePanelTo = (id, targetHostId, overElementId) => {
    if (overElement) {
      setOverElement(null);
    }

    console.log(`####### MOVING PANEL "${id}" TO "${targetHostId}"`, 'map before', panelMap, JSON.stringify(panelMap, null, 2));

    let added = false;
    const panelOrders = {};
    const newPanelMap = Object.entries(panelMap).sort(sortMap).reduce( (newPanelMap, [otherElementId, [otherHostId, otherOrder]]) => {
      if (!panelOrders[otherHostId]) {
        panelOrders[otherHostId] = 0;
      }

      if (overElementId === otherElementId && targetHostId === otherHostId) {
        panelOrders[otherHostId]++;
        newPanelMap[id] = [targetHostId, panelOrders[otherHostId]];
        added = true;
      }

      if (otherElementId === id) {
        return newPanelMap;
      }
      panelOrders[otherHostId]++;
      const newOtherOrder = panelOrders[otherHostId];

      return {
        ...newPanelMap,
        [otherElementId]: [otherHostId, newOtherOrder],
      };
    }, {});

    setPanelMap(added ? newPanelMap : {
      ...panelMap,
      [id]: [targetHostId, 100],
    });
  };
  const resetPanels = () => {
    setPanelMap({});
  };

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
      overElement, setOverElement,
      overArea, setOverArea,
      timeoutRef,
      draggedElement, setDraggedElement,
      dragEnabled, setDragEnabled,
      drawerOpen, setDrawerOpen,
      drawerHovered, setDrawerHovered,
      showDrawer: drawerOpen || drawerHovered
    }}>
      <div
        className={'movable-container ' + (draggedElement ? 'dragging-element' : '')}
      >
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

