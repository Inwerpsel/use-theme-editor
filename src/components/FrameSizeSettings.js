import React, {memo, useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';
import {RangeControl} from '@wordpress/components';


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

const id = 'responsive-size-controls';
export function FrameSizeSettings() {

  const {
    scales, setScales,
    scale,
    width, setWidth,
    height, setHeight,
  } = useContext(ThemeEditorContext);

  return <div className={id} id={id}>
    <MemoedRangeControl {...{scales, setScales, scale, width, height}}/>
    <span>Dimensions: <input
      type="number" onChange={ event => setWidth(parseInt(event.target.value)) } value={ width }
    /> x <input
      type="number" onChange={ event => setHeight(parseInt(event.target.value)) } value={ height }
    /></span>
  </div>;
}
