import React from 'react';
import { use } from '../../state';
import { Tutorial } from '../../_unstable/Tutorial';

export function CursorBehavior() {
  const [frameClickBehavior, setFrameClickBehavior] = use.frameClickBehavior();

  const useAlt = frameClickBehavior === 'alt';
  return <div>
    <Tutorial el={CursorBehavior}>Toggle whether a normal click performs an inspection and blocks default click behavior.</Tutorial>
    <button
      title={
        useAlt 
        ? 'Clicks are processed by the page and should result in normal responses.\n You can still inspect by holding the ALT key while clicking.' 
        : 'Clicking on an element will inspect it.\n Most normal behavior is prevented (e.g. links), but some may still get triggered (e.g. accordion state).'
      }
      onClick={() => {
        const newValue = frameClickBehavior === 'alt' ? 'any' : 'alt';
        setFrameClickBehavior(newValue);
     }}
    >
      {useAlt ? 'Cursor: interact' : 'Cursor: inspect 🔍'}
    </button>
  </div>;
}

CursorBehavior.fName = 'CursorBehavior';