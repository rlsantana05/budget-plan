import {
  beforeEach,
  describe,
  expect,
  it as testFn,
  vi,
} from 'vitest';
import { useBudgetGroupsStore } from './budgetGroupsStore';
import type { Group, GroupItem } from '../types';

vi.mock('@/actions/budget-planning', () => ({
  addCategoryItem: vi.fn(),
  deleteCategoryItem: vi.fn(),
  receivePlannedIncome: vi.fn(),
  reorderCategoryItems: vi.fn(),
  restoreCategoryItem: vi.fn(),
  setCategoryAssigned: vi.fn(),
  updateCategoryItem: vi.fn(),
}));

function item(id: string, over: Partial<GroupItem> = {}): GroupItem {
  return {
    id,
    clientId: id,
    name: `Item ${id}`,
    dueDate: null,
    plannedCents: 0,
    fundedCents: 0,
    spentCents: 0,
    receivedCents: 0,
    remainingCents: 0,
    transactionCount: 0,
    templateId: null,
    targetType: 'NONE',
    targetAmountCents: 0,
    targetDue: null,
    targetDate: null,
    targetMonthDay: null,
    neededCents: 0,
    trend: [],
    ...over,
  };
}

function seed(groups: Group[]) {
  useBudgetGroupsStore.setState({ groups });
}

/** Simulate the app wiring: runTxAction delegates to the hook's contract. */
async function runFailingAction(key: 'add' | 'row', fn: () => Promise<void>) {
  const store = useBudgetGroupsStore.getState();
  // Mimic usePlanningActionState.runTxAction failure path.
  store.setBusy(key);
  try {
    await fn();
  } catch {
    store.registerRollback(null);
    store.pendingRollback?.();
  } finally {
    store.setBusy(null);
  }
}

describe('optimistic update rollback (spec 2026-08-22-optimistic-update-rollback)', () => {
  const groupId = 'g1';
  const baseGroups: Group[] = [
    {
      id: groupId,
      name: 'Giving',
      defaultExpanded: true,
      isIncome: false,
      rightColumnOptions: [],
      items: [item('a1'), item('a2')],
    },
  ];

  beforeEach(() => {
    seed(baseGroups.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it })) })));
    useBudgetGroupsStore.setState({ pendingRollback: null, busy: null });
    vi.clearAllMocks();
  });

  testFn('rolls back an optimistic create when the API fails', async () => {
    const before = JSON.stringify(useBudgetGroupsStore.getState().groups);

    useBudgetGroupsStore.getState().addCategoryRow(groupId);
    expect(
      useBudgetGroupsStore.getState().groups[0].items.length,
    ).toBe(3);

    // Failure path: invoke the registered rollback (as runTxAction would).
    const store = useBudgetGroupsStore.getState();
    store.registerRollback(null);
    store.pendingRollback?.();

    expect(JSON.stringify(useBudgetGroupsStore.getState().groups)).toBe(before);
  });

  testFn('removes only the temp row on create rollback, leaving others intact', async () => {
    useBudgetGroupsStore.getState().addCategoryRow(groupId);
    const withTemp = useBudgetGroupsStore.getState().groups[0].items;
    const tempId = withTemp[withTemp.length - 1].id;

    useBudgetGroupsStore.getState().removeItemById(tempId);

    const { groups: afterGroups } = useBudgetGroupsStore.getState();
    expect(afterGroups[0].items.map((it) => it.id)).toEqual(['a1', 'a2']);
  });

  testFn('rolls back a rename/planned edit to exact prior values', async () => {
    const { updateCategoryItem } = await import('@/actions/budget-planning');
    (updateCategoryItem as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

    const action = useBudgetGroupsStore.getState();
    action.handleUpdateItem('a1', { name: 'Renamed', plannedCents: 5000 });
    // optimistic state applied
    expect(
      useBudgetGroupsStore.getState().groups[0].items.find((it) => it.id === 'a1')?.name,
    ).toBe('Renamed');

    await runFailingAction('row', async () => {
      throw new Error('boom');
    });

    const rolledBack = useBudgetGroupsStore.getState().groups[0].items.find((it) => it.id === 'a1');
    expect(rolledBack?.name).toBe('Item a1');
    expect(rolledBack?.plannedCents).toBe(0);
  });

  testFn('rolls back an assign to prior funded/remaining/needed', async () => {
    const { setCategoryAssigned } = await import('@/actions/budget-planning');
    (setCategoryAssigned as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

    const seeded: Group[] = [{
      ...baseGroups[0],
      items: [
        item('a1', {
          fundedCents: 1000,
          remainingCents: 1000,
          neededCents: 500,
          targetAmountCents: 1500,
        }),
        item('a2'),
      ],
    }];
    seed(seeded);

    useBudgetGroupsStore.getState().handleAssignAmount(
      useBudgetGroupsStore.getState().groups[0].items[0],
      2500,
    );
    expect(
      useBudgetGroupsStore.getState().groups[0].items[0].fundedCents,
    ).toBe(2500);

    await runFailingAction('row', async () => {
      throw new Error('boom');
    });

    const rolledBack = useBudgetGroupsStore.getState().groups[0].items[0];
    expect(rolledBack.fundedCents).toBe(1000);
    expect(rolledBack.remainingCents).toBe(1000);
    expect(rolledBack.neededCents).toBe(500);
  });

  testFn('rolls back a delete by restoring the row at its saved index', async () => {
    const { deleteCategoryItem } = await import('@/actions/budget-planning');
    (deleteCategoryItem as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

    useBudgetGroupsStore.getState().handleDeleteItem(
      useBudgetGroupsStore.getState().groups[0].items[0], // 'a1' at index 0
      groupId,
    );
    expect(
      useBudgetGroupsStore.getState().groups[0].items.map((it) => it.id),
    ).toEqual(['a2']);

    await runFailingAction('row', async () => {
      throw new Error('boom');
    });

    expect(
      useBudgetGroupsStore.getState().groups[0].items.map((it) => it.id),
    ).toEqual(['a1', 'a2']);
  });
});
