import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { MonthBudgetPlanDTO } from '@/types/budget';
import { MOCK_GROUPS } from '../../../constants';
import { toGroups } from '../../../utils/mappers';
import type { PlanningActionState } from '../../../hooks/usePlanningActionState';
import { useBudgetGroupsStore } from '../../../store/budgetGroupsStore';

interface BudgetGroupsProviderProps {
  initialData?: MonthBudgetPlanDTO;
  action: PlanningActionState;
  children: ReactNode;
}

export function BudgetGroupsProvider({
  initialData,
  action,
  children,
}: BudgetGroupsProviderProps) {
  const store = useBudgetGroupsStore;

  /**
   * Re-sync the store whenever the server payload changes (e.g. after
   * router.refresh). Runs in an effect (after commit) so updating the store
   * never happens mid-render; optimistic patches persist until the server
   * payload actually changes.
   */
  useEffect(() => {
    store.getState().hydrateGroups(initialData ? toGroups(initialData) : MOCK_GROUPS);
  }, [initialData, store]);

  useEffect(() => {
    store.getState().registerTxActions(action.runTxAction);
  }, [store, action.runTxAction]);

  useEffect(() => {
    store.getState().setBusy(action.busy);
  }, [store, action.busy]);

  useEffect(() => {
    store.getState().setHasAccounts((initialData?.accounts ?? []).length > 0);
  }, [initialData, store]);

  useEffect(() => {
    store.getState().setAvailableToAssign(initialData?.availableToAssignCents ?? 0);
  }, [initialData, store]);

  return children;
}
