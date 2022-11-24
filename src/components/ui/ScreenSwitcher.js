import React, { Fragment } from 'react';
import { useCompactSetting } from '../movable/DispatchedElement';
import { CompactModeButton } from '../inspector/CompactModeButton';
import { SelectControl } from '../controls/SelectControl';
import { RadioControl } from '../controls/RadioControl';
import { useHeight, useIsSimpleSizes, useScreenOptions, useWidth } from '../../state';

export function ScreenSwitcher() {
  const [width, setWidth] = useWidth();
  const [height, setHeight] = useHeight();

  const [isSimpleSizes, setIsSimpleSizes] = useIsSimpleSizes();

  const screenOptions = useScreenOptions();

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
      <RadioControl
        options={screenOptions}
        selected={[width, height].join()}
        onChange={(value) => {
          const [newWidth, newHeight] = value.split(',');
          setWidth(parseInt(newWidth));
          setHeight(parseInt(newHeight));
        }}
      />
    </Fragment>
  );

  return (
    <div>
      <CompactModeButton {...{ isCompact, setIsCompact }} />
      {comp}
    </div>
  );
}
