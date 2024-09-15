import React from 'react';
import { converter, clampChroma  } from 'culori';


const okConv = converter('oklch');

function extract(value) {
    return okConv(value);

}

export function OklchColorControl({value, onChange}) {
    const { l: _l, c, h: _h } = extract(value) || { l: 0, c: 0, h: 0 };
    const l = 100 * _l;
    const h = !_h ? 0 : _h;
    const clamped = clampChroma(`oklch(${l}% 0.4 ${h})`);
    const maxChroma = clamped.c > 0 ? clamped.c : 0.4;

    return (
      <div className="oklch-picker" style={{
        '--picked-lightness': `${l}%`,
        '--picked-chroma': c,
        '--picked-hue': h,
        '--max-chroma': maxChroma,
      }}>
        <div className="lightness">
          <input onChange={e=>onChange(`oklch(${e.target.value}% ${c.toFixed(3)} ${h.toFixed(2)})`)} id="lightness" type="range" min={0} max={100} value={l} />
        </div>
        <div className="chroma">
          <input
            id="chroma"
            type="range"
            min={0}
            max={maxChroma}
            value={c}
            step={0.0001}
            onInput={e=>{
              const input = Math.min(maxChroma, e.target.value);
              return onChange(`oklch(${l.toFixed(2)}% ${input} ${h.toFixed(2)})`);
            }} 
          />
        </div>
        <div className="hue">
          <input id="hue" type="range" min={0} max={360} value={h}onChange={e=>onChange(`oklch(${l.toFixed(2)}% ${c.toFixed(3)} ${e.target.value})`)}  />
        </div>
      </div>
    );
}
