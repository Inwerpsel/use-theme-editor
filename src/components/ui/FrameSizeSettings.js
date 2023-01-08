import React from 'react';
import { use } from '../../state';

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
  </div>;
}
