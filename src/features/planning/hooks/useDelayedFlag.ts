import { useEffect, useState } from 'react';

/**
 * Returns true only after `value` has stayed truthy for `delayMs`.
 * Prevents loading spinners from flashing during fast operations.
 */
export function useDelayedFlag(value: boolean, delayMs = 300): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!value) {
      setShow(false);
      return undefined;
    }
    const timer = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return show;
}
