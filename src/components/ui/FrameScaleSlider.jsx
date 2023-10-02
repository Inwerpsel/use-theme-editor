import React from 'react';
import { get, use } from '../../state';

// Display values > 1 closer to each other.
const overOneScale = 5;

const config = {
  min: 0.2,
  max: 1.4,
  step: 0.02,
};


export function FrameScaleSlider() {
  const [scales, setScales] = use.scales();
  const { width, height } = get;

  const scale = scales[`${width}x${height}`] || 1;
  const normalized = scale <= 1 ? scale : (1 + (scale - 1) / overOneScale)

  const updateScales = (e) => {
    const raw = e.target.value;
    const n = raw <= 1 ? raw : (1 + (raw-1) * overOneScale).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    setScales({ ...scales, [`${width}x${height}`]: n});
  };

  return (
    <div className={'frame-scale-slider'} style={{ minWidth: '200px' }}>
      <input
        type="range"
        list="scale-points" 
        value={normalized}
        {...config}
        onChange={updateScales}
      />
      <input type="number" list="scale-points" value={scale} {...config} onChange={updateScales} />
      <datalist id="scale-points">
        <option value="1"/>
        <option value="1.2"/>
        <option value="1.4"/>
      </datalist>
    </div>
  );
}
