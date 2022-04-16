export function Checkbox({controls: [value, setValue], children}) {

  return <label
    style={{marginBottom: '2px'}}
  >
    <input
      type="checkbox"
      readOnly
      checked={value}
      onClick={() => {
        setValue(!value);
      }}
    />
    {children}
  </label>;
}
