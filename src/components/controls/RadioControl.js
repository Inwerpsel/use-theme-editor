import { useId } from "react";
import { useCallback } from "react";

export function RadioControl(props) {
    const {options, onChange, selected, ...additionalProps} = props;
    const id = useId();

    const onChangeValue = useCallback(e => onChange(e.target.value), []);

    return (
      <div>
        {options.map((option, index) => (
          <div
            key={option.value}
          >
            <input
              id={`${id}-${index}`}
              type="radio"
              name={id}
              value={option.value}
              onChange={onChangeValue}
              checked={option.value === selected}
              {...additionalProps}
            />
            <label htmlFor={`${id}-${index}`}>{option.label}</label>
          </div>
        ))}
      </div>
    );
}

