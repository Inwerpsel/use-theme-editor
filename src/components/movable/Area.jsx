import React, {Children, useCallback, useContext, useEffect, useLayoutEffect, useRef} from 'react';
import {MovableElement} from './MovableElement';
import {AreasContext, DRAG_LEAVE_TIMEOUT} from './MovablePanels';
import { HistoryNavigateContext, useResumableState } from '../../hooks/useResumableReducer';

function listen(element, event, listener) {
  element.addEventListener(event, listener);
  return () => {
    element.removeEventListener(event, listener);
  }
}

function RecordScrollPosition({containerRef, id}) {
  const { past: {length} } = useContext(HistoryNavigateContext);
  const [stored, setN] = useResumableState(`areaOffset#${id}`, [0, length]);
  const [n, storedLength] = stored.length ? stored : [stored, 0];

  useEffect(() => {
    if (storedLength === length) {
      // Also restore the position on first render.
      containerRef.current.scrollTo({
        top: n,
        left: 0,
      });
    }
  }, []);

  useEffect(() => {
    const start = performance.now();
    const listener = event => {
      if (performance.now() - start < 500) return;
      const raw = event.currentTarget.scrollTop;
      const value = raw < 10 ? 0 : Math.floor(raw);
      setN(
        [value, length],
        { skipHistory: true, appendOnly: true },
      );
    };
    return listen(containerRef.current, 'scroll', listener);
  }, []);
}

function RestoreScrollPosition({containerRef, id}) {
  const [stored] = useResumableState(`areaOffset#${id}`, [0]);
  const [n] = stored.length ? stored : [stored];

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: n,
      left: 0,
    });
    const timeout = setTimeout(() => {
      // Scroll a second time to account for slow UI.
      containerRef.current?.scrollTo({
        top: n,
        left: 0,
      });
    }, 500);
    return () => {
      clearTimeout(timeout);
    }
  }, [n]);
}

export let excludedArea;

export function setExcludedArea(id) {
  return excludedArea = id;
}

function TrackScrollOffset(props) {
  const { historyOffset } = useContext(HistoryNavigateContext);

  if (excludedArea === props.id) {
    return null;
  }
  return historyOffset === 0 ? <RecordScrollPosition {...props}/> : <RestoreScrollPosition {...props}/>;
}

export function Area({id, children = [], ...other}) {
  const {overArea, setOverArea, setOverElement, timeoutRef, areaRefs} = useContext(AreasContext);

  const isDragHovered = overArea === id;

  const ref = useRef();
  if (!areaRefs.current[id]) {
    areaRefs.current[id] = ref;
  }

  return <div
    style={{
      position: 'relative',
    }}
    {...other} {...{id, ref}}
    className={'area'}
  >
    <TrackScrollOffset {...{id, containerRef: ref}}/>
    {!!children && Children.map(children, (element, index) => {
      return <MovableElement {...{homeAreaId: id, element, index}}/>;
    })}
    <div
      className={'area-dropzone' + (isDragHovered ? ' drag-hovered' : '')}
      style={{
        order: 1000,
        background: 'rgba(167,238,227,0.22)',
        outline: '2px dashed grey',
        outlineOffset: '-8px',
      }}
      onDragEnter={useCallback(() => {
        if (timeoutRef.current.area) {
          clearTimeout(timeoutRef.current.area);
          timeoutRef.current.area = null;
        }
        timeoutRef.current.area && clearTimeout(timeoutRef.current.area);
        setOverArea(id);
        setOverElement(null);
        timeoutRef.current.lastEntered = id;
      }, [])}
      onDragLeave={useCallback(() => {
        if (timeoutRef.current.area) {
          clearTimeout(timeoutRef.current.area);
          timeoutRef.current.area = null;
        }

        timeoutRef.current.area = setTimeout(() => {
          if (timeoutRef.current.lastEntered === id) {
            // No other area was entered in the meanwhile.
            setOverArea(null);
          }
        }, DRAG_LEAVE_TIMEOUT);
      }, [])}
    />
  </div>;
}
