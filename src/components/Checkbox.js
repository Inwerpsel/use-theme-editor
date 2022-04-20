import React from 'react';

export function Checkbox({controls: [enabled, setEnabled], children, ...other}) {

  return <label
    {...other}
    style={{...other.style, marginBottom: '2px'}}
  >
    <input
      type="checkbox"
      readOnly
      checked={enabled}
      onClick={() => {
        setEnabled(!enabled);
      }}
    />
    {children}
  </label>;
}
