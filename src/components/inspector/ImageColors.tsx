import { useEffect, useState } from "react";
import { prominent } from "../../_unstable/colorsFromImage";
import { oklch, toOk } from "../properties/OklchColorControl";
import { get, use } from "../../state";
import { useLocalStorage, useResumableLocalStorage } from "../../hooks/useLocalStorage";
import { Checkbox } from "../controls/Checkbox";

const size = 42;

function PickSwatch({value}) {
  const {palette} = get;
  const [pickedValue, setPickedValue] = use.pickedValue();
  const inPalette = palette.some(({value: other} ) => other === value);

  return (
    <div
      style={{
        background: 'transparent',
        border: 'transparent',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
      onClick={() => {
        const newValue = pickedValue === value ? '' : value;
        setPickedValue(newValue);
      }}
    >
      {inPalette && 'V'}
    </div>
  );
}

function Swatch({color, minLightness, maxLightness}) {
    const conv = toOk(color);
    if (!conv) return;

    const {l: _l,c,h = 0,alpha = 1} = conv;
    const l = _l * 100;
    if (l < minLightness || l > maxLightness) {
      return;
    }

    const value = oklch(l, c, h, alpha);

    return (
      <div
        title={value}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('value', value)}
        style={{
          position: 'relative',
          display: 'inline-block',
          fontWeight: 900,
          verticalAlign: 'top',
          width: size,
          height: size,
          backgroundColor: color,
          color: 'green',
        }}
      >
        <PickSwatch {...{ value }} />
      </div>
    );
}

export function ImageColors(props: {path: string}) {
    const {path} = props;
    const [colors, setColors] = useState();
    const [t, setT] = useState();
    const [group, setGroup] = useResumableLocalStorage('image color group', 10)
    const [sample, setSample] = useResumableLocalStorage('image color sample', 20)
    const [amount, setAmount] = useResumableLocalStorage('image color amount', 90)
    const [minLightness, setMinLightness] = useResumableLocalStorage('image color min lightness', 0)
    const [maxLightness, setMaxLightness] = useResumableLocalStorage('image color max lightness', 100)
    const [minHue, setMinHue] = useResumableLocalStorage('image color min hue', 0)
    const [maxHue, setMaxHue] = useResumableLocalStorage('image color max hue', 360)
    
    const [preserveLightnessRange, setPreserveLightnessRange] = useLocalStorage('image color preserve lightness range', false);
    const [preserveHueRange, setPreserveHueRange] = useLocalStorage('image color preserve hue range', false);
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        const start = performance.now();
        const timeout = setTimeout(async () => {
          setProcessing(true);
          setColors(await prominent(path, {sample, group, amount: Math.max(2, amount), minHue, maxHue}));
          setT(performance.now() - start);
          setProcessing(false);
        }, 80);
        return () => clearTimeout(timeout);
    }, [path, group, sample, amount, minHue, maxHue]);

    if (!colors) return;


    return <div>
        <br/>group: {group}
        <span style={{float: 'right'}}> {t}ms</span>
        <input
          disabled={processing}
          type="range"
          value={group}
          min={1}
          max={100}
          style={{width: '95%'}}
          onChange={(e) => {
              setGroup(parseInt(e.target.value));
          }}
        />
        sample: {sample}
        <input
          disabled={processing}
          type="range"
          value={sample}
          min={1}
          max={50}
          style={{width: '95%'}}
          onChange={(e) => {
              setSample(parseInt(e.target.value));
          }}
        />
        amount: <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}/>
        <input
          disabled={processing}
          type="range"
          value={amount}
          step={9}
          min={9}
          max={90}
          style={{width: '95%'}}
          onChange={(e) => {
              setAmount(parseInt(e.target.value));
          }}
        />
        <div style={{display: 'flex'}}>
          <input
            disabled={processing}
            type="number"
            value={minHue}
            min={0}
            max={359}
            onChange={(e) => {
                setMinHue(parseInt(e.target.value));
            }}
          />
          <input
            disabled={processing}
            type="number"
            value={maxHue}
            min={1}
            max={360}
            onChange={(e) => {
                setMaxHue(parseInt(e.target.value));
            }}
          />
          <Checkbox disabled={(minHue <= 0) && (maxHue >= 360)} controls={[preserveHueRange, setPreserveHueRange]}>
            Fix hue range
          </Checkbox>
        </div>
        <div style={{background: `linear-gradient(90deg in oklch longer hue, transparent 0%, transparent 16px, oklch(71.68% 0.1505 0) 16px, oklch(71.68% 0.1505 0) calc(100% - 16px), transparent calc(100% - 16px), transparent 100%)`}}>
          <input
            disabled={processing || minHue < 0}
            type="range"
            value={(360 + minHue) % 360} // Yes we have to do this because modulo of negative numbers is broken in js.
            min={0}
            max={359}
            style={{width: '95%'}}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              setMinHue(newValue);
              if (newValue > maxHue - 5) {
                setMaxHue(newValue + 5);
              }
              if (preserveHueRange) {
                setMaxHue(maxHue + newValue - minHue);
              }
            }}
          />
          <input
            disabled={processing || maxHue > 360}
            type="range"
            value={maxHue % 360}
            min={1}
            max={360}
            style={{width: '95%'}}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              setMaxHue(newValue);
              if (newValue < minHue + 5) {
                setMinHue(newValue - 5);
              }
              if (preserveHueRange) {
                setMinHue(minHue + newValue - maxHue);
              }
            }}
          />
        </div>
        <div style={{display: 'flex'}}>

          <input
            disabled={processing}
            type="number"
            value={minLightness}
            min={0}
            max={99}
            onChange={(e) => {
                setMinLightness(parseInt(e.target.value));
            }}
          />
          <input
            disabled={processing}
            type="number"
            value={maxLightness}
            min={1}
            max={100}
            onChange={(e) => {
                setMaxLightness(parseInt(e.target.value));
            }}
          />
          <Checkbox disabled={minLightness <= 0 && maxLightness >= 100} controls={[preserveLightnessRange, setPreserveLightnessRange]}>
            Fix lightness range
          </Checkbox>
        </div>
        <div>
          <input
            disabled={processing}
            type="range"
            value={minLightness}
            min={0}
            max={99}
            style={{width: '95%'}}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              setMinLightness(newValue);
              if (newValue > maxLightness - 5) {
                setMaxLightness(newValue + 5);
              }
              if (preserveLightnessRange) {
                setMaxLightness(maxLightness + newValue - minLightness);
              }
            }}
          />
          <input
            disabled={processing}
            type="range"
            value={maxLightness}
            min={1}
            max={100}
            style={{width: '95%'}}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              setMaxLightness(newValue);
              if (newValue < minLightness + 5) {
                setMinLightness(newValue - 5);
              }
              if (preserveLightnessRange) {
                setMinLightness(minLightness + newValue - maxLightness);
              }
            }}
          />
        </div>
        {colors.map((color) => <Swatch {...{color, minLightness, maxLightness}}/>)}
    </div>
}