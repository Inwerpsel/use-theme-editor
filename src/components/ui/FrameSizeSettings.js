import React, {useContext} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
const id = 'responsive-size-controls';
export function FrameSizeSettings() {

  const {
    width, setWidth,
    height, setHeight,
  } = useContext(ThemeEditorContext);

  return <div className={id} id={id}>
    <span>Dimensions: <input
      type="number" onChange={ event => setWidth(parseInt(event.target.value)) } value={ width }
    /> x <input
      type="number" onChange={ event => setHeight(parseInt(event.target.value)) } value={ height }
    /></span>
  </div>;
}
