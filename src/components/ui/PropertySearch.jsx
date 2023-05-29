import React, {Fragment} from 'react';
import { use } from '../../state';
// import {useHotkeys} from 'react-hotkeys-hook';
import { TextControl } from '../controls/TextControl';


export function PropertySearch() {
  const [value, setValue] = use.search();

  // const ref = useRef();

  // useHotkeys('ctrl+/,cmd+/', () => {
  //   ref.current?.focus();
  // });

  return <Fragment>
    <TextControl
      {...{value}}
      onChange={setValue}
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
      onClick={() => setValue('')}
    >x</button>}
  </Fragment>;
}
