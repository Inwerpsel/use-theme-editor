import React from 'react';
import { use } from '../../state';

const config = {
  min: 0.2,
  max: 1,
  step: 0.02,
};

export function FrameScaleSlider() {
  const [scales, setScales] = use.scales();
  const [width] = use.width();
  const [height] = use.height();
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
