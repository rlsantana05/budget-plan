'use client';

import {
  Box,
  Table,
  Text,
  Center,
} from '@mantine/core';
import type { BudgetTransactionDTO } from '@/types/budget';
import type { PlanningCategory } from '../types';
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
  plannedCategories: PlanningCategory[];
}

function SummaryCircleChart() {
  return (
    <Box h={200}>
      <Center h="100%">
        <Text c="dimmed">Circle Chart Placeholder</Text>
      </Center>
    </Box>
  );
}

const CATEGORY_COLORS = [
  'var(--mantine-color-indigo-5)',
  'var(--mantine-color-teal-5)',
  'var(--mantine-color-orange-5)',
  'var(--mantine-color-grape-5)',
  'var(--mantine-color-cyan-5)',
  'var(--mantine-color-pink-5)',
  'var(--mantine-color-lime-5)',
  'var(--mantine-color-red-5)',
  'var(--mantine-color-blue-5)',
  'var(--mantine-color-yellow-5)',
];

function SummaryTable({ plannedCategories }: { plannedCategories: PlanningCategory[] }) {
  const headers = ['Planned', 'Spent', 'Remaining'];

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          {headers.map((label) => (
            <Table.Th key={label} align="center">
              <Text size="xs" fw={700} c="dimmed">
                {label}
              </Text>
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {plannedCategories.map((cat, index) => {
          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          return (
            <Table.Tr key={cat.name}>
              <Table.Td>
                <div className={classes.categoryCell}>
                  <span
                    className={classes.categoryDot}
                    style={{ backgroundColor: color }}
                  />
                  <Text fw={500} c={color}>{cat.name}</Text>
                </div>
              </Table.Td>
              <Table.Td align="center">
                <Text fw={500}>
                  $
                  {cat.spent.toFixed(2)}
                </Text>
              </Table.Td>
              <Table.Td align="center">
                <Text fw={500}>
                  $
                  {cat.remaining.toFixed(2)}
                </Text>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
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
  plannedCategories,
}: PlanningTransactionsPanelProps) {
  return (
    <aside className={classes.rightCol}>
      <PlanningViewToggle activeView={activeView} onViewChange={onViewChange} />

      {activeView === 'transactions' && (
        <PlanningStatusSubtabs activeTab={activeTab} onTabChange={onTabChange} />
      )}

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
        <div className={classes.summaryView}>
          <SummaryCircleChart />
          <SummaryTable plannedCategories={plannedCategories} />
        </div>
      )}
    </aside>
  );
}
