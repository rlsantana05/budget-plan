'use client';

import type { BudgetTransactionDTO } from '@/types/budget';
import sharedClasses from '../styles/PlanningShared.module.css';
import PlanningViewToggle from './PlanningViewToggle';
import PlanningStatusSubtabs from './PlanningStatusSubtabs';
import PlanningTransactionSearch from './PlanningTransactionSearch';
import PlanningTransactionList from './PlanningTransactionList';
import listClasses from './PlanningTransactionList.module.css';
import classes from './PlanningTransactionsPanel.module.css';

interface PlanningTransactionsPanelProps {
  activeView: 'summary' | 'transactions';
  onViewChange: (view: 'summary' | 'transactions') => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  month: string;
  txByMonth: Map<string, BudgetTransactionDTO[]>;
  filteredTx: BudgetTransactionDTO[];
  error: string | null;
  busy: 'add' | 'row' | null;
  onTrack: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PlanningTransactionsPanel({
  activeView,
  onViewChange,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchQueryChange,
  month,
  txByMonth,
  filteredTx,
  error,
  busy,
  onTrack,
  onDelete,
}: PlanningTransactionsPanelProps) {
  return (
    <aside className={classes.rightCol}>
      <PlanningViewToggle
        activeView={activeView}
        onViewChange={onViewChange}
      />

      <PlanningStatusSubtabs activeTab={activeTab} onTabChange={onTabChange} />

      {activeView === 'transactions' ? (
        <>
          <PlanningTransactionSearch
            searchQuery={searchQuery}
            onChange={onSearchQueryChange}
          />

          <PlanningTransactionList
            groups={[...txByMonth.entries()].map(([label, txs]) => ({
              label,
              txs,
            }))}
            busy={busy}
            onTrack={onTrack}
            onDelete={onDelete}
          />

          {filteredTx.length === 0 && (
            <div className={listClasses.monthGroup}>
              <div className={listClasses.monthLabel}>{month}</div>
              <div className={listClasses.empty}>No transactions</div>
            </div>
          )}

          {error && <div className={sharedClasses.error}>{error}</div>}
        </>
      ) : (
        <div className={classes.summaryPlaceholder}>
          Summary view – not implemented in this prototype.
        </div>
      )}
    </aside>
  );
}
