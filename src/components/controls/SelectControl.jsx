import React, { useCallback, useRef } from "react";

function selectOption(o) {
  return (
    <option key={o.value} value={o.value}>
      {o.label}
    </option>
  );
}

export function SelectControl(props) {
    const { value, options = [], onChange: propsOnChange } = props;

    const onChange = useCallback(e => {
        // latestHandlerRef.current(e.target.value);
        propsOnChange(e.target.value);
    }, [])

    return (
      <select {...{ value, onChange }}>{options.map(selectOption)}</select>
    );
}