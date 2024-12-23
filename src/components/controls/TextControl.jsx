import React from 'react';

const zKey = 90;

// Undo redo state is globally managed.
function preventUndoRedo (e) {
    if ((e.keyCode == zKey && e.ctrlKey)) {
      e.preventDefault();
      return false;
    }
  }

// todo: explore using controls, like Checkbox.
// or even injecting hooks like MovablePanels.
export function TextControl({
  label,
  value,
  className,
  onChange: _onChange,
  inputRef,
  ...props
}) {
  const onChange = (event) => _onChange(event.target.value);

  return (
    <input
      type={'text'}
      ref={inputRef}
      {...{ value, onChange }}
      onKeyDown={preventUndoRedo}
      className="components-text-control__input"
      autoCapitalize="off"
      {...props}
    />
  );
}