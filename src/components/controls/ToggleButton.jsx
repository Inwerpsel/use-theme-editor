import React, { memo } from 'react';
import { controlsAreEqual } from './Checkbox';

export const ToggleButton = memo(function ToggleButton({
  controls: [enabled, setEnabled],
  dispatchArgs = [],
  children,
  ...other
}) {
  return (
    <button
      {...other}
      title={!enabled ? 'Show' : 'Hide'}
      onClick={() => setEnabled(!enabled, ...dispatchArgs)}
      style={{ border: enabled ? '4px solid black' : '1px solid black' }}
    >
      {children}
    </button>
  );
},
controlsAreEqual);
