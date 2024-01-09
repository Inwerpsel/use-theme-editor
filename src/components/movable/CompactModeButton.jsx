import React from 'react';
import { useCompactSetting } from './MovableElement';

export function CompactModeButton() {
  const [isCompact, setIsCompact] = useCompactSetting();

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