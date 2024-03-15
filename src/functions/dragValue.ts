import { DragEvent } from "react";

function listener(getValue, then, event) {
    event.dataTransfer.setData('value', typeof getValue === 'function' ? getValue() : getValue);
    event.dataTransfer.setData('text/plain', typeof getValue === 'function' ? getValue() : getValue);
    event.stopPropagation();
    then();
}

export function dragValue(getValue: string|(() => string), then = () => {}) {
    return listener.bind(null, getValue, then);
}