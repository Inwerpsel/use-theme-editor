import React, {Children, useContext, useRef} from 'react';
import {DispatchedElement} from './DispatchedElement';
import {AreasContext, DRAG_LEAVE_TIMEOUT} from './MovablePanels';

export function Area({id, children = [], ...other}) {
  const {overArea, setOverArea, timeoutRef, areaRefs} = useContext(AreasContext);

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
