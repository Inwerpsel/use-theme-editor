import React from 'react';
import { converter, clampChroma, parse  } from 'culori';


const okConv = converter('oklch');

function extract(value) {
    return okConv(value);

}

const noLightness = 0;
const fullLightness = 1;
const bigStep = 0.01;
const smallStep = 0.001;

function minLightness(c, h) {
  let smallestDiff = Infinity;
  let l = noLightness, parsed = parse(`oklch(${l}% ${c} ${h})`);
  while (l < fullLightness) {
    l += bigStep;
    const diff = Math.abs(clampChroma({...parsed, l}, 'oklch', 'p3').c - c);
    if (diff === 0) {
      return l * 100;
    }
    // The diff should only decrease until we land in or after the allowed range.
    if (diff >= smallestDiff) {
      break;
    }
  }

  const tooMuch = l;
  l -= bigStep;
  smallestDiff = Infinity;

  while (l < tooMuch) {
    l += smallStep;
    const diff = Math.abs(clampChroma({...parsed, l}, 'oklch', 'p3').c - c);
    if (diff === 0) {
      return l;
    }
    if (diff >= smallestDiff) {
      break;
    }
  }
  return l * 100;
}

function maxLightness(c, h) {
  let smallestDiff = Infinity;
  let l = fullLightness, parsed = parse(`oklch(${l}% ${c} ${h})`);
  while (l > noLightness) {
    l -= bigStep;
    const diff = Math.abs(clampChroma({...parsed, l}, 'oklch', 'p3').c - c);
    if (diff === 0) {
      return l * 100;
    }
    if (diff >= smallestDiff) {
      break;
    }

  }

  const tooLittle = l;
  l -= bigStep;
  smallestDiff = Infinity;

  while (l > tooLittle) {
    l -= smallStep;
    const diff = Math.abs(clampChroma({...parsed, l}, 'oklch', 'p3').c - c);
    if (diff === 0) {
      return l;
    }
    if (diff >= smallestDiff) {
      break;
    }
  }
  return l * 100;
}

function OnlinePickerLink({l, c, h, a = 100}) {
  // https://oklch.com/#50,0.1574,130,100
  return <a href={`https://oklch.com/#${l},${c},${h},${a}`} target='_blank'>online picker</a>
}

function oklch(l, c, h, a) {
  const aSuffix = a === 1 ? '' : `/ ${a}`
  return `oklch(${l.toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(2)}${aSuffix})`;
}

export function OklchColorControl({value, onChange}) {
    const { l: _l, c, h, alpha = 1 } = extract(value) || { l: 0, c: 0, h: 0, alpha: 1 };
    const l = 100 * _l;
    const clamped = clampChroma(`oklch(${l}% 0.4 ${h})`, 'oklch', 'p3');
    const maxChroma = clamped.c; 
    // Todo: find right number to check here and possibly also use in other places.
    const isNotInGamut = c - maxChroma > 0.001;
    const lowerL = minLightness(c, h);
    const upperL = maxLightness(c, h);

    return (
      <div className="oklch-picker" style={{
        '--picked-lightness': `${l}%`,
        '--picked-chroma': c,
        '--picked-hue': h,
        '--max-chroma': maxChroma,
        '--min-lightness': `${lowerL}%`,
        '--max-lightness': `${upperL}%`,
        '--max-lightness-scalar': upperL,
      }}>
        <div className="lightness" onDrop={e=>{
          const value = e.dataTransfer.getData('value');
          const {l} = extract(value);
          if (l > 0) {
            e.preventDefault();
            e.stopPropagation();
            onChange(oklch(l * 100, c, h, alpha));
          }
        }}>
          <input onChange={e=>onChange(oklch(Number(e.target.value), c, h, alpha))} id="lightness" type="range" min={0} max={100} value={l} step={0.1} />
        </div>
        <div className="chroma">
          <input
            id="chroma"
            type="range"
            min={0}
            max={0.37}
            value={c}
            step={0.001}
            onInput={e=>{
              const input = Math.min(maxChroma, Number(e.target.value));
              return onChange(oklch(l, input, h, alpha));
            }} 
          />
        </div>
        <div className="hue" onDrop={e=>{
          const value = e.dataTransfer.getData('value');
          if (!value) return;
          const {h} = extract(value);
          e.preventDefault();
          e.stopPropagation();
          onChange(oklch(l, c, h, alpha));
        }}>
          <input id="hue" type="range" min={0} max={360} value={h} step={0.1} onChange={e =>onChange(oklch(l, c, Number(e.target.value), alpha))} />
        </div>
        <OnlinePickerLink {...{l,c,h}} />
        {isNotInGamut && <span style={{color: 'red', fontWeight: 'bold'}}>NOT IN GAMUT</span>}
      </div>
    );
}
