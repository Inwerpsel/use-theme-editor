import React, {Children, useCallback, useContext, useEffect, useLayoutEffect, useRef} from 'react';
import {MovableElement} from './MovableElement';
import {AreasContext, DRAG_LEAVE_TIMEOUT} from './MovablePanels';
import { HistoryNavigateContext, useResumableState } from '../../hooks/useResumableReducer';

function RecordScrollPosition({containerRef, id}) {
  const [n, setN] = useResumableState(`areaOffset#${id}`, 0);

  useEffect(() => {
    // Also restore the position on first render.
    n > 0 && containerRef.current?.scrollTo({
      top: n,
      left: 0,
    });
    const listener = event => {
      const raw = event.currentTarget.scrollTop;
      const value = raw < 10 ? 0 : Math.floor(raw);
      setN(
        value,
        { skipHistory: true, appendOnly: true },
      );
    };
    containerRef.current?.addEventListener('scroll', listener);
    return () => {
      containerRef.current?.removeEventListener('scroll', listener);
    }
  }, []);
}

function RestoreScrollPosition({containerRef, id}) {
  const [n] = useResumableState(`areaOffset#${id}`, 0);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: n,
      left: 0,
      behavior: 'smooth',
    });
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
