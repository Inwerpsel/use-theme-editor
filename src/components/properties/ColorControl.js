import {SketchPicker as ColorPicker} from 'react-color';
import {THEME_ACTIONS} from '../../hooks/useThemeEditor';
import {TextControl} from '@wordpress/components';
import {Fragment, useContext, useState} from 'react';
import tinycolor from 'tinycolor2';
import {ThemeEditorContext} from '../ThemeEditor';
import {ThemePalettePicker} from '../ThemePalettePicker';
import {useDebounce} from '../../hooks/useDebounce';

export const COLOR_VALUE_REGEX = /(#[\da-fA-F]{3}|rgba?\()/;
export const GRADIENT_REGEX = /linear-gradient\(.+\)/;

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
      colors[color] = {color, usages: []};
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

  return Object.values(Object.entries(combined).filter(([k]) => !INTERNAL_VARS_REGEX.test(k)).reduce(extractUsage, {}));
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
  const {onChange, value, cssVar} = props;

  const {name} = cssVar;

  const [hideColorPicker, setHideColorPicker] = useState(true);

  const {
    dispatch,
    nativeColorPicker,
  } = useContext(ThemeEditorContext);

  const debounce = useDebounce();
  const opacity = tinycolor(value).getAlpha();

  if (!nativeColorPicker) {
    return <Fragment>
      <div style={{clear: 'both'}}>
        <ThemePalettePicker {...{value, onChange, name}}/>
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
              ? dispatch({type: THEME_ACTIONS.UNSET, payload: {name}})
              : dispatch({type: THEME_ACTIONS.SET, payload: {name, value: 'transparent'}});
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
    <input
      style={{
        width: pickerSize,
        height: pickerSize,
        float: 'right',
        opacity,
      }}
      type='color'
      value={tinycolor(value).toHexString()}
      onChange={(event) => {
        const color = tinycolor(event.target.value);
        const newColor = pickFormat(color, opacity);

        debounce(newColor, onChange);
      }}
    />
    <input
      style={{
        float: 'right',
      }}
      type='number'
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
          ? dispatch({type: THEME_ACTIONS.UNSET, payload: {name}})
          : dispatch({type: THEME_ACTIONS.SET, payload: {name, value: 'transparent'}});
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
      <ThemePalettePicker {...{value, onChange, name}}/>
    </div>
  </div>;
};
