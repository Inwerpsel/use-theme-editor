import React, { useContext } from "react"
import { MovableElementContext } from "./MovableElement"

const lightEnoughColor = 'rgba(0, 0, 0, 0.5)';

export function DragHandle() {
    const {
        setForceDrag,
    } = useContext(MovableElementContext);

    return <button
      onMouseDown={() => {
        setForceDrag(true);
        // Amazingly, that's it. The click is able to initiate a drag operation
        // even though the element only becomes draggable after it started (by forceDrag).
        // MovableElement sets forceDrag to false when drag ends.
      }}
      style={{
        transform: 'rotate(90deg)',
        background: 'transparent',
        color: lightEnoughColor,
        borderColor: lightEnoughColor,
      }}
    >|||</button>
}