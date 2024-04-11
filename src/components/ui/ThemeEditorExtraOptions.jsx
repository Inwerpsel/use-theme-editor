import React from 'react';
import { use } from '../../state';
import { Tutorial } from '../../_unstable/Tutorial';

export function ThemeEditorExtraOptions() {
  const [frameClickBehavior, setFrameClickBehavior] = use.frameClickBehavior();

  return <div>
    <Tutorial el={ThemeEditorExtraOptions}>Toggle whether a normal click performs an inspection and blocks default click behavior.</Tutorial>
    <button
      onClick={() => {
        setFrameClickBehavior(frameClickBehavior === 'alt' ? 'any' : 'alt');
      }}
    >
      {frameClickBehavior === 'alt' ? 'Require ALT for inspect (ON)' : 'Require ALT for inspect (OFF)'}
    </button>
  </div>;
}

ThemeEditorExtraOptions.fName = 'ThemeEditorExtraOptions';