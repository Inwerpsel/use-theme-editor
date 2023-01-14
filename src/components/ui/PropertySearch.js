import React, {Fragment, useContext, useRef} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {useHotkeys} from 'react-hotkeys-hook';
import { TextControl } from '../controls/TextControl';


export function PropertySearch() {
  const {
    propertySearch: value,
    setPropertySearch,
  } = useContext(ThemeEditorContext);

  // const ref = useRef();

  // useHotkeys('ctrl+/,cmd+/', () => {
  //   ref.current?.focus();
  // });

  return <Fragment>
    <TextControl
      {...{value}}
      onChange={setPropertySearch}
      placeholder={'search (cmd+/ or ctrl+/)'}
      style={{
        marginRight: !value ? '4px' : '24px',
        flexShrink: 1,
        maxWidth: '52%',
      }}
      autoComplete={'on'}
    />
    {!!value && <button
      style={{position: 'relative', right: '48px', width: '30px'}}
      title="clear"
      onClick={() => setPropertySearch('')}
    >x</button>}
  </Fragment>;
}
