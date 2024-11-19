import React, { memo } from 'react';

export function controlsAreEqual(a, b) {
  return a.disabled === b.disabled && a.controls[0] === b.controls[0] && a.controls[1] === b.controls[1];
}

export const Checkbox = memo(function Checkbox ({
  controls: [enabled, setEnabled],
  disabled = false,
  children,
  ...other
}) {
  return (
    <label {...other} style={{ ...other.style, marginBottom: '2px' }}>
      <input
        {...{disabled}}
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

export function Checkbox2({hook, children, disabled = false, ...other}) {
  const [enabled, setEnabled] = hook();

  return (
    <label {...other} style={{ ...other.style, marginBottom: '2px' }}>
      <input
        {...{disabled}}
        type="checkbox"
        readOnly
        checked={!!enabled}
        onClick={() => setEnabled(!enabled)}
      />
      {children}
    </label>
  );
}