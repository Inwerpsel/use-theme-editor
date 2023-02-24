import React, { memo } from 'react';

export function controlsAreEqual({ controls: a }, { controls: b }) {
  return a[0] === b[0] && a[1] === b[1];
}

export const Checkbox = memo(function Checkbox ({
  controls: [enabled, setEnabled],
  children,
  ...other
}) {
  return (
    <label {...other} style={{ ...other.style, marginBottom: '2px' }}>
      <input
        type="checkbox"
        readOnly
        checked={!!enabled}
        onClick={() => setEnabled(!enabled)}
      />
      {children}
    </label>
  );
}, 
controlsAreEqual);
