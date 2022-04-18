import React, {createContext, useContext, useRef, useState, Children, useEffect, Fragment} from 'react';
import {createPortal} from 'react-dom';
import {SelectControl} from '@wordpress/components';
import {valuesAsLabels} from './TypedControl';
import {useLocalStorage} from '../hooks/useLocalStorage';
import {Checkbox} from './Checkbox';
import {RenderInfo} from './RenderInfo';

const refs = {};

const TestPanel = ({children}) => <div>
  TEST
  {children}
</div>;
const TestPanel2 = () => <div style={{background: 'lightblue'}}>test 2</div>;

const AreasContext = createContext({});

function useMovablePanels() {
  const [showMovers, setShowMovers] = useState(false);
  const [panelMap, setPanelMap] = useLocalStorage('panel-rearrangements', {});

  return {
    showMovers, setShowMovers,
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
    panelMap, movePanelTo, resetPanels, showMovers, setShowMovers,
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
    <Checkbox controls={[showMovers, setShowMovers]}>
      Move elements
    </Checkbox>
    {Object.keys(panelMap).length > 0 && <button onClick={resetPanels}>reset</button>}
    <AreasContext.Provider value={{
      panelMap,
      movePanelTo,
      showMovers,
      order, setOrder,
      overElement, setOverElement,
      overArea, setOverArea,
      timeoutRef,
      draggedElement, setDraggedElement
    }}>
      <div
        className={draggedElement ? 'dragging-element' : ''}
        // className={'dragging-element'}
        style={{width: '100%'}}
      >
        <RenderInfo/>
        {children}
      </div>
    </AreasContext.Provider>
  </Fragment>;
}

const DispatchedElementContext = createContext({});

const DRAG_LEAVE_TIMEOUT = 100;

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
    draggedElement, setDraggedElement
  } = useContext(AreasContext);
  const elementId = `${areaId}~~${index}`;
  const hostId = panelMap[elementId];
  const showHere = !hostId || !refs[hostId]?.current;

  const withSwitcher = <div
    style={{position: 'relative', order: !order[hostId] ? '' : order[hostId][elementId]}}
    draggable
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

function Area({id, children = [], ...other}) {
  const {setOverArea, timeoutRef, draggedElement} = useContext(AreasContext);

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

export function Example() {

  return <Fragment>

    <MovablePanels>
      <Area id='area-top'>
        <TestPanel2/>
        <TestPanel2/>
      </Area>
      <div style={{display: 'flex', justifyContent: 'stretch'}}>
        <Area id='area-left'>
          <div>
            <label>
              Move me please!
            </label>
            <br/>
            I beg you
            <br/>
            Prease
          </div>
          <span>FOOBAR</span>
          <button className="btn btn-primary">I am a primary<RenderInfo/></button>
          <button className="btn btn-secondary">I am a secondary</button>
          <button className="btn btn-danger">I am a danger</button>
        </Area>
        <div className={'content'} style={{flexGrow: 1}}>CONTENT</div>
        <Area id='area-right'>
          <TestPanel>
            <div>
              <button>
                Also move me, chaps! <br/><RenderInfo/>
              </button>
            </div>
          </TestPanel>
        </Area>
      </div>
      <Area id='area-bottom'>
        <div>
          <h2>my areas</h2>
          <p>before a</p>
          {/*<MovablePanels>*/}
          {/*  <Area id={'bottom-a'}><div><button>a</button></div></Area>*/}
          {/*  <p>before b</p>*/}
          {/*  <Area id={'bottom-b'}><div><button>b</button></div></Area>*/}
          {/*  <p>before c</p>*/}
          {/*  <Area id={'bottom-c'}><div><button>c</button></div></Area>*/}
          {/*  <p>after c</p>*/}
          {/*</MovablePanels>*/}
        </div>
      </Area>
    </MovablePanels>
  </Fragment>;
}
