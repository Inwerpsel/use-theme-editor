import {ACTIONS, ROOT_SCOPE} from '../hooks/useThemeEditor';
import React, {useContext, useMemo} from 'react';
import {PREVIEW_SIZE} from './properties/ColorControl';
import { get } from '../state';

export function ThemePalettePicker(props) {
  const {
    onChange,
    value,
    // name,
    allowGradients,
  } = props;

  const { colorUsages } = get;

  return colorUsages.map(({color, usages, isGradient}) => {
    // if (color === value && usages.length === 1) {
    //   return null;
    // }
    if (!allowGradients && isGradient) {
      return null;
    }

    return <span
      key={color}
      onClick={() => {
        onChange(color, true);
      }}
      // onMouseEnter={() => {
      //   dispatch({type: ACTIONS.startPreview, payload: {name, value: color}});
      // }}
      // onMouseLeave={() => {
      //   dispatch({type: ACTIONS.endPreview, payload: {name}});
      // }}
      title={`${color}\nUsed for:\n` + usages.join('\n')}
      style={{
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
        border: color === value ? '3px solid yellow' : '1px solid black',
        marginRight: '5px',
        marginBottom: '2px',
        borderRadius: '5px',
        background: color,
        display: 'inline-block',
        marginTop: '2px',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}>
      <span key={`${color}---usages`} style={{fontSize: '10px', backgroundColor: 'white'}}>{usages.length}</span>
      {/^var\(/.test(color) && 'var'}
    </span>;
  });
}
