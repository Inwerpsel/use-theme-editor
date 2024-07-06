import React from 'react';
import { use } from '../../state';
import { Tutorial } from '../../_unstable/Tutorial';

const id = 'responsive-size-controls';

export function FrameSizeSettings() {
  const [width, setWidth] = use.width();
  const [height, setHeight] = use.height();

  return <div className={id} id={id}>
    <span><input
      type="number" onChange={ event => setWidth(parseInt(event.target.value)) } value={ width }
    /> x <input
      type="number" onChange={ event => setHeight(parseInt(event.target.value)) } value={ height }
    /></span>
    <Tutorial el={FrameSizeSettings}>Enter precise screen dimensions here if necessary.</Tutorial>
  </div>;
}

FrameSizeSettings.fName = 'FrameSizeSettings';