import React from 'react';

export function ToggleButton({controls: [enabled, setEnabled], className, children}) {
  // For now all booleans being used work by hiding a component if enabled.
  return <button
    {...{className}}
    title={!enabled ? 'Hide' : 'Show'}
    onClick={() => setEnabled(!enabled)}
  >
    {children}
  </button>;
}
