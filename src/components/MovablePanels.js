import React, {createContext, useContext, useRef, useState, Children, useEffect, Fragment} from 'react';
import {createPortal} from 'react-dom';
import {SelectControl} from '@wordpress/components';
import {valuesAsLabels} from './TypedControl';
import {useLocalStorage} from '../hooks/useLocalStorage';
import {Checkbox} from './Checkbox';
import {RenderInfo} from './RenderInfo';

const refs = {};

const AreasContext = createContext({});

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

export function MoveControls() {
  const {
    panelMap,
    resetPanels,
    showMovers, setShowMovers,
    dragEnabled, setDragEnabled,
  } = useContext(AreasContext);

  return <div>
    <Checkbox controls={[showMovers, setShowMovers]}>
      Move elements
    </Checkbox>
    <Checkbox controls={[dragEnabled, setDragEnabled]}>
      Drag elements
    </Checkbox>
    {Object.keys(panelMap).length > 0 && <button onClick={resetPanels}>reset</button>}
  </div>;
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

const DispatchedElementContext = createContext({});

const DRAG_LEAVE_TIMEOUT = 100;

function getId(element) {
  if (['div', 'p', 'span', 'ul', 'li'].includes(element.type)) {
    // Use ID or first class.
    return element.props.id || element.props.className?.split(' ')[0];
  }

  // Default to the element's type, which is assumed to be unique.
  // Use the
  return `${element.type.name}#${element.id || ''}`;
}

function DispatchedElement({areaId, element, index}) {
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

  const withSwitcher = <div
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
    {showHere ? withSwitcher : createPortal(withSwitcher, refs[hostId].current)}
  </DispatchedElementContext.Provider>;
}

export function Area({id, children = [], ...other}) {
  const {setOverArea, timeoutRef} = useContext(AreasContext);

  const ref = useRef();
  if (!refs[id]) {
    refs[id] = ref;
  }

  return <div
    style={{
      position: 'relative',
    }}
    {...other} {...{id, ref}}
    className={'area'}
  >
    {!!children && Children.map(children, (element, index) => {
      return <DispatchedElement {...{areaId: id, element, index}}/>;
    })}
    <div
      className={'area-dropzone'}
      style={{
        order: 1,
        background: 'rgba(167,238,227,0.22)',
        outline: '2px dashed grey',
        outlineOffset: '-8px',
      }}
      onDragEnter={() => {
        if (timeoutRef.current.area) {
          clearTimeout(timeoutRef.current.area);
          timeoutRef.current.area = null;
        }
        timeoutRef.current.area && clearTimeout(timeoutRef.current.area);
        setOverArea(id);
        timeoutRef.current.lastEntered = id;
      }}
      onDragLeave={() => {
        if (timeoutRef.current.area) {
          clearTimeout(timeoutRef.current.area);
          timeoutRef.current.area = null;
        }
        if (timeoutRef.current.lastEntered === id) {
          timeoutRef.current.area = setTimeout(() => {
            setOverArea(null);
          }, DRAG_LEAVE_TIMEOUT);
        }
      }}
    />

  </div>;
}

function AreaSwitcher() {
  const {panelMap, movePanelTo} = useContext(AreasContext);
  const {areaId, elementId} = useContext(DispatchedElementContext);
  const currentArea = panelMap[elementId] || areaId;

  return <div
    className={'area-switcher'}
    style={{position: 'absolute'}}
  >
    <SelectControl
      style={{
        background: !panelMap[elementId] ? 'white' : 'lightyellow',
      }}
      value={currentArea}
      options={Object.keys(refs).map(valuesAsLabels).map(({value, label}) => ({
        value,
        label: value === areaId && value !== currentArea ? `${label} (default)` : label,
      }))}
      onChange={value => {
        movePanelTo(elementId, value === areaId ? null : value);
      }}
    />
    {!!panelMap[elementId] && <button onClick={() => {
      movePanelTo(elementId, null);
    }}>reset</button>}

  </div>;
}
