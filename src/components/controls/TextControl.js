import React from 'react';

const zKey = 90;

// Undo redo state is globally managed.
function preventUndoRedo (e) {
    if ((e.keyCode == zKey && e.ctrlKey)) {
      e.preventDefault();
      return false;
    }
  }

export function TextControl({
  label,
  value,
  className,
  instanceId,
  onChange: _onChange,
  ...props
}) {
  const onChange = (event) => _onChange(event.target.value);

  return (
    <input
      type={'text'}
      {...{ value, onChange }}
      onKeyDown={preventUndoRedo}
      className="components-text-control__input"
      autoCapitalize="off"
      {...props}
    />
  );
}