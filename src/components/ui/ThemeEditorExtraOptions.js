import React, {useContext} from 'react';
import { use } from '../../state';
import {ThemeEditorContext} from '../ThemeEditor';

export function ThemeEditorExtraOptions() {
  const [frameClickBehavior, setFrameClickBehavior] = use.frameClickBehavior();
  const {
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
