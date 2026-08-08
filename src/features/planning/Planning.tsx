'use client';

import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { MonthBudgetPlanDTO } from '@/types/budget';
import { assignToTargets, setCategoryTarget } from '@/actions/budget-planning';
import type { GroupItem } from './types';
import type { TargetFormState } from './components/PlanningTargetModal';
import { useMonthNavigation } from './hooks/useMonthNavigation';
import { usePlanningActionState } from './hooks/usePlanningActionState';
import { useBudgetGroups } from './hooks/useBudgetGroups';
import { useTransactionsPanel } from './hooks/useTransactionsPanel';
import { usePlannedSummary } from './hooks/usePlannedSummary';
import PlanningMonthHeader from './components/PlanningMonthHeader';
import PlanningBudgetBanner from './components/PlanningBudgetBanner';
import PlanningBudgetGroupList from './components/PlanningBudgetGroupList';
import PlanningTransactionsPanel from './components/PlanningTransactionsPanel';
import PlanningAddTransactionFab from './components/PlanningAddTransactionFab';
import PlanningAddTransactionModal from './components/PlanningAddTransactionModal';
import PlanningUndoToast from './components/PlanningUndoToast';
import classes from './Planning.module.css';

interface PlanningProps {
  initialData?: MonthBudgetPlanDTO;
  selectedMonth?: string;
}

export default function Planning({ initialData, selectedMonth }: PlanningProps) {
  const nav = useMonthNavigation(selectedMonth, initialData?.month);
  const action = usePlanningActionState();
  const groups = useBudgetGroups(initialData, action);
  const panel = useTransactionsPanel(initialData, action);
  const { categories: plannedCategories } = usePlannedSummary(groups.groups);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(() => groups.groups
    .flatMap((g) => g.items)
    .find((it) => it.id === selectedItemId) ?? null, [groups.groups, selectedItemId]);

  const reduceMotion = useReducedMotion();
  const motionTransition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: 'easeOut' as const,
  };

  const bannerAmount = useMemo(() => {
    const income = groups.groups
      .filter((g) => g.isIncome)
      .flatMap((g) => g.items)
      .reduce((sum, it) => sum + it.planned, 0);
    const spending = groups.groups
      .filter((g) => !g.isIncome)
      .flatMap((g) => g.items)
      .reduce((sum, it) => sum + it.planned, 0);
    return income - spending;
  }, [groups.groups]);
  let bannerLabel = 'on budget';
  if (bannerAmount < 0) bannerLabel = 'over budget';
  if (bannerAmount > 0) bannerLabel = 'left to budget';

  const readyToAssign = useMemo(() => {
    const received = groups.groups
      .filter((g) => g.isIncome)
      .flatMap((g) => g.items)
      .reduce((sum, it) => sum + it.received, 0);
    const assigned = groups.groups
      .flatMap((g) => g.items)
      .reduce((sum, it) => sum + it.funded, 0);
    return received - assigned;
  }, [groups.groups]);

  const handleAssign = useCallback(
    (item: GroupItem) => {
      action.runTxAction('row', async () => {
        await assignToTargets([item.id]);
      });
    },
    [action],
  );

  const handleAssignAll = useCallback(() => {
    action.runTxAction('row', async () => {
      await assignToTargets();
    });
  }, [action]);

  const handleSaveTarget = useCallback(
    (item: GroupItem, form: TargetFormState) => {
      let input: {
        type: 'NONE' | 'ONCE' | 'MONTHLY';
        amount?: number;
        dueDate?: string | null;
        monthDay?: number | null;
      };
      if (form.type === 'NONE') {
        input = { type: 'NONE' };
      } else if (form.type === 'ONCE') {
        input = {
          type: 'ONCE',
          amount: form.amount,
          dueDate: form.dueDate,
        };
      } else {
        input = {
          type: 'MONTHLY',
          amount: form.amount,
          monthDay: Number(form.monthDay),
        };
      }
      action.runTxAction('row', async () => {
        await setCategoryTarget(item.id, input);
      });
    },
    [action],
  );

  const handleSelectItem = useCallback((item: GroupItem) => {
    setSelectedItemId(item.id);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest('[data-category-row]')) return;
      if (target.closest('[data-hub-panel]')) return;
      setSelectedItemId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  return (
    <div className={classes.page}>
      <PlanningMonthHeader
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
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={nav.selectedValue}
            className={classes.leftCol}
            initial={{ opacity: 0, x: nav.navDir * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: nav.navDir * -28 }}
            transition={motionTransition}
          >
            <PlanningBudgetGroupList
              banner={(
                <PlanningBudgetBanner
                  amount={bannerAmount}
                  label={bannerLabel}
                />
              )}
              groups={groups.groups}
              expandedGroups={groups.expandedGroups}
              onToggleGroup={groups.toggleGroup}
              onReorder={groups.handleReorderItems}
              onReorderCommit={groups.handleReorderCommit}
              onUpdateItem={groups.handleUpdateItem}
              onAssignAmount={groups.handleAssignAmount}
              busy={action.busy}
              deleteArmingId={groups.deleteArmingId}
              onArmDelete={groups.setDeleteArmingId}
              onDeleteItem={groups.handleDeleteItem}
              onReceiveIncome={groups.handleReceiveIncome}
              selectedItemId={selectedItem?.id ?? null}
              onSelectItem={handleSelectItem}
              addItemGroup={groups.addItemGroup}
              onBeginAddItem={groups.beginAddItem}
              newItemName={groups.newItemName}
              onNewItemNameChange={groups.setNewItemName}
              amountText={groups.amountText}
              onAmountChange={groups.handleAmountInputChange}
              onAddItem={groups.handleAddItem}
              onCancelAdd={groups.cancelAddItem}
              nameInputRef={groups.nameInputRef}
              amountInputRef={groups.amountInputRef}
              receiveHint={groups.receiveHint}
            />
          </motion.div>
        </AnimatePresence>

        <PlanningTransactionsPanel
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
          readyToAssign={readyToAssign}
          onSaveTarget={handleSaveTarget}
          targetBusy={action.busy === 'row'}
          onAssignAll={handleAssignAll}
          assignAllBusy={action.busy === 'row'}
        />
      </div>

      <PlanningAddTransactionFab onClick={() => panel.setAddOpen(true)} />

      <PlanningAddTransactionModal
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

      <PlanningUndoToast undo={groups.undo} onUndo={groups.handleUndoDelete} />
    </div>
  );
}
