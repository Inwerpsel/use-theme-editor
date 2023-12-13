import {SketchPicker as ColorPicker} from 'react-color';
import {ACTIONS} from '../../hooks/useThemeEditor';
import React, {Fragment, useContext, useState} from 'react';
import tinycolor from 'tinycolor2';
import {ThemeEditorContext} from '../ThemeEditor';
import {ThemePalettePicker} from '../ThemePalettePicker';
import {useThrottler} from '../../hooks/useThrottler';
import { useResumableState } from '../../hooks/useResumableReducer';
import { TextControl } from '../controls/TextControl';
import { CreateAlias } from '../inspector/CreateAlias';
import { get } from '../../state';

export const COLOR_VALUE_REGEX = /(#[\da-fA-F]{3}|rgba?\()/;
export const GRADIENT_REGEX = /(linear|radial|conic)-gradient\(.+\)/;

const INTERNAL_VARS_REGEX = /^(--var-control|--server-theme|--theme-editor)/;

export const PREVIEW_SIZE = '39px';

export const pickFormat = (color, opacity) =>
  opacity === 1
    ? color.toHexString()
    : color.setAlpha(opacity).toRgbString();

const extractUsage = (colors , [name, color]) => {
  if (/px/.test(color)) {
    return colors;
  }
  if (COLOR_VALUE_REGEX.test(color) || GRADIENT_REGEX.test(color)) {
    if (!(color in colors)) {
      colors[color] = {color, usages: [], isGradient: GRADIENT_REGEX.test(color)};
    }
    colors[color].usages.push(name);
  }

  return colors;
};

export const extractColorUsages = (theme, defaultValues) => {
  if (null === theme) {
    return [];
  }
  const combined = {
    ...defaultValues,
    ...theme,
  };

  return Object.values(
    Object.entries(combined).filter(([k]) => !INTERNAL_VARS_REGEX.test(k)).reduce(extractUsage, {})
  );
};

export const byHexValue = ({color: color1}, { color: color2}) => {
  const hex1 = tinycolor(color1).toHex();
  const hex2 = tinycolor(color2).toHex();

  if (hex1 === hex2) {
    if (color1 === color2) {
      return 0;
    }
    return color1 < color2 ? 1 : -1;
  }

  return hex1 < hex2 ? 1 : -1;
};

const pickerSize = '80px';

export const ColorControl = props => {
  const { onChange, onUnset, value: maybeVar, resolvedValue, cssVar } = props;
  const value = maybeVar?.includes('var(--') ? resolvedValue : maybeVar;
  const { nativeColorPicker } = get;
  // const { onChange: _onChange, onUnset, value: _value, cssVar, cssFunc } = props;

  // const value = !cssFunc ? _value : `${cssFunc}(${value})`

  // const onChange = !cssFunc ? _onChange : v => {
  //   const color = tinycolor(v);

  //   switch (cssFunc) {
  //     case 'rgb':{
  //       _onChange(color.toRgbString());
  //     }
  //     case 'hsl':{
  //       _onChange(color.toHslString());
  //     }
  //   }
  // }

  const {name, usages} = cssVar;

  const [hideColorPicker, setHideColorPicker] = useResumableState(`color-picker~~${cssVar.name}`, true);

  const {
    dispatch,
  } = useContext(ThemeEditorContext);

  const throttle = useThrottler({ms: 50 });
  const opacity = tinycolor(value).getAlpha();

  // Disallow gradients if not all usages support it.
  const allowGradients = !usages.some(({property}) => property !== 'background');

  const hexValue = tinycolor(value).toHexString();

  if (!nativeColorPicker) {
    return <Fragment>
      <div style={{clear: 'both'}}>
        <ThemePalettePicker {...{value, onChange, name, allowGradients}}/>
        <button
          onClick={() => setHideColorPicker(!hideColorPicker)}
          title={ hideColorPicker ? 'Add a new color' : 'Hide color picker'}
          style={{
            width: '84px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            clear: 'both',
            height: `${PREVIEW_SIZE}`,
            verticalAlign: 'bottom',
            marginBottom: '2px',
          }}
        >
          {!hideColorPicker ? 'Hide picker' : 'New color'}
        </button>
      </div>
      { !hideColorPicker && <Fragment>
        <ColorPicker
          styles={{
            picker: {
              width: 'calc(100%)',
            }
          }}
          color={ value }
          onChange={ color => {
            const hasTransparency = color.rgb.a !== 1;

            const { r, g, b, a } = color.rgb;

            // Component throttles internally, adding it here too makes it unresponsive.
            onChange(hasTransparency ? `rgba(${ r } , ${ g }, ${ b }, ${ a })` : color.hex);
          } }
        />
        <div>
          <TextControl
            style={{marginTop: '6px'}}
            value={value}
            onChange={value => onChange(value, true)}
          />
        </div>
        <button
          onClick={() => {
            value === 'transparent'
              ? dispatch({type: ACTIONS.unset, payload: {name}})
              : onChange('transparent');
          }}
          style={ {
            fontSize: '12px',
            float: 'right',
            width: PREVIEW_SIZE,
            opacity: value === 'transparent' ? 1 : .4,
          }}
        >
          👻
        </button>
      </Fragment>}
    </Fragment>;
  }

  return <div style={{minHeight: '120px', clear: 'both'}}>
    <CreateAlias key={value} {...{value}}/>
    <input
      type='color'
      style={{
        width: pickerSize,
        height: pickerSize,
        float: 'right',
        opacity,
      }}
      value={hexValue}
      onChange={(event) => {
        const color = tinycolor(event.target.value);
        const newColor = pickFormat(color, opacity);

        // Native picker emits values much more frequently than can be distinguished when applied.
        // Since most editor components re-render on changes to the theme, we apply a modest amount
        // of throttling.
        throttle(onChange, newColor);
      }}
    />
    <input
      type='number'
      style={{
        float: 'right',
      }}
      min={0}
      max={1}
      step={.05}
      value={tinycolor(value).toRgb().a}
      onChange={(event) => {
        const opacity = Number(event.target.value);
        const color = tinycolor(value);

        onChange(pickFormat(color, opacity));
      }}
    />
    <button
      onClick={() => {
        value === 'transparent'
          ? dispatch({type: ACTIONS.unset, payload: {name}})
          : onChange('transparent');
      }}
      style={ {
        fontSize: '12px',
        float: 'right',
        width: PREVIEW_SIZE,
        opacity: value === 'transparent' ? 1 : .4,
      }}
    >
      👻
    </button>
    <div style={{clear: 'both'}}>
      <ThemePalettePicker {...{value, onChange, name, allowGradients}}/>
    </div>
  </div>;
};
