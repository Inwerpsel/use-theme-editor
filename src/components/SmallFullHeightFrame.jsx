import React, { useContext, useEffect, useRef, useState } from 'react';
import { get, use } from '../state';
import { ThemeEditorContext } from './ThemeEditor';
import { fixupFixedElements, fixupStickyElements, getFixedElements, getStickyElements } from '../functions/fixupFixedElements';
import { useResumableLocalStorage } from '../hooks/useLocalStorage';
import { Checkbox } from './controls/Checkbox';

const wrapperMargin = 28;

// Getting this component to work in any reasonable way is hard in most cases, and impossible in many.
// Some fixed or sticky elements simply don't have a "right" position to be in when you stretch out the page.
// And there are many more CSS configurations that cause all kinds of trouble.
// The result is there's only few cases where you'll actually get a matching frame beyond the top position.
export function SmallFullHeightFrame(props) {
  const { src } = props;
  const { width, height, fullHeightFrameScale: scale, fullHeightFrameShowFixed } = get;
  const inverseScale = 1 / scale;

  const [scrollPosition, setScrollPosition] = useState(0);
  const [windowDragged, setWindowDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(0);
  const [scrollAtStartDrag, setScrollAtStartDrag] = useState(0);
  const [ownPosition, setOwnPosition] = useState(null);
  const [shouldSmoothScroll, setShouldSmoothScroll] = useState(false);
  const [windowHeight, setWindowHeight] = useState(null);
  const cursorRef = useRef();

  useEffect(() => {
    if (ownPosition !== null) {
      frameRef.current?.contentWindow.postMessage(
        {
          type: 'force-scroll',
          payload: { position: ownPosition, shouldSmoothScroll },
        },
        window.location.origin
      );
    }
  }, [ownPosition]);

  const { frameRef, scrollFrameRef } = useContext(ThemeEditorContext);

  useEffect(() => {
    scrollFrameRef.current.contentDocument.documentElement.classList.add('hide-scrollbars')
    setTimeout(() => {
      scrollFrameRef.current.contentDocument.documentElement.classList.add('hide-scrollbars')
      const listener = ({ data: { type, payload } }) => {
        if (type === 'frame-scrolled') {
          setScrollPosition(payload.scrollPosition);
          setOwnPosition(null);
        }
      };
      window.addEventListener('message', listener);
      frameRef.current?.contentWindow.postMessage(
        {
          type: 'emit-scroll',
        },
        window.location.origin
      );
      return () => {
        window.removeEventListener('message', listener);
      };
    }, 2000);
  }, []);

  useEffect(() => {
    const doc = scrollFrameRef.current.contentWindow.document;
    const fixed = getFixedElements(doc); 
    const sticky = getStickyElements(doc); 
    if (!fullHeightFrameShowFixed) {
      // hide
      const fixed = getFixedElements(doc); 
      const sticky = getStickyElements(doc); 

      for (const el of [...fixed, ...sticky]) {
        el.classList.add('hide-important');
      }

      return;
    } else {
      //unhide
      for (const el of [...fixed, ...sticky]) {
        el.classList.remove('hide-important');
      }
    }
  }, [fullHeightFrameShowFixed]);

  useEffect( () => {
    setWindowHeight(frameRef.current.contentWindow.document.body.parentNode.scrollHeight);

    const timeout = setTimeout(() => {
      setWindowHeight(frameRef.current.contentWindow.document.body.parentNode.scrollHeight);
      // Give some time for possible animations that affect the height.
      // It seems a lot but for the Bootstrap masonry demo it's barely enough.
    }, 800);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [width, height]);

  let last = 0;
  useEffect(() => {
    if (!fullHeightFrameShowFixed) {
      return;
    }
    const now = performance.now();
    if (now - last > 50) {
      const doc = scrollFrameRef.current.contentWindow.document;
      const fixed = getFixedElements(doc); 
      const sticky = getStickyElements(doc); 

      last = now;

      fixupStickyElements(sticky, scrollPosition, height, scrollFrameRef.current);
      fixupFixedElements(fixed, scrollPosition, height, scrollFrameRef.current);
    }

    return () => {
    }
  }, [scrollPosition, height, fullHeightFrameShowFixed])

  const top =
    Math.max(
      0,
      (windowDragged ? ownPosition || scrollPosition : scrollPosition) * scale
    );

  const applyDragDelta = (event) => {
    if (windowDragged) {
      setOwnPosition(
        scrollAtStartDrag - (dragStartPos - event.clientY) * inverseScale
      );
      setShouldSmoothScroll(false);
    }
  };

  const jumpFrame = (e) => {
    // Quick fix using parentNode.
    const diff = e.clientY - top - scrollFrameRef.current.parentNode.getBoundingClientRect().top;
    setOwnPosition(Math.max(0, scrollPosition + diff * inverseScale - (height / 2)));
    setShouldSmoothScroll(false);
  };

  return (
    // <div style={{maxHeight: '80vh', border: '1px solid pink'}}>
    // </div>
    (<div
      onWheel={(e) => {
        setOwnPosition(Math.max(0, scrollPosition + e.deltaY));
        setShouldSmoothScroll(true);
      }}
      style={{
        display: windowHeight === null ? 'none' : 'block',
        position: 'relative',
        width: width * scale,
      }}
    >
      <div
        className="responsive-frame-container"
        style={{
          transform: `scale(${scale})`,
          width: `${wrapperMargin + width}px`,
          overflow: 'visible',
          //   padding: '0',
          //   boxSizing: 'border-box',
        }}
      >
        <iframe
          className="responsive-frame"
          ref={scrollFrameRef}
          {...{
            src,
            width,
            height: Math.max(height, windowHeight),
          }}
        />
      </div>
      <div
        onClick={jumpFrame}
        onMouseUp={() => setWindowDragged(false)}
        onMouseMove={applyDragDelta}
        style={{
          zIndex: 1,
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      ></div>
      <span
        ref={cursorRef}
        onClick={jumpFrame}
        onMouseDown={(event) => {
          setWindowDragged(true);
          setDragStartPos(event.clientY);
          setScrollAtStartDrag(scrollPosition);
        }}
        onMouseMove={applyDragDelta}
        onMouseUp={() => setWindowDragged(false)}
        style={{
          userSelect: 'none',
          zIndex: 2,
          top,
          // left: `calc(4px * ${scale})`,
          position: 'absolute',
          display: 'inline-block',
          outline: '3px solid indigo',
          // outlineOffset: '1px',
          width: width * scale,
          height: (height + 12) * scale,
          transition: 'top .05s ease-out',
          boxSizing: 'content-box',
          visibility: windowDragged ? 'hidden' : ''
        }}
      />
    </div>)
  );
}

export function FullHeightFrameScale() {
  const [showFixed, setShowFixed] = use.fullHeightFrameShowFixed();
  const [value, setValue] = use.fullHeightFrameScale();
  const [step, setStep] = useResumableLocalStorage('fullheightframescalestep', '0.01');

  return (
    <div style={{display: 'flex'}}>
      <input
        type="number"
        style={{
          maxWidth: '72px',
        }}
        {...{
          value,
          step,
          onChange: (event) => {
            setValue(event.target.value);
          },
        }}
      />
      <label>
        step
        <input
          type="number"
          style={{
            maxWidth: '72px',
          }}
          {...{
            value: step,
            onChange: (event) => {
              setStep(event.target.value);
            },
          }}
        />
      </label>
      <Checkbox controls={[showFixed, setShowFixed]}>Show fixed and sticky</Checkbox>
    </div>
  );
}

FullHeightFrameScale.fName = 'FullHeightFrameScale'