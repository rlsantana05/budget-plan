import { useState } from "react";

/**
 * Re-sync local state from the server once a background refresh lands.
 * Adjusted during render (not in an effect) so optimistic patches persist
 * until the server payload actually changes.
 */
export function useServerSync<T>(
  initial: T | undefined,
  apply: (latest: T) => void,
) {
  const [synced, setSynced] = useState<T | undefined>(initial);
  if (synced !== initial) {
    setSynced(initial);
    if (initial) apply(initial);
  }
}