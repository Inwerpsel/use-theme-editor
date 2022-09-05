import React, { useContext } from "react";
import { ThemeEditorContext } from "../ThemeEditor";

export function ScrollInViewButton(props) {
    const { element } = props;

    const {
        frameRef,
    } = useContext(ThemeEditorContext);

    return <button
        title='Scroll in view'
        className='scroll-in-view'
        style={{
            border: '1px solid gray',
            background: 'white',
            borderRadius: '5px',
            padding: '4px',
            fontSize: '12px',
            float: 'right',
            cursor: 'zoom-in',
        }}
        disabled={frameRef.current && isNaN(element)}
        onClick={() => {
            if (frameRef.current) {
                frameRef.current.contentWindow.postMessage(
                    {
                        type: 'scroll-in-view', payload: { index: element }
                    },
                    window.location.href,
                );
                return;
            }
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'end',
            });
        }}
    >👁
    </button>;
}