import React, {useContext, useState} from 'react';
import {THEME_ACTIONS} from '../hooks/useThemeEditor';
import {ThemeEditorContext} from './ThemeEditor';
import {Checkbox} from './Checkbox';
import {ToggleButton} from './ToggleButton';

export const CustomVariableInput = () => {
  const [collapsed, setCollapsed] = useState(true);
  const {dispatch, theme} = useContext(ThemeEditorContext);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const varExists = name in theme;
  const isValidName = /^--[a-zA-Z0-9][a-zA-Z0-9_-]+/.test(name);

  return <div style={{marginBottom: '8px'}}>
    <ToggleButton controls={[collapsed, setCollapsed]}>
      Custom variable
    </ToggleButton>
    {!collapsed && <div>
      <form
        onSubmit={event => {
          dispatch({type: THEME_ACTIONS.SET, payload: {name, value}});
          event.preventDefault();

          return false;
        } }
      >
        <input
          type="text"
          value={name || '--'}
          onChange={({target: {value}}) => {
            setName(value.replace(' ', '-').replace(/^-*/, '--'));
          }}
        />
        <br/>
        <input required type="text" value={value} onChange={event => setValue(event.target.value)}/>
        <button
          disabled={!isValidName || value === theme[name] || !overwriteExisting && varExists}
          title={!varExists ? 'Add new variable' : theme[name] === value ? 'Variable already has this value' : `Overwrite existing value of ${theme[name]}`}
        >Add
        </button>
      </form>
      {varExists && <div>
        <button onClick={() => {
          dispatch({type: THEME_ACTIONS.UNSET, payload: {name}});
        }}>Unset</button>
        <Checkbox controls={[overwriteExisting, setOverwriteExisting]}>
          Confirm overwrite existing
        </Checkbox>
        <div>
          Current value: {theme[name]}
        </div>
      </div>}
    </div>}
  </div>;
};
