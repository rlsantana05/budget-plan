import { useCallback, useMemo, useState } from 'react';
import type {
  BudgetTransactionDTO,
  MonthBudgetPlanDTO,
} from '@/types/budget';
import {
  addTransaction,
  deleteTransaction,
  trackTransaction,
} from '@/actions/budget-planning';
import { formatMonthLabel } from '../utils/formatters';
import { toCents } from '../utils/money';
import { useServerSync } from './useServerSync';
import type { PlanningActionState } from './usePlanningActionState';

export function useTransactionsPanel(
  initialData: MonthBudgetPlanDTO | undefined,
  action: PlanningActionState,
) {
  const [transactions, setTransactions] = useState<BudgetTransactionDTO[]>(
    initialData?.transactions ?? [],
  );
  useServerSync(initialData, (latest) => {
    setTransactions(latest.transactions);
  });

  const [activeView, setActiveView] = useState<'summary' | 'transactions'>(
    'transactions',
  );
  const [activeTab, setActiveTab] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txPayee, setTxPayee] = useState('');
  const [txMemo, setTxMemo] = useState('');
  const [txCategory, setTxCategory] = useState<string | null>(null);
  const [txAccount, setTxAccount] = useState<string | null>(null);

  const { busy, error, runTxAction } = action;

  const accounts = useMemo(() => initialData?.accounts ?? [], [initialData]);

  const { categoryOptions, incomeCategoryIds } = useMemo(() => {
    const categories = initialData?.categories ?? [];
    const options = categories.flatMap(
      (g) => (g.items ?? []).map((it) => ({
        value: it.id,
        label: `${g.name} · ${it.name}`,
      })),
    );
    const incomeIds = new Set(
      categories
        .filter((g) => g.name === 'Income')
        .flatMap((g) => (g.items ?? []).map((it) => it.id)),
    );
    return { categoryOptions: options, incomeCategoryIds: incomeIds };
  }, [initialData]);

  const handleAddTransaction = useCallback(() => {
    const amount = txAmount;
    const categoryId = txCategory;
    const accountId = txAccount;
    const payee = txPayee.trim() || null;
    const memo = txMemo.trim() || null;
    const category = categoryOptions.find((c) => c.value === categoryId);
    const account = accounts.find((a) => a.id === accountId);
    if (!accountId) return;
    const tempId = `pending-${Date.now()}`;

    setTransactions((prev) => [
      {
        id: tempId,
        // txAmount is user-entered dollars from the modal; DTO carries cents.
        amountCents: toCents(amount),
        payee,
        memo,
        date: new Date().toISOString(),
        status: 'NEW',
        categoryName: category?.label ?? null,
        categoryId: category?.value ?? null,
        accountName: account?.name ?? null,
        isIncome: !!categoryId && incomeCategoryIds.has(categoryId),
      },
      ...prev,
    ]);
    setAddOpen(false);
    setTxAmount(0);
    setTxPayee('');
    setTxMemo('');
    setTxCategory(null);
    setTxAccount(null);

    runTxAction('add', async () => {
      const created = await addTransaction({
        amount,
        categoryId,
        accountId,
        payee,
        memo,
      });
      setTransactions((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t)));
    });
  }, [
    txAmount,
    txCategory,
    txAccount,
    txPayee,
    txMemo,
    categoryOptions,
    accounts,
    incomeCategoryIds,
    runTxAction,
  ]);

  const handleTrack = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'TRACKED' } : t)));
      runTxAction('row', async () => {
        await trackTransaction(id);
      });
    },
    [runTxAction],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'DELETED' } : t)));
      runTxAction('row', async () => {
        await deleteTransaction(id);
      });
    },
    [runTxAction],
  );

  const activeStatus = activeTab.toUpperCase() as
    | 'NEW'
    | 'TRACKED'
    | 'DELETED';
  const query = searchQuery.trim().toLowerCase();

  const filteredTx = useMemo(
    () => transactions
      .filter((t) => t.status === activeStatus)
      .filter(
        (t) => !query
            || (t.payee ?? '').toLowerCase().includes(query)
            || (t.memo ?? '').toLowerCase().includes(query)
            || (t.categoryName ?? '').toLowerCase().includes(query),
      ),
    [transactions, activeStatus, query],
  );

  const txByMonth = useMemo(() => {
    const map = new Map<string, BudgetTransactionDTO[]>();
    filteredTx.forEach((t) => {
      const label = formatMonthLabel(t.date) || 'Unknown';
      const list = map.get(label) ?? [];
      list.push(t);
      map.set(label, list);
    });
    return map;
  }, [filteredTx]);

  return {
    transactions,
    setTransactions,
    activeView,
    setActiveView,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    addOpen,
    setAddOpen,
    txAmount,
    setTxAmount,
    txPayee,
    setTxPayee,
    txMemo,
    setTxMemo,
    txCategory,
    setTxCategory,
    txAccount,
    setTxAccount,
    handleAddTransaction,
    handleTrack,
    handleDelete,
    filteredTx,
    txByMonth,
    categoryOptions,
    accounts,
    busy,
    error,
  };
}
