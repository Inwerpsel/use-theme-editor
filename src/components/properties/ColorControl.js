import {SketchPicker as ColorPicker} from 'react-color';
import {THEME_ACTIONS} from '../../hooks/useThemeEditor';
import {TextControl} from '@wordpress/components';
import {Fragment} from 'react';
import tinycolor from 'tinycolor2';

export const COLOR_VALUE_REGEX = /(#[\da-fA-F]{3}|rgba?\()/;
export const GRADIENT_REGEX = /linear-gradient\(.+\)/;

const PREVIEW_SIZE = '30px';

const extractUsage = (colors = [] , [name, color]) => {
  if (COLOR_VALUE_REGEX.test(color) || GRADIENT_REGEX.test(color)) {
    const alreadyUsed = colors.find(colorUsage => colorUsage.color === color);

    if (!alreadyUsed) {
      colors.push({ color, usages: [name] });
    } else {
      alreadyUsed.usages.push(name);
    }
  }

  return colors;
};

const extractColorUsages = theme => {
  if (null === theme) {
    return [];
  }

  return Object.entries(theme).reduce(extractUsage, []);
};

const byHexValue = ({color1}, { color2}) => {
  const hex1 = tinycolor(color1).toHex();
  const hex2 = tinycolor(color2).toHex();

  if (hex1 === hex2) {
    return color1 < color2 ? 1 : -1;
  }

  return hex1 < hex2 ? 1 : -1;
};


export const ColorControl = props => {
  const {onChange, value, theme, cssVar, dispatch} = props;

  const colorUsages = extractColorUsages(theme);

  return <Fragment>
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
    {colorUsages.sort(byHexValue).map(({color, usages}) => <span
      key={color}
      onClick={() => {
        onChange(color, true);
      }}
      onMouseEnter={() => {
        dispatch({type: THEME_ACTIONS.START_PREVIEW, payload: {name: cssVar.name, value: color}});
      }}
      onMouseLeave={() => {
        dispatch({type: THEME_ACTIONS.END_PREVIEW, payload: {name: cssVar.name}});
      }}
      title={`${color}\nUsed for:\n` + usages.join('\n')}
      style={{
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
        border: color === value ? '3px solid yellow' : '1px solid black',
        marginRight: '5px',
        marginBottom: '2px',
        borderRadius: '6px',
        background: color,
        display: 'inline-block',
        marginTop: '2px',
        fontSize: '8px',
        cursor: 'pointer',
      }}>
      <span key={`${color}---usages`} style={{backgroundColor: 'white'}}>{usages.length}</span>
    </span>)}
    <div>
      <TextControl style={{marginTop: '6px'}}
        value={ value }
        onChange={ value=>onChange(value, true) }
      />
    </div>
  </Fragment>;
};
