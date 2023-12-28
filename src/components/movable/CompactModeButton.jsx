import React from 'react';

export function CompactModeButton(props) {
  const { isCompact, setIsCompact } = props;

  return (
    <button
      className="movable-element-collapse"
      onClick={() => {
        setIsCompact(!isCompact);
      }}
    >
      {isCompact ? '+' : '-'}
    </button>
  );
}