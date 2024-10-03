import React, { useEffect, useRef } from "react";
import { get, use } from "../state";



export function PickedValueCursor() {
    const [pickedValue, setPickedValue] = use.pickedValue();
    const ref = useRef();

    useEffect(() => {
        if (pickedValue === '') {
            return;
        }
        const positionElement = (e)=> {
            if (!ref.current) return;
            const mouseY = e.clientY;
            const mouseX = e.clientX;
            
            ref.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        
        }

        const listener = window.addEventListener('mousemove', positionElement)
        return () => {
            window.removeEventListener('mousemove', listener);
        }
    }, [pickedValue]);

    useEffect(() => {
        if (!pickedValue) {
            return;
        }
        const l = document.addEventListener('click', (e) => {
            // console.log(e.target, e.target.classList);
            if (e.target.classList.contains('area') || !e.target.closest('.area')) {
                setPickedValue('');
            }
        });

        return () => {document.removeEventListener('click', l)}
    }, [pickedValue]); 

    if (pickedValue === '') {
        return;
    }

    return <div {...{ref}} style={{ '--picked-value': pickedValue}} className="picked-cursor">{pickedValue}</div>;
}