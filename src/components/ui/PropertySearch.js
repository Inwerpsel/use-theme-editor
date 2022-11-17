import React, {Fragment, useContext, useRef} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {useHotkeys} from 'react-hotkeys-hook';

const zKey = 90;

function preventUndoRedo(e) {
  if ((e.keyCode == zKey && e.ctrlKey)) {
    e.preventDefault();
    return false;
  }
}
export function PropertySearch() {
  const {
    propertySearch: value,
    setPropertySearch,
  } = useContext(ThemeEditorContext);

  const ref = useRef();

  useHotkeys('ctrl+/,cmd+/', () => {
    ref.current?.focus();
  });

  return <Fragment>
    <input
      onKeyDown={preventUndoRedo}
      style={{
        marginRight: !value ? '4px' : '24px',
        flexShrink: 1,
        maxWidth: '52%',
      }}
      autoComplete={'on'}
      placeholder={'search (cmd+/ or ctrl+/)'}
      type='text'
      {...{ref, value}}
      onChange={event => setPropertySearch(event.currentTarget.value)}
    />
    {!!value && <button
      style={{position: 'relative', right: '48px', width: '30px'}}
      title="clear"
      onClick={() => setPropertySearch('')}
    >x</button>}
  </Fragment>;
}
