import React, { useCallback, useRef } from "react";

export function SelectControl(props) {
    const { value, options = [], onChange: propsOnChange } = props;

    const latestHandlerRef = useRef();
    latestHandlerRef.current = propsOnChange;

    const onChange = useCallback(e => {
        // latestHandlerRef.current(e.target.value);
        propsOnChange(e.target.value);
    }, [])

    return (
      <select {...{ value, onChange }}>
        {options.map((o) => (
          <option value={o.value}>{o.label}</option>
        ))}
      </select>
    );
}