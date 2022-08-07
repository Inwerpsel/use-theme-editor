import { useMemo, useRef } from 'react';

function throttledSetter(ref, onChange, value, options) {
  const leading = options.leading !== false;
  ref.current.latest = value;

  if (ref.current.running) {
    return;
  }

  const loop = (first = false) => {
    ref.current.running = ref.current.latest !== null;

    // No new value was added since last committed value so the loop can stop here.
    if (!ref.current.running) {
      return;
    }

    // Call callback with latest and keep running.
    if (!first || leading) {
      onChange(ref.current.latest);
      ref.current.latest = null;
    }
    setTimeout(loop, options.ms || 50);
  };

  loop(true);
}

// This is useful in case you're not debouncing because the function itself is expensive, but if you want to avoid
// triggering too many renders when manipulating state.
//
export const useThrottler = (options) => {
  // tests
  const ref = useRef({});

  // Memo is fine here as it's just an optimization. React de facto won't discard it, and if it would it's not a problem.
  return useMemo(() => (onChange, value) => throttledSetter(ref, onChange, value, options), []);
};
