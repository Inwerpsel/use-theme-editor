import React from 'react';
import { use } from '../../state';
import { Tutorial } from '../../_unstable/Tutorial';

const id = 'responsive-size-controls';

export function FrameSizeSettings() {
  const [width, setWidth] = use.width();
  const [height, setHeight] = use.height();

  return <div className={id} id={id}>
    <span>Dimensions: <input
      type="number" onChange={ event => setWidth(parseInt(event.target.value)) } value={ width }
    /> x <input
      type="number" onChange={ event => setHeight(parseInt(event.target.value)) } value={ height }
    /></span>
    <Tutorial el={FrameSizeSettings}>Here you can manually input width and height.</Tutorial>
  </div>;
}
