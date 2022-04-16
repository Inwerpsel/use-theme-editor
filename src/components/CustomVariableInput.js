import {useContext, useState} from 'react';
import {THEME_ACTIONS} from '../hooks/useThemeEditor';
import {ThemeEditorContext} from './ThemeEditor';
import {Checkbox} from './Checkbox';

export const CustomVariableInput = () => {
  const [collapsed, setCollapsed] = useState(true);
  const {dispatch, theme} = useContext(ThemeEditorContext);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const varExists = name in theme;
  const isValidName = /^--[a-zA-Z0-9][a-zA-Z0-9_-]+/.test(name);

  return <div>
    <button
      onClick={() => {
        setCollapsed(!collapsed);
      }}
    >Add a custom variable{!collapsed && ' (collapse)'}</button>
    {!collapsed && <div>
      <Checkbox controls={[overwriteExisting, setOverwriteExisting]}>
        Overwrite existing
      </Checkbox>
      <form
        onSubmit={event => {
          dispatch({type: THEME_ACTIONS.SET, payload: {name, value}});
          event.preventDefault();

          return false;
        } }
      >
        --<input
          type="text"
          value={name.replace(/^--/, '')}
          onChange={event => setName(`--${event.target.value}`)}
        />
        <br/>
        <input required type="text" value={value} onChange={event => setValue(event.target.value)}/>
        <button
          disabled={!isValidName || value === theme[name] || !overwriteExisting && varExists}
          title={!varExists ? 'Add new variable.' : `Overwrite existing value of ${theme[name]}`}
        >Add
        </button>
      </form>
      {varExists && <button onClick={() => {
        confirm(`Unset variable ${name}?`) && dispatch({type: THEME_ACTIONS.UNSET, payload: {name}});
      }}>Unset</button>}
    </div>}
  </div>;
};
