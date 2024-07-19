import React, { useContext } from 'react';
import { use, get } from '../state';
import {ThemeEditorContext} from './ThemeEditor';
import { Tutorial } from '../_unstable/Tutorial';

const wrapperMargin = 16;

export const ResizableFrame = props => {
  const {
    src,
  } = props;

  const {
    frameRef,
  } = useContext(ThemeEditorContext);

  const [width, setWidth] = use.width();
  const [height, setHeight] = use.height();
  const scale = get.scales[`${width}x${height}`] || 1;

  return <div
    style={{ overflow: 'hidden' }}
    className='responsive-frame-outer-container'
  >
    <div
      className='responsive-frame-container'
      onMouseMove={ (event) => {
        if (event.buttons !== 1 || event.currentTarget.className !== 'responsive-frame-container') {
          return;
        }
        const newHeight = parseInt(event.currentTarget.style.height.replace('px', '')) - wrapperMargin;
        const newWidth = parseInt(event.currentTarget.style.width.replace('px', '')) - wrapperMargin;
        if (isNaN(newHeight) || isNaN(newWidth)) {
          // Quick fix to prevent tutorial buttons from triggering this shitty old code in some cases.
          return;
        }
        setHeight(newHeight);
        setWidth(newWidth);
      }}
      style={ {
        transform: `scale(${scale})`,
        resize: 'both',
        minWidth: '200px',
        // Quick fix, calc doesn't really make sense here.
        width: `max(calc(${ wrapperMargin + parseInt(width) }px * ${scale}), ${ wrapperMargin + parseInt(width) }px)`,
        minHeight: '200px',
        height: `${ wrapperMargin + parseInt(height) }px`,
        overflow: 'hidden',
        padding: '0',
        boxSizing: 'border-box',
      } }
    >
      {tutorial}
      <iframe
        className='responsive-frame'
        ref={frameRef}
        { ...{ src, width: parseInt(width), height: parseInt(height) } }
      />
    </div>
  </div>;
};

const tutorial = (
  <Tutorial
    el={ResizableFrame}
    tasks={[
      (get) => ['Click any element on the page', get.inspectedIndex !== -1],
    ]}
  >
    Select an element here to see all its styles.
  </Tutorial>
);