import React, { Fragment } from 'react';
import { useCompactSetting } from '../movable/MovableElement';
import { CompactModeButton } from '../movable/CompactModeButton';
import { SelectControl } from '../controls/SelectControl';
import { RadioControl } from '../controls/RadioControl';
import { get, use } from '../../state';

export function ScreenSwitcher() {
  const [width, setWidth] = use.width();
  const [height, setHeight] = use.height();

  const [isSimpleSizes, setIsSimpleSizes] = use.isSimpleSizes();

  const { screenOptions } = get;

  const [isCompact] = useCompactSetting();

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
      <CompactModeButton />
      {comp}
    </div>
  );
}
