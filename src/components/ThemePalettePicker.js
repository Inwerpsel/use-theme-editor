import {THEME_ACTIONS} from '../hooks/useThemeEditor';
import {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';
import {PREVIEW_SIZE} from './properties/ColorControl';

export function ThemePalettePicker(props) {
  const {
    onChange,
    value,
    name,
  } = props;

  const {
    dispatch,
    colorUsages,
  } = useContext(ThemeEditorContext);
  
  return colorUsages.map(({color, usages}) => {
    // if (color === value && usages.length === 1) {
    //   return null;
    // }

    return <span
      key={color}
      onClick={() => {
        onChange(color, true);
      }}
      onMouseEnter={() => {
        dispatch({type: THEME_ACTIONS.START_PREVIEW, payload: {name, value: color}});
      }}
      onMouseLeave={() => {
        dispatch({type: THEME_ACTIONS.END_PREVIEW, payload: {name}});
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
