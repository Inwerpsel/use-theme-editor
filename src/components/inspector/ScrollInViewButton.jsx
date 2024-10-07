import React, { useContext, useState } from "react";
import { ThemeEditorContext } from "../ThemeEditor";

export function ScrollInViewButton(props) {
    const { path } = props;
    const [dragged, setDragged] = useState(false);

    const {
        frameRef,
    } = useContext(ThemeEditorContext);

    return <button
        draggable
        onDragStart={(event) => {
            setDragged(true);
            event.stopPropagation();
        }}
        onDragEnd={() => {
            setDragged(false);
        }}
        onDragLeave={(event) => {
            if (!dragged) {
                return;
            }
            const isToRight = event.clientX > event.currentTarget.getBoundingClientRect().right;
            const isToLeft = event.clientX < event.currentTarget.getBoundingClientRect().left
            const isAbove = event.clientY < event.currentTarget.getBoundingClientRect().top;
            const isBelow = event.clientY > event.currentTarget.getBoundingClientRect().bottom;
            const options = {
                        behavior: 'smooth',
                        block: isAbove ? 'start' : isBelow ? 'end' : 'center',
                        inline: isToRight ? 'end' : isToLeft ? 'start' : 'center',
                        // inline: 'start',
                    };
            frameRef.current.contentWindow.postMessage(
                {
                    type: 'scroll-in-view', payload: { path, options }
                },
                window.location.href,
            );
            
        }}
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
        onClick={() => {
            if (frameRef.current) {
                frameRef.current.contentWindow.postMessage(
                    {
                        type: 'scroll-in-view', payload: { path }
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