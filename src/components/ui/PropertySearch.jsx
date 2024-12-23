import React, {Fragment, useRef} from 'react';
import { use } from '../../state';
import {useHotkeys} from 'react-hotkeys-hook';
import { TextControl } from '../controls/TextControl';
import { Checkbox2 } from "../controls/Checkbox";


export function PropertySearch() {
  const [value, setValue] = use.search();

  const inputRef = useRef();

  useHotkeys('ctrl+/,cmd+/', () => {
    inputRef.current?.focus();
  });

  return <Fragment>
    <TextControl
      {...{value, inputRef}}
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
    <Checkbox2 id={'show-raw-values'} hook={use.showRawValues} title='View only'>
      Raw values
    </Checkbox2>
  </Fragment>;
}
