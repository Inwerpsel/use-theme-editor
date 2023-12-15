import React from 'react';
import { use } from '../../state';

export function ThemeEditorExtraOptions() {
  const [frameClickBehavior, setFrameClickBehavior] = use.frameClickBehavior();

  return <div>
    <button
      onClick={() => {
        setFrameClickBehavior(frameClickBehavior === 'alt' ? 'any' : 'alt');
      }}
    >
      {frameClickBehavior === 'alt' ? 'Require ALT for inspect (ON)' : 'Require ALT for inspect (OFF)'}
    </button>
  </div>;
}
