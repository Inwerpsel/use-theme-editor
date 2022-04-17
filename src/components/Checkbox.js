import React from 'react';

export function Checkbox({controls: [enabled, setEnabled], children}) {

  return <label
    style={{marginBottom: '2px'}}
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
