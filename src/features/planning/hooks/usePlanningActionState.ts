import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface PlanningActionState {
  busy: 'add' | 'row' | null;
  error: string | null;
  runTxAction: (key: 'add' | 'row', fn: () => Promise<void>) => Promise<void>;
}

export function usePlanningActionState(): PlanningActionState {
  const router = useRouter();
  const [busy, setBusy] = useState<'add' | 'row' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTxAction = useCallback(
    async (key: 'add' | 'row', fn: () => Promise<void>) => {
      setBusy(key);
      setError(null);
      let succeeded = false;
      try {
        await fn();
        succeeded = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        if (!succeeded) router.refresh();
        setBusy(null);
      }
    },
    [router],
  );

  return { busy, error, runTxAction };
}
