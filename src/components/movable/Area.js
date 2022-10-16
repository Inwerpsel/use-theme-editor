import React, {Children, useCallback, useContext, useRef} from 'react';
import {DispatchedElement} from './DispatchedElement';
import {AreasContext, DRAG_LEAVE_TIMEOUT} from './MovablePanels';

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
    {!!children && Children.map(children, (element, index) => {
      return <DispatchedElement {...{homeAreaId: id, element, index}}/>;
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
