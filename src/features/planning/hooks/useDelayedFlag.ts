import { useEffect, useState } from 'react';

/**
 * Returns true only after `value` has stayed truthy for `delayMs`.
 * Prevents loading spinners from flashing during fast operations.
 *
 * Implementation note: the false branch resets state synchronously during
 * render (the "derived reset" pattern) rather than in an effect, avoiding
 * cascading renders. See https://react.dev/learn/you-might-not-need-an-effect.
 */
export function useDelayedFlag(value: boolean, delayMs = 300): boolean {
  const [show, setShow] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  // Derived-state reset during render (React-endorsed pattern).
  if (value !== prevValue) {
    setPrevValue(value);
    if (!value) setShow(false);
  }

  useEffect(() => {
    if (!value) return undefined;
    const timer = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return show;
}
