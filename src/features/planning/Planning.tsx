'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  useCallback, useEffect, useMemo,
} from 'react';

import { assignToTargets, setCategoryTarget } from '@/actions/budget-planning';
import type { MonthBudgetPlanDTO } from '@/types/budget';

import BudgetBanner from './components/budget/BudgetBanner/BudgetBanner';
import Income from './components/budget/Income';
import BudgetGroupListWithHeader from './components/budget-group/BudgetGroupListWithHeader/BudgetGroupListWithHeader';
import { BudgetGroupsProvider } from './components/budget-group/BudgetGroupsProvider/BudgetGroupsProvider';
import type { TargetFormState } from './components/category/TargetModal/TargetModal';
import MonthHeader from './components/layout/MonthHeader/MonthHeader';
import UndoToast from './components/layout/UndoToast/UndoToast';
import TransactionsFab from './components/transactions/TransactionsFab/TransactionsFab';
import TransactionsModal from './components/transactions/TransactionsModal/TransactionsModal';
import TransactionsPanel from './components/transactions/TransactionsPanel/TransactionsPanel';
import { useMonthNavigation } from './hooks/useMonthNavigation';
import { usePlannedSummary } from './hooks/usePlannedSummary';
import { usePlanningActionState } from './hooks/usePlanningActionState';
import { useTransactionsPanel } from './hooks/useTransactionsPanel';
import classes from './Planning.module.css';
import { useBudgetGroupsStore } from './store/budgetGroupsStore';
import type { GroupItem } from './types';
import { toCents } from './utils/money';

interface PlanningProps {
  initialData?: MonthBudgetPlanDTO;
  selectedMonth?: string;
}

export default function Planning({ initialData, selectedMonth }: PlanningProps) {
  const nav = useMonthNavigation(selectedMonth, initialData?.month);
  const action = usePlanningActionState();
  const groups = useBudgetGroupsStore((s) => s.groups);
  const availableToAssign = useBudgetGroupsStore((s) => s.availableToAssign);
  const panel = useTransactionsPanel(initialData, action);
  const { categories: plannedCategories } = usePlannedSummary(groups);
  const selectedItemId = useBudgetGroupsStore((s) => s.selectedItemId);
  const setSelectedItemId = useBudgetGroupsStore((s) => s.setSelectedItemId);

  useEffect(() => {
    setSelectedItemId(null);
  }, [nav.selectedValue, setSelectedItemId]);

  const selectedItem = useMemo(() => groups
    .flatMap((g) => g.items)
    .find((it) => it.id === selectedItemId) ?? null, [groups, selectedItemId]);

  const reduceMotion = useReducedMotion();
  const motionTransition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: 'easeOut' as const,
  };

  const handleAssign = useCallback(
    (item: GroupItem) => {
      action.runTxAction('row', async () => {
        await assignToTargets([item.id]);
      });
    },
    [action],
  );

  const handleSaveTarget = useCallback(
    (item: GroupItem, targetForm: TargetFormState) => {
      let input: {
        type: 'NONE' | 'ONCE' | 'MONTHLY';
        amountCents?: number;
        dueDate?: string | null;
        monthDay?: number | null;
      };

      if (targetForm.type === 'NONE') {
        input = { type: 'NONE' };
      } else if (targetForm.type === 'ONCE') {
        input = {
          type: 'ONCE',
          amountCents: toCents(targetForm.amount),
          dueDate: targetForm.dueDate,
        };
      } else {
        input = {
          type: 'MONTHLY',
          amountCents: toCents(targetForm.amount),
          monthDay: Number(targetForm.monthDay),
        };
      }

      action.runTxAction('row', async () => {
        await setCategoryTarget(item.id, input);
      });
    },
    [action],
  );

  return (
    <div className={classes.page}>
      <MonthHeader
        month={nav.month}
        year={nav.year}
        pickerOpened={nav.pickerOpened}
        onPickerToggle={nav.handlePickerToggle}
        onPickerClose={nav.closePicker}
        pickerYear={nav.pickerYear}
        onPickerYearChange={nav.setPickerYear}
        pickerMonths={nav.pickerMonths}
        selectedValue={nav.selectedValue}
        currentValue={nav.currentValue}
        onGoToMonth={nav.goToMonth}
      />

      <div className={classes.layout}>
        <BudgetGroupsProvider initialData={initialData} action={action}>
          <Income />
          <BudgetBanner groups={groups} />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={nav.selectedValue}
              className={classes.leftCol}
              initial={{ opacity: 0, x: nav.navDir * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: nav.navDir * -28 }}
              transition={motionTransition}
            >
              <BudgetGroupListWithHeader />
            </motion.div>
          </AnimatePresence>
        </BudgetGroupsProvider>

        <TransactionsPanel
          activeView={panel.activeView}
          onViewChange={panel.setActiveView}
          activeTab={panel.activeTab}
          onTabChange={panel.setActiveTab}
          searchQuery={panel.searchQuery}
          onSearchQueryChange={panel.setSearchQuery}
          month={nav.month}
          txByMonth={panel.txByMonth}
          filteredTx={panel.filteredTx}
          error={action.error}
          busy={action.busy}
          onTrack={panel.handleTrack}
          onDelete={panel.handleDelete}
          plannedCategories={plannedCategories}
          selectedItem={selectedItem}
          onClearSelected={() => setSelectedItemId(null)}
          onAssign={handleAssign}
          readyToAssign={availableToAssign}
          onSaveTarget={handleSaveTarget}
          targetBusy={action.busy === 'row'}
        />
      </div>

      <TransactionsFab onClick={() => panel.setAddOpen(true)} />

      <TransactionsModal
        opened={panel.addOpen}
        onClose={() => panel.setAddOpen(false)}
        categoryOptions={panel.categoryOptions}
        accountOptions={panel.accounts}
        txAmount={panel.txAmount}
        onTxAmountChange={panel.setTxAmount}
        txPayee={panel.txPayee}
        onTxPayeeChange={panel.setTxPayee}
        txMemo={panel.txMemo}
        onTxMemoChange={panel.setTxMemo}
        txCategory={panel.txCategory}
        onTxCategoryChange={panel.setTxCategory}
        txAccount={panel.txAccount}
        onTxAccountChange={panel.setTxAccount}
        onSubmit={panel.handleAddTransaction}
        busy={action.busy}
        error={action.error}
      />

      <UndoToast />
    </div>
  );
}
