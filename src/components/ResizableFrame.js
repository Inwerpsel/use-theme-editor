import React, { useContext } from 'react';
import { useHeight, useWidth } from '../state';
import {ThemeEditorContext} from './ThemeEditor';

const wrapperMargin = 28;

export const ResizableFrame = props => {
  const {
    src,
  } = props;

  const {
    frameRef,
    scale,
  } = useContext(ThemeEditorContext);

  const [width, setWidth] = useWidth();
  const [height, setHeight] = useHeight();

  return <div
      style={{
        maxWidth: `${32 + wrapperMargin + scale * parseInt(width)}px`,
        overflow: 'hidden',
      }}
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
        setHeight(newHeight);
        setWidth(newWidth);
      }}
      style={ {
        transform: `scale(${scale})`,
        resize: 'both',
        minWidth: '200px',
        width: `${ wrapperMargin + parseInt(width) }px`,
        minHeight: '200px',
        height: `${ wrapperMargin + parseInt(height) }px`,
        overflow: 'hidden',
        padding: '0',
        boxSizing: 'border-box',
      } }
    >
      <iframe
        className='responsive-frame'
        ref={frameRef}
        { ...{ src, width: parseInt(width) + 12, height: parseInt(height) + 12 } }
      />
    </div>
  </div>;
};
