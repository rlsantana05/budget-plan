'use client';

import { useState } from 'react';
import { DonutChart } from '@mantine/charts';
import {
  Box,
  Table,
  Tabs,
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

type SummaryMetric = 'planned' | 'spent' | 'remaining';

const SUMMARY_METRIC_LABELS: Record<SummaryMetric, string> = {
  planned: 'Planned',
  spent: 'Spent',
  remaining: 'Remaining',
};

function SummaryDonutChart({
  plannedCategories,
  metric,
}: {
  plannedCategories: PlanningCategory[];
  metric: SummaryMetric;
}) {
  const data = plannedCategories
    .filter((cat) => !cat.isIncome)
    .map((cat, index) => ({
      name: cat.name,
      value: cat[metric],
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .filter((item) => item.value > 0);

  return (
    <Box h={200}>
      <Center h="100%">
        <DonutChart size={180} thickness={22} withTooltip data={data} />
      </Center>
    </Box>
  );
}

const SUMMARY_METRICS: SummaryMetric[] = ['planned', 'spent', 'remaining'];

function SummaryValueTable({
  categories,
  metric,
}: {
  categories: PlanningCategory[];
  metric: SummaryMetric;
}) {
  return (
    <Table horizontalSpacing={8} verticalSpacing={6}>
      <Table.Tbody>
        {categories.map((cat, index) => {
          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          return (
            <Table.Tr key={cat.name}>
              <Table.Td>
                <div className={classes.categoryCell}>
                  <span
                    className={classes.categoryDot}
                    style={{ backgroundColor: color }}
                  />
                  <Text size="sm" fw={500} c={color} className={classes.categoryName}>
                    {cat.name}
                  </Text>
                </div>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text size="sm" fw={600} tabular-nums>
                  $
                  {cat[metric].toFixed(2)}
                </Text>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}

function SummaryTable({
  plannedCategories,
  metric,
  onMetricChange,
}: {
  plannedCategories: PlanningCategory[];
  metric: SummaryMetric;
  onMetricChange: (metric: SummaryMetric) => void;
}) {
  const categories = plannedCategories.filter((cat) => !cat.isIncome);

  return (
    <Tabs
      value={metric}
      onChange={(value) => {
        if (value) onMetricChange(value as SummaryMetric);
      }}
      unstyled
    >
      <Tabs.List classNames={{ list: classes.summaryTabList }}>
        {SUMMARY_METRICS.map((m) => (
          <Tabs.Tab key={m} value={m} classNames={{ tab: classes.summaryTab }}>
            {SUMMARY_METRIC_LABELS[m]}
            {metric === m && <span className={classes.summaryTabUnderline} />}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {SUMMARY_METRICS.map((m) => (
        <Tabs.Panel key={m} value={m} pt="sm">
          <SummaryValueTable categories={categories} metric={m} />
        </Tabs.Panel>
      ))}
    </Tabs>
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
  const [metric, setMetric] = useState<SummaryMetric>('spent');

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
          <SummaryDonutChart plannedCategories={plannedCategories} metric={metric} />
          <SummaryTable
            plannedCategories={plannedCategories}
            metric={metric}
            onMetricChange={setMetric}
          />
        </div>
      )}
    </aside>
  );
}
