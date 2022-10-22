export function CompactModeButton(props) {
  const { isCompact, setIsCompact } = props;

  return (
    <button
      className="dispatched-element-collapse"
      onClick={() => {
        setIsCompact(!isCompact);
      }}
    >
      {isCompact ? '+' : '-'}
    </button>
  );
}