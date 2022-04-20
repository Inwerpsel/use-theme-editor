import React, {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

export function ThemeEditorExtraOptions() {
  const {
    frameClickBehavior, setFrameClickBehavior,
    responsiveSticky, setResponsiveSticky,
  } = useContext(ThemeEditorContext);
  return <div>
    <button
      onClick={() => {
        setFrameClickBehavior(frameClickBehavior === 'alt' ? 'any' : 'alt');
      }}
    >
      {frameClickBehavior === 'alt' ? 'Require ALT for inspect (ON)' : 'Require ALT for inspect (OFF)'}
    </button>
    <button
      onClick={() => {
        setResponsiveSticky(!responsiveSticky);
      }}
    >
      {responsiveSticky ? 'Sticky responsive (ON)' : 'Sticky responsive (OFF)'}
    </button>
  </div>;
}
