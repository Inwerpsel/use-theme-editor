import React, { useContext, useEffect, useRef, useState } from 'react';
import { get } from '../state';
import { ThemeEditorContext } from './ThemeEditor';

const wrapperMargin = 28;

const scale = 0.05;
const inverseScale = 1 / scale;

// Getting this component to work in any reasonable way is hard in most cases, and impossible in many.
// Some fixed or sticky elements simply don't have a "right" position to be in when you stretch out the page.
// And there are many more CSS configurations that cause all kinds of trouble.
// The result is there's only few cases where you'll actually get a matching frame beyond the top position.
export function SmallFullHeightFrame(props) {
  const { src } = props;
  const { width, height } = get;

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
    setTimeout(() => {
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
    }, 1000);
  }, []);

  useEffect( () => {
    setWindowHeight(frameRef.current.contentWindow.document.body.scrollHeight);

    const timeout = setTimeout(() => {
      setWindowHeight(frameRef.current.contentWindow.document.body.scrollHeight);
      // Give some time for possible animations that affect the height.
      // It seems a lot but for the Bootstrap masonry demo it's barely enough.
    }, 500);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [width, height]);

  const top =
    Math.max(
      0,
      (windowDragged ? ownPosition || scrollPosition : scrollPosition) * scale
    ) - 2;

  const applyDragDelta = (event) => {
    if (windowDragged) {
      setOwnPosition(
        scrollAtStartDrag - (dragStartPos - event.clientY) * inverseScale
      );
      setShouldSmoothScroll(false);
    }
  };

  const jumpFrame = (e) => {
    const diff = e.clientY - top - 1.5 * cursorRef.current.offsetHeight;
    setOwnPosition(scrollPosition + diff * inverseScale);
    setShouldSmoothScroll(false);
  };

  return (
    <div
      onWheel={(e) => {
        setOwnPosition(Math.max(0, scrollPosition + e.deltaY * 6));
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
          left: -2,
          position: 'absolute',
          display: 'inline-block',
          border: '2px solid yellow',
          width: width * scale,
          height: height * scale,
          transition: 'top .05s ease-out',
          boxSizing: 'content-box',
        }}
      />
    </div>
  );
}
