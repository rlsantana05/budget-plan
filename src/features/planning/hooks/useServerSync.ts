import { useEffect } from 'react';

/**
 * Re-sync local state from the server once a background refresh lands.
 * Runs in an effect so the store update never happens during render.
 */
export function useServerSync<T>(
  initial: T | undefined,
  apply: (latest: T) => void,
) {
  useEffect(() => {
    if (initial) apply(initial);
  }, [initial, apply]);
}
