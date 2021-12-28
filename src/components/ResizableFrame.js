import {  createPortal } from 'react-dom';
import { Fragment, useEffect } from 'react';
import { RadioControl, RangeControl } from '@wordpress/components';
import { useLocalStorage } from '../hooks/useLocalStorage';

const wrapperMargin = 28;

export const ResizableFrame = props => {
  const {
    src,
    frameRef,
    width,
    setWidth,
    height,
    setHeight,
    setIsSimpleSizes,
    isSimpleSizes,
    screenOptions,
  } = props;

  const [
    scales,
    setScales,
  ] = useLocalStorage('responsive-scales', {});
  const scale = scales[`${width}x${height}`] || 1;

  useEffect(() => {
    const orig = document.body.style.maxHeight;
    const scrollPosition = window.pageYOffset;
    document.body.style.top = `-${ scrollPosition }px`;
    document.body.style.postition = 'sticky';
    document.body.style.maxHeight = '100vh';

    return () => {
      document.body.style.maxHeight = orig;
      document.body.style.position = 'static';
      document.body.style.top = 0;
      window.scrollTo(0, scrollPosition);
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto'
      });

    };
  }, []);

  return createPortal(<Fragment>
    <div
      className="responsive-overlay"
      style={ {
        zIndex: 999,
        background: 'grey',
        opacity: 0.99,
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      } }
    />
    <div
      className="responsive-size-controls"
      style={ {
        position: 'fixed',
        zIndex: 1000,
      } }
    >
      <RangeControl
        value={scale}
        onChange={ value => {
          setScales({...scales, [`${width}x${height}`]: value});
        } }
        min={.2}
        max={1}
        step={.02}
        initialPosition={scale}
      />
      <span>Dimensions: <input
        type="number" onChange={ event => setWidth(parseInt(event.target.value)) } value={ width }
      /> x <input
        type="number" onChange={ event => setHeight(parseInt(event.target.value)) } value={ height }
      /></span>
    </div>

    <div style={{
      zIndex: 1001,
      position: 'fixed',
      top: '20px',
      right: '100px',
    }}>
      <button
        onClick={() => {
          setIsSimpleSizes(!isSimpleSizes);
        }}
      >{ isSimpleSizes ? 'Show all sizes' : 'Show only simple sizes' }</button>
      <RadioControl
        options={screenOptions}
        selected={ [width, height].join() }
        onChange={ value => {
          const [newWidth, newHeight] = value.split(',');
          setWidth(parseInt(newWidth));
          setHeight(parseInt(newHeight));
        } }
      />
    </div>

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
        position: 'fixed',
        top: '100px',
        zIndex: 1000,
        resize: 'both',
        overflow: 'scroll',
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
  </Fragment>, document.body);
};
