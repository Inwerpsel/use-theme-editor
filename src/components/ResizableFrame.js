import React, {Fragment, useContext, useEffect} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

const wrapperMargin = 28;

export const ResizableFrame = props => {
  const {
    src,
  } = props;

  const {
    frameRef,
    width,
    setWidth,
    height,
    setHeight,
    scale,
  } = useContext(ThemeEditorContext);

  useEffect(() => {
    const orig = document.body.style.maxHeight;
    const scrollPosition = window.scrollY;
    document.body.style.top = `-${ scrollPosition }px`;
    document.body.style.postition = 'sticky';
    document.body.style.maxHeight = '100vh';

    return () => {
      document.body.style.maxHeight = orig;
      document.body.style.position = 'static';
      document.body.style.top = '0';
      window.scrollTo(0, scrollPosition);
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto'
      });

    };
  }, []);

  return <Fragment>
    <div
      className='responsive-frame-container'
      onMouseMove={ (event) => {
        if (event.buttons !== 1 || event.currentTarget.className !== 'responsive-frame-container') {
          return;
        }
        const newHeight = parseInt(event.currentTarget.style.height.replace('px', ''));
        const newWidth = parseInt(event.currentTarget.style.width.replace('px', ''));
        setHeight(newHeight - wrapperMargin);
        setWidth(newWidth - wrapperMargin);
      } }
      style={ {
        transform: `scale(${scale})`,
        resize: 'both',
        minWidth: '200px',
        width: `${ wrapperMargin + parseInt(width) }px`,
        minHeight: '200px',
        height: `${ wrapperMargin + parseInt(height) }px`,
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
  </Fragment>;
};
