import React, {useState} from 'react';
import {ACTIONS, ROOT_SCOPE, editTheme} from '../../hooks/useThemeEditor';
import {Checkbox} from '../controls/Checkbox';
import {ToggleButton} from '../controls/ToggleButton';
import { TextControl } from '../controls/TextControl';
import { get } from '../../state';

export const CustomVariableInput = () => {
  const {themeEditor: {scopes}} = get;
  const dispatch = editTheme();
  const [displayed, setDisplayed] = useState(false);
  const theme = scopes[ROOT_SCOPE] || {};
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const varExists = name in theme;
  const isValidName = /^--[a-zA-Z0-9][a-zA-Z0-9_-]+/.test(name);

  return <div style={{marginBottom: '8px'}}>
    <ToggleButton controls={[displayed, setDisplayed]}>
      Custom variable
    </ToggleButton>
    {displayed && <div>
      <form
        onSubmit={event => {
          dispatch({type: ACTIONS.set, payload: {name, value}});
          event.preventDefault();

          return false;
        } }
      >
        <TextControl
          value={name || '--'}
          onChange={(value) => {
            setName(value.replace(' ', '-').replace(/^-*/, '--'));
          }}
        />
        <br/>
        <TextControl required value={value} onChange={setValue}/>
        <button
          disabled={!isValidName || value === theme[name] || !overwriteExisting && varExists}
          title={!varExists ? 'Add new variable' : theme[name] === value ? 'Variable already has this value' : `Overwrite existing value of ${theme[name]}`}
        >Add
        </button>
      </form>
      {varExists && <div>
        <button onClick={() => {
          dispatch({type: ACTIONS.unset, payload: {name}});
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

CustomVariableInput.fName = 'CustomVariableInput';