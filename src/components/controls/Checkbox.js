import React, { useCallback } from 'react';

export function Checkbox({controls: [enabled, setEnabled], children, ...other}) {
  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled]);

  return (
    <label {...other} style={{ ...other.style, marginBottom: '2px' }}>
      <input type="checkbox" readOnly checked={!!enabled} onClick={toggle} />
      {children}
    </label>
  );
}
