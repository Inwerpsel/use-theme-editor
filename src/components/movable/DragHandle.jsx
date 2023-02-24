import React, { useContext } from "react"
import { DispatchedElementContext } from "./DispatchedElement"

const lightEnoughColor = 'rgba(0, 0, 0, 0.5)';

export function DragHandle() {
    const {
        setForceDrag,
    } = useContext(DispatchedElementContext);

    return <button
      onMouseDown={() => {
        setForceDrag(true);
        // Amazingly, that's it. The click is able to initiate a drag operation
        // even though the element only becomes draggable after it started (by forceDrag).
        // DispatchedElement sets forceDrag to false when drag ends.
      }}
      style={{
        transform: 'rotate(90deg)',
        background: 'transparent',
        color: lightEnoughColor,
        borderColor: lightEnoughColor,
      }}
    >|||</button>
}