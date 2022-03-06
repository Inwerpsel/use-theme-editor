import {useContext, useRef} from 'react';
import {ThemeEditorContext} from './ThemeEditor';
import {useHotkeys} from 'react-hotkeys-hook';

export function PropertySearch() {
  const {
    propertySearch: value,
    setPropertySearch,
  } = useContext(ThemeEditorContext);

  const ref = useRef();

  useHotkeys('ctrl+/,cmd+/', () => {
    ref?.current?.focus();
  });

  return <div>
    <input
      autoComplete={'on'}
      placeholder={'search (cmd+/ or ctrl+/)'}
      type='text'
      {...{ref, value}}
      onChange={event => setPropertySearch(event.currentTarget.value)}
    />
    {!!value && <button
      style={{position: 'relative', right: '27px'}}
      title="clear"
      onClick={() => setPropertySearch('')}
    >x</button>}
  </div>;
}
