import React from 'react';
import { useHeight, useScales, useWidth } from '../../state';

const config = {
  min: 0.2,
  max: 1,
  step: 0.02,
};

export function FrameScaleSlider() {
  const [scales, setScales] = useScales();
  const [width] = useWidth();
  const [height] = useHeight();
  const scale = scales[`${width}x${height}`] || 1;

  const updateScales = (e) => {
    setScales({ ...scales, [`${width}x${height}`]: e.target.value });
  };

  return (
    <div className={'frame-scale-slider'} style={{ minWidth: '200px' }}>
      <input
        type="range"
        value={scale}
        {...config}
        onChange={updateScales}
      />
      <input type="number" value={scale} {...config} onChange={updateScales} />
    </div>
  );
}
