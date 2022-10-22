import React, {Fragment, memo, useContext} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {RadioControl, SelectControl} from '@wordpress/components';
import { useCompactSetting } from '../movable/DispatchedElement';
import { CompactModeButton } from '../inspector/CompactModeButton';

// RadioControl needs to be replaced as perf is terrible. Hence memo.
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

  const [isCompact, setIsCompact] = useCompactSetting();

  const comp = isCompact ? (
    <SelectControl
      // Make it match with of select control. Might put button at start instead.
      style={{ marginRight: '-9px' }}
      options={screenOptions}
      value={`${width},${height}`}
      onChange={(value) => {
        const [newWidth, newHeight] = value.split(',');
        setWidth(parseInt(newWidth));
        setHeight(parseInt(newHeight));
      }}
    />
  ) : (
    <Fragment>
      <button
        onClick={() => {
          setIsSimpleSizes(!isSimpleSizes);
        }}
      >
        {isSimpleSizes ? 'Show all sizes' : 'Show only simple sizes'}
      </button>
      <MemoedRadioControl
        {...{ screenOptions, width, height, setWidth, setHeight }}
      />
    </Fragment>
  );


  return <div>
    <CompactModeButton {...{isCompact, setIsCompact}}/>
    {comp}
  </div>;
}
