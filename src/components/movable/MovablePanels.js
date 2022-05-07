import React, {createContext, Fragment, useEffect, useRef, useState} from 'react';
import {useLocalStorage} from '../../hooks/useLocalStorage';

export const AreasContext = createContext({});

const sortMap = ([, [otherHostIdA, otherOrderA]], [, [otherHostIdB, otherOrderB]]) => {
  if (otherHostIdA === otherHostIdB) {
    return otherOrderA > otherOrderB ? 1 : -1;
  }
  return otherHostIdA > otherHostIdB ? 1 : -1;
};

const updateElementLocation = (panelMap, id, overElementId, targetAreaId) => {
  if (!overElementId) {
    // Add behind last element.
    const otherOrders = Object.values(panelMap)
      .filter(([area]) => area === targetAreaId)
      .map(([, order]) => order);
    const lastAreaOrder = Math.max(...otherOrders);
    return {
      ...panelMap,
      [id]: [targetAreaId, lastAreaOrder + 1]
    };
  }

  const panelOrders = {};
  return Object.entries(panelMap).sort(sortMap).reduce(
    (
      newPanelMap,
      [otherElementId, [otherAreaId]],
    ) => {
      if (!panelOrders[otherAreaId]) {
        panelOrders[otherAreaId] = 0;
      }

      if (overElementId === otherElementId && targetAreaId === otherAreaId) {
        panelOrders[otherAreaId]++;
        newPanelMap[id] = [targetAreaId, panelOrders[otherAreaId]];
      }

      if (otherElementId === id) {
        return newPanelMap;
      }
      panelOrders[otherAreaId]++;
      const newOtherOrder = panelOrders[otherAreaId];

      return {
        ...newPanelMap,
        [otherElementId]: [otherAreaId, newOtherOrder],
      };
    },
    {},
  );
};

export function MovablePanels({children, dragEnabled}) {
  const areaRefs = useRef({});
  const origLocationsRef = useRef({});
  const [showMovers, setShowMovers] = useState(false);
  const [panelMap, setPanelMap] = useLocalStorage('panel-rearrangements', {});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHovered, setDrawerHovered] = useState(false);

  const movePanelTo = (id, targetAreaId, overElementId) => {
    if (overElement) {
      setOverElement(null);
    }

    console.log(`####### MOVING PANEL "${id}" TO "${targetAreaId}"`, 'map before', panelMap, JSON.stringify(panelMap, null, 2));

    if (!Object.values(panelMap).some(([otherAreaId]) => otherAreaId === targetAreaId)) {
      // Host not in map yet, create initial order for all element in target area.
      let i = 0;
      Object.entries(origLocationsRef.current).forEach(([element, area]) => {
        if (area === targetAreaId) {
          i += 1;
          panelMap[element] = [area, i];
        }
      });
    }

    const newPanelMap = updateElementLocation(panelMap, id, overElementId, targetAreaId);

    setPanelMap(newPanelMap);
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
      areaRefs,
      origLocationsRef,
      panelMap,
      movePanelTo,
      resetPanels,
      showMovers,
      setShowMovers,
      overElement, setOverElement,
      overArea, setOverArea,
      timeoutRef,
      draggedElement, setDraggedElement,
      dragEnabled,
      drawerOpen, setDrawerOpen,
      drawerHovered, setDrawerHovered,
      showDrawer: drawerOpen || drawerHovered
    }}>
      <div
        className={'movable-container ' + (draggedElement ? 'is-dragging' : '')}
      >
        {children}
      </div>
    </AreasContext.Provider>
  </Fragment>;
}

export const DRAG_LEAVE_TIMEOUT = 100;

