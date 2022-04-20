import React, {memo, useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';
import {RadioControl} from '@wordpress/components';

const WrapRadioControl = ({screenOptions, width, height, setWidth, setHeight}) => <RadioControl
  options={screenOptions}
  selected={ [width, height].join() }
  onChange={ value => {
    const [newWidth, newHeight] = value.split(',');
    setWidth(parseInt(newWidth));
    setHeight(parseInt(newHeight));
  } }
/>;

export const MemoedRadioControl = memo(WrapRadioControl);

export function ScreenSwitcher() {
  const {
    screenOptions,
    width,
    height,
    setWidth,
    setHeight,
    isSimpleSizes,
    setIsSimpleSizes,
  } = useContext(ThemeEditorContext);
  return <div>
    <button
      onClick={() => {
        setIsSimpleSizes(!isSimpleSizes);
      }}
    >{ isSimpleSizes ? 'Show all sizes' : 'Show only simple sizes' }</button>
    <MemoedRadioControl {...{screenOptions, width, height, setWidth, setHeight}} />
  </div>;
}
