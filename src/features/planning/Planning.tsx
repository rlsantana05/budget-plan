"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { MonthBudgetPlanDTO } from "@/types/budget";
import { useMonthNavigation } from "./hooks/useMonthNavigation";
import { usePlanningActionState } from "./hooks/usePlanningActionState";
import { useBudgetGroups } from "./hooks/useBudgetGroups";
import { useTransactionsPanel } from "./hooks/useTransactionsPanel";
import PlanningMonthHeader from "./components/PlanningMonthHeader";
import PlanningBudgetBanner from "./components/PlanningBudgetBanner";
import PlanningBudgetGroupList from "./components/PlanningBudgetGroupList";
import PlanningTransactionsPanel from "./components/PlanningTransactionsPanel";
import PlanningAddTransactionFab from "./components/PlanningAddTransactionFab";
import PlanningAddTransactionModal from "./components/PlanningAddTransactionModal";
import PlanningUndoToast from "./components/PlanningUndoToast";
import classes from "./Planning.module.css";

interface PlanningProps {
  initialData?: MonthBudgetPlanDTO;
  selectedMonth?: string;
}

export default function Planning({ initialData, selectedMonth }: PlanningProps) {
  const nav = useMonthNavigation(selectedMonth, initialData?.month);
  const action = usePlanningActionState();
  const groups = useBudgetGroups(initialData, action);
  const panel = useTransactionsPanel(initialData, action);

  const reduceMotion = useReducedMotion();
  const motionTransition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: "easeOut" as const,
  };

  const bannerAmount = initialData?.budgetStatus?.amount ?? 2705;
  const bannerLabel = initialData?.budgetStatus?.label ?? "over budget";

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
              banner={
                <PlanningBudgetBanner
                  amount={bannerAmount}
                  label={bannerLabel}
                />
              }
              groups={groups.groups}
              expandedGroups={groups.expandedGroups}
              onToggleGroup={groups.toggleGroup}
              onReorder={groups.handleReorderItems}
              editingItemId={groups.editingItemId}
              editName={groups.editName}
              onEditNameChange={groups.setEditName}
              editPlanned={groups.editPlanned}
              onEditPlannedChange={groups.setEditPlanned}
              onSaveEdit={groups.handleUpdateItem}
              onCancelEdit={() => groups.setEditingItemId(null)}
              onStartEdit={groups.startEditItem}
              busy={action.busy}
              deleteArmingId={groups.deleteArmingId}
              onArmDelete={groups.setDeleteArmingId}
              onDeleteItem={groups.handleDeleteItem}
              onReceiveIncome={groups.handleReceiveIncome}
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