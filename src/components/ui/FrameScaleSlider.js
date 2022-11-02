import React, {memo, useContext} from 'react';
import {RangeControl} from '@wordpress/components';
import {ThemeEditorContext} from '../ThemeEditor';

const WrapRangeControl = ({scale, setScales, scales, width, height}) =>
  <RangeControl
    value={scale}
    onChange={value => {
      setScales({...scales, [`${width}x${height}`]: value});
    }}
    min={.2}
    max={1}
    step={.02}
    initialPosition={scale}
  />;

const MemoedRangeControl = memo(WrapRangeControl);

export function FrameScaleSlider() {
  const {
    scales, setScales,
    scale,
    width,
    height,
  } = useContext(ThemeEditorContext);

  return <div className={'frame-scale-slider'} style={{minWidth: '200px'}}>
    {/* <MemoedRangeControl {...{scales, setScales, scale, width, height}}/> */}
  </div>;
}
