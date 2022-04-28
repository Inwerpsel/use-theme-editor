import React from 'react';

export function ToggleButton({controls: [enabled, setEnabled], children, ...other}) {
  // For now all booleans being used work by hiding a component if enabled.
  return <button
    {...other}
    title={!enabled ? 'Hide' : 'Show'}
    onClick={() => setEnabled(!enabled)}
  >
    {children}
  </button>;
}
