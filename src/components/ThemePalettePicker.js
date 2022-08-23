import {ACTIONS} from '../hooks/useThemeEditor';
import React, {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';
import {PREVIEW_SIZE} from './properties/ColorControl';

export function ThemePalettePicker(props) {
  const {
    onChange,
    value,
    name,
    allowGradients,
  } = props;

  const {
    dispatch,
    colorUsages,
  } = useContext(ThemeEditorContext);
  
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
      onMouseEnter={() => {
        dispatch({type: ACTIONS.startPreview, payload: {name, value: color}});
      }}
      onMouseLeave={() => {
        dispatch({type: ACTIONS.endPreview, payload: {name}});
      }}
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
        fontSize: '8px',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}>
      <span key={`${color}---usages`} style={{backgroundColor: 'white'}}>{usages.length}</span>
    </span>;
  });
}
