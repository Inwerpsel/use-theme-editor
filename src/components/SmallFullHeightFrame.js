import { useContext, useEffect, useRef, useState } from 'react';
import { ThemeEditorContext } from './ThemeEditor';

const wrapperMargin = 28;

const scale = 0.05;
const inverseScale = 1 / scale;

export function SmallFullHeightFrame(props) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [windowDragged, setWindowDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(0);
  const [scrollAtStartDrag, setScrollAtStartDrag] = useState(0);
  const [ownPosition, setOwnPosition] = useState(null);
  const [shouldSmoothScroll, setShouldSmoothScroll] = useState(false);
  const [windowHeight, setWindowHeight] = useState(null);
  const { src } = props;
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

  const { width, height, frameRef, scrollFrameRef } =
    useContext(ThemeEditorContext);

  useEffect(() => {
    setTimeout(() => {
      const listener = ({ data: { type, payload } }) => {
        if (type === 'frame-scrolled') {
          setScrollPosition(payload.scrollPosition);
          setOwnPosition(null);
        }
        if (type === 'window-height') {
          setWindowHeight(payload);
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
    }, 900);
  }, []);

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
          width: `${wrapperMargin + parseInt(width)}px`,
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
            width: parseInt(width),
            height: windowHeight,
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
