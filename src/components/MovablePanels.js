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

export function MovablePanels({panelMap,movePanelTo, children, showMovers}) {
  const [order, setOrder] = useState({});
  const [overElement, setOverElement] = useState(null);
  const [, refresh] = useState(0);
  // Do a refresh after first render so that each panel switcher has the right targets.
  useEffect(() => {
    refresh(1);
  }, []);

  return <AreasContext.Provider value={{
    panelMap,
    movePanelTo,
    showMovers,
    order, setOrder,
    overElement, setOverElement,
  }}>
    <div style={{width: '100%'}}>
      <RenderInfo/>
      {children}
    </div>
  </AreasContext.Provider>;
}

const DispatchedElementContext = createContext({});

const DRAG_LEAVE_TIMEOUT = 50;

function DispatchedElement({areaId, element, index}) {
  const {panelMap, showMovers, movePanelTo, order, setOrder, overElement, setOverElement} = useContext(AreasContext);
  const elementId = `${areaId}~~${index}`;
  const hostId = panelMap[elementId];
  const showHere = !hostId || !refs[hostId]?.current;
  const timeoutRef = useRef(null);

  const withSwitcher = <div
    style={{position: 'relative', order: !order[hostId] ? '' : order[hostId][elementId]}}
    draggable
    onDragEnter={() => {
      console.log('DRAG OVER', elementId, hostId);
      timeoutRef.current && clearTimeout(timeoutRef.current);
      setOverElement([panelMap[elementId] || areaId, elementId]);
    }}
    onDragLeave={() => {
      console.log('DRAG LEAVE', elementId, hostId, areaId);
      timeoutRef.current = setTimeout(() => {
        setOverElement(null);
      }, DRAG_LEAVE_TIMEOUT);
    }}
    onDragEnd={() => {
      console.log('DRAG END', elementId);
      if (overElement) {
        const [areaId, overElementId] = overElement;
        movePanelTo(elementId, areaId);
        setOverElement(null);
      }
    }}
  >
    {element}
    <RenderInfo/>
    {showMovers && <AreaSwitcher/>}
  </div>;
  return <DispatchedElementContext.Provider value={{areaId, elementId, hostId}}>
    {showHere ? withSwitcher : createPortal(withSwitcher, refs[hostId].current)}
  </DispatchedElementContext.Provider>;
}

function Area({id, children = [], ...other}) {
  const {setOverElement} = useContext(AreasContext);

  const ref = useRef();
  if (!refs[id]) {
    refs[id] = ref;
  }
  const timeoutRef = useRef(null);

  return <div
    {...other} {...{id, ref}}
    className={'area'}
    onDragEnter={() => {
      console.log('DRAG ENTER AREA', id);
      timeoutRef.current && clearTimeout(timeoutRef.current);
      setOverElement([id]);
    }}
    onDragLeave={() => {
      console.log('DRAG LEAVE AREA', id);
      timeoutRef.current = setTimeout(() => {
        setOverElement(null);
      }, DRAG_LEAVE_TIMEOUT);
    }}
  >
    {!!children && Children.map(children, (element, index) => {
      return <DispatchedElement {...{areaId: id, element, index}}/>;
    })}
  </div>;
}

function useMovablePanels() {
  const [showMovers, setShowMovers] = useState(false);
  const [panelMap, setPanelMap] = useLocalStorage('panel-rearrangements', {});

  return {
    showMovers, setShowMovers,
    panelMap,
    movePanelTo: (id, hostId) => {
      setPanelMap({...panelMap, [id]: hostId});
    },
    resetPanels: () => {
      setPanelMap({});
    }
  };
}

function AreaSwitcher() {
  const {panelMap, movePanelTo} = useContext(AreasContext);
  const {areaId, elementId} = useContext(DispatchedElementContext);

  return <div
    className={'area-switcher'}
    style={{position: 'absolute'}}
  >
    <SelectControl
      value={panelMap[elementId] || areaId}
      options={Object.keys(refs).map(valuesAsLabels)}
      onChange={value => {
        movePanelTo(elementId, value === areaId ? null : value);
      }}
    />
  </div>;
}

export function Example() {
  const {
    panelMap, movePanelTo, resetPanels, showMovers, setShowMovers,
  } = useMovablePanels();

  return <Fragment>
    <Checkbox controls={[showMovers, setShowMovers]}>
      Move elements
    </Checkbox>
    {Object.keys(panelMap).length > 0 && <button onClick={resetPanels}>reset</button>}

    <MovablePanels {...{panelMap, movePanelTo, showMovers}}>
      <Area id='area-top'>
        <TestPanel2/>
        <TestPanel2/>
      </Area>
      <div style={{display: 'flex', justifyContent: 'stretch'}}>
        <Area id='area-left'>
          <div>Move me please! </div>
          <span>FOOBAR</span>
          <button className="btn btn-primary">I'm a primary button.</button>
        </Area>
        <div className={'content'} style={{flexGrow: 1}}>CONTENT</div>
        <Area id='area-right'>
          <TestPanel>
            <div>
              <button>
                Also move me, chaps!
              </button>
            </div>
          </TestPanel>
        </Area>
      </div>
      <Area id='area-bottom'/>
    </MovablePanels>
  </Fragment>;
}
