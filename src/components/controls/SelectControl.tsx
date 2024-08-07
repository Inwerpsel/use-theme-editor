import React, { useCallback, useMemo } from "react";

function selectOption(o) {
  return (
    <option key={o.value} value={o.value}>
      {o.label}
    </option>
  );
}

export function SelectControl(props: {
  options: [],
  value: string,
  onChange: Function,
  title?: string,
  style?: object,
}) {
  const { options = [], value, onChange: propsOnChange, title, style } = props;

  const onChange = useCallback(
    (e) => {
      // latestHandlerRef.current(e.target.value);
      propsOnChange(e.target.value);
    },
    [propsOnChange]
  );

  const els = useMemo(() => options.map(selectOption), options);

  return (
    <select {...{ value, onChange, title, style }}>
      {els}
    </select>
  );
}