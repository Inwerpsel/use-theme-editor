import { DragEvent } from "react";

function listener(getValue, event) {
    event.dataTransfer.setData('value', typeof getValue === 'function' ? getValue() : getValue);
    event.stopPropagation();
}

export function dragValue(getValue: string|(() => string)) {
    return listener.bind(null, getValue);
}