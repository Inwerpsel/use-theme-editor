import React, {Children, useContext, useRef} from 'react';
import {DispatchedElement} from './DispatchedElement';
import {AreasContext, DRAG_LEAVE_TIMEOUT, refs} from './MovablePanels';

export function Area({id, children = [], ...other}) {
  const {overArea, setOverArea, timeoutRef} = useContext(AreasContext);

  const isDragHovered = overArea === id;
  console.log(id, isDragHovered);

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
