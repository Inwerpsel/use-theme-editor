import {useMemo, useRef} from 'react';

const fps = 20;
const frameTime = 1000 / fps;

// Not really debounced, because this immediately executes the handler, then starts debouncing.
//
function debounced(ref, value, callback) {
  ref.current.latest = value;

  if (ref.current.running) {
    return;
  }

  const loop = () => {
    if (ref.current.latest) {
      // Call callback with latest and keep running.
      callback(ref.current.latest);
      setTimeout(loop, frameTime);
      ref.current.running = true;
      ref.current.latest = null;
    } else {
      ref.current.running = false;
    }
  };
  loop();
}

// This is useful in case you're not debouncing because the function itself is expensive, but if you want to avoid
// triggering too many renders when manipulating state.
//
export const useDebounce = () => {
  const debounceRef = useRef({});

  return useMemo(() => {
    return (value, onChange) => {
      debounced(debounceRef, value, onChange);
    };
  }, []);
};
