import React, {useContext, useState} from 'react';
import {ACTIONS, ROOT_SCOPE} from '../../hooks/useThemeEditor';
import {ThemeEditorContext} from '../ThemeEditor';
import {Checkbox} from '../controls/Checkbox';
import {ToggleButton} from '../controls/ToggleButton';

export const CustomVariableInput = () => {
  const [displayed, setDisplayed] = useState(false);
  const {dispatch, scopes} = useContext(ThemeEditorContext);
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
