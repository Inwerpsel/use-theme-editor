import React, {createContext, useCallback, useLayoutEffect, useRef, useState} from 'react';
import { useInsertionEffect } from 'react';
import {useLocalStorage} from '../../hooks/useLocalStorage';
import { useResumableState } from '../../hooks/useResumableReducer';

export const AreasContext = createContext({});

const byHostAndOrder = ([, [hostIdA, orderA]], [, [hostIdB, orderB]]) => {
  if (hostIdA === hostIdB) {
    return orderA > orderB ? 1 : -1;
  }
  return hostIdA > hostIdB ? 1 : -1;
};

const updateElementLocation = (panelMap, id, targetAreaId, targetElementId) => {
  if (!targetElementId) {
    const otherOrders = Object.values(panelMap)
      .filter(([area]) => area === targetAreaId)
      .map(([, order]) => order);
    const lastAreaOrder = Math.max(...otherOrders);
    // Add behind last element in the area.
    return {
      ...panelMap,
      [id]: [targetAreaId, lastAreaOrder + 1]
    };
  }

  const panelOrders = {};

  return Object.entries(panelMap).sort(byHostAndOrder).reduce(
    (
      newPanelMap,
      [otherElementId, [otherAreaId]],
    ) => {
      if (!panelOrders[otherAreaId]) {
        panelOrders[otherAreaId] = 0;
      }

      if (targetElementId === otherElementId && targetAreaId === otherAreaId) {
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

export const defaultHooks = {
  showMovers() {
    return useState(false);
  },
  drawerOpen() {
    return useResumableState(false, 'drawer-open');
  },
  dragEnabled() {
    return useLocalStorage('drag-on', false);
  }
};

export function MovablePanels({stateHook, children, hooks = defaultHooks}) {
  const areaRefs = useRef({});
  const origLocationsRef = useRef({});

  const [overElement, setOverElement] = useState(null);
  const [overArea, setOverArea] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [panelMap, setPanelMap] = stateHook();

  const [showMovers, setShowMovers] = hooks.showMovers();
  const [drawerOpen, setDrawerOpen] = hooks.drawerOpen();
  const [dragEnabled, setDragEnabled] = hooks.dragEnabled();

  const movePanelTo = useCallback((id, areaId, overElementId) => {
    setOverElement(null);

    // Create initial area order if the area wasn't used before.
    if (!Object.values(panelMap).some(([otherAreaId]) => otherAreaId === areaId)) {
      let i = 0;
      Object.entries(origLocationsRef.current).forEach(([element, area]) => {
        if (area === areaId && !(element in panelMap)) {
          panelMap[element] = [area, i];
          i += 1;
        }
      });
    }

    const newPanelMap = updateElementLocation(panelMap, id, areaId, overElementId);

    setPanelMap(newPanelMap);
  }, [panelMap]);

  // A 3 pass render is needed. Should not involve overhead.
  // Contained elements won't get rendered more than once.
  const [areasRendered, setAreasRendered] = useState(false);
  const [elementsRendered, setElementsRendered] = useState(false);

  useLayoutEffect(() => {
    // After first pass all initial areas should have been rendered, allowing the second pass
    // to render elements in places that didn't exist before.
    if (!areasRendered) {
      setAreasRendered(true);
      return;
    }

    setElementsRendered(true);
  }, [areasRendered]);

  useInsertionEffect(() => {
    // Reorder the elements according to their `order` property.
    // Elements are assumed to be properly ordered by the panelmap with no duplicate indexes.
    // Should work as React also doesn't care multiple elements are portaling to the same element.
    //
    // For now I keep the CSS order as it guarantees the elements are immediately "rendered" in the
    // right place. It only affects the case where an inner layout effect would read calculated
    // style, like the scroll offset.
    if (!elementsRendered) {
      return;
    }

    // console.time('Rectify order');

    // Naive algorithm for moving elements to the right position.
    // Performs poorly when moving down, it moves all other elements
    // individually above the moved element.
    // The impact of this (around 2ms for moving 20 places down) is still rather limited
    // as it only occurs when moving an element across a large distance (and down).
    // Moving up is always 1 operation.
    // Moving between completely different arrangements is also accounted for.
    for (const {current: areaEl} of Object.values(areaRefs.current)) {
      // Order should be on all elements, or none if no element was moved into the area.
      // Hence we only need to check the first.
      if (areaEl.children[0]?.style.order === '') {
        continue;
      }
      const prevOrderIndexes = [];

      for (const el of areaEl.children) {
        const order = parseInt(el.style.order);
        let spliceIndex, spliceEl;

        let index = 0;
        for (const [prevOrder, prevEl] of prevOrderIndexes) {
          if (order < prevOrder) {
            spliceIndex = index; 
            spliceEl = prevEl;
            break;
          }
          index++;
        }

        if (!spliceEl) {
          prevOrderIndexes.push([order, el]);
        } else {
          prevOrderIndexes.splice(spliceIndex, 0, [order, el]);
          areaEl.insertBefore(el, spliceEl);
          const focusedEl = el.querySelector(':focus');
          if (focusedEl) {
            // If you drag an element downwards, it won't be moved itself, instead
            // other elements will be moved before it.
            // If you drag upwards, the element itself is moved,
            // causing it to lose focus, unlike the downward direction.
            // Hence, check for a focused element and give it focus again after moving.
            // This can only happen when starting a drag from within a focusable element.
            focusedEl.focus();
          }
          // console.log('Moving Element', el, 'before', spliceEl);
        }
      }

    }

    // console.timeEnd('Rectify order');
  }, [JSON.stringify(panelMap), elementsRendered, drawerOpen]);

  const resetPanels = () => {
    setPanelMap({});
  };

  const timeoutRef = useRef({element: null, area: null});
  // Have all initial areas been rendered?

  // Trigger sync render, before which areaRefs should be fully populated by the first pass.
  // This should incur no overhead, as all elements that don't need the 
  // second pass are immediately bailed out of by React.
  useLayoutEffect(() => {
    setAreasRendered(true);
  }, []);

  return <AreasContext.Provider value={{
      areaRefs,
      origLocationsRef,
      panelMap, setPanelMap,
      movePanelTo,
      resetPanels,
      showMovers, setShowMovers,
      overElement, setOverElement,
      overArea, setOverArea,
      timeoutRef,
      draggedElement, setDraggedElement,
      dragEnabled, setDragEnabled,
      drawerOpen, setDrawerOpen,
  }}>
    <div
      className={'movable-container' + (draggedElement ? ' is-dragging' : '')}
    >
      {children}
    </div>
  </AreasContext.Provider>;
}

// Wait for some time before actually considering the drag leave event as
// having happened. Not sure why I did this really.
export const DRAG_LEAVE_TIMEOUT = 10;
