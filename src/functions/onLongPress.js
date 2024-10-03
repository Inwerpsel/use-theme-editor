export function onLongPress(callback) {
  let timeout;
  let preventClick = false;

  function start() {
    timeout = setTimeout(() => {
      preventClick = true;
      callback();
    }, 400);
  }

  function clear() {
    timeout && clearTimeout(timeout);
    preventClick = false;
  }

  function clickCaptureHandler(e) {
    if (preventClick) {
      e.stopPropagation();
      preventClick = false;
    }
  }

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onDrag: clear,
    onMouseLeave: clear,
    onTouchMove: clear,
    onTouchEnd: clear,
    onClickCapture: clickCaptureHandler
  };
}