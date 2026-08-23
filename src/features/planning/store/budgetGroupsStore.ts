import type { RefObject } from 'react';
import { create } from 'zustand';
import {
  addCategoryItem,
  deleteCategoryItem,
  receivePlannedIncome,
  reorderCategoryItems,
  restoreCategoryItem,
  setCategoryAssigned,
  updateCategoryItem,
} from '@/actions/budget-planning';

import { MOCK_GROUPS } from '../constants';
import type { Group, GroupItem } from '../types';

export interface BudgetGroupUndo {
  item: GroupItem;
  groupId: string;
  index: number;
}

type CategoryItemDTO = Awaited<
  ReturnType<typeof import('@/actions/budget-planning').addCategoryItem>
>;

/** Fresh optimistic row: all money at 0 cents until the server reconciles. */
function newTempItem(tempId: string, name: string): GroupItem {
  return {
    id: tempId,
    clientId: tempId,
    name,
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
  };
}

/** Merge server-created data into the optimistic row, preserving its clientId. */
function mergeCreatedItem(temp: GroupItem, created: CategoryItemDTO): GroupItem {
  return {
    ...temp,
    id: created.id,
    name: created.name,
    dueDate: created.dueDate ?? null,
    plannedCents: created.plannedCents ?? 0,
    fundedCents: created.fundedCents ?? 0,
    spentCents: created.spentCents ?? 0,
    receivedCents: created.receivedCents ?? 0,
    remainingCents: created.remainingCents ?? 0,
    transactionCount: created.transactionCount ?? 0,
    templateId: created.templateId ?? null,
    targetType: created.targetType ?? 'NONE',
    targetAmountCents: created.targetAmountCents ?? 0,
    targetDue: created.targetDue ?? null,
    targetDate: created.targetDate ?? null,
    targetMonthDay: created.targetMonthDay ?? null,
    neededCents: created.neededCents ?? 0,
    trend: created.trend ?? [],
  };
}

interface BudgetGroupsStore {
  groups: Group[];
  expandedGroups: Record<string, boolean>;
  deleteArmingId: string | null;
  receiveHint: string | null;
  undo: BudgetGroupUndo | null;
  hasAccounts: boolean;
  availableToAssign: number;
  nameInputRef: RefObject<HTMLInputElement | null>;
  amountInputRef: RefObject<HTMLInputElement | null>;
  busy: 'add' | 'row' | null;

  runTxAction: (key: 'add' | 'row', fn: () => Promise<void>) => Promise<void>;

  hydrateGroups: (groups: Group[]) => void;
  setHasAccounts: (has: boolean) => void;
  setAvailableToAssign: (amount: number) => void;
  setBusy: (busy: 'add' | 'row' | null) => void;
  registerTxActions: (run: BudgetGroupsStore['runTxAction']) => void;
  toggleGroup: (id: string) => void;
  /** Add a brand-new "New income" row ($0) and persist it. Returns the temp id. */
  addIncomeSource: (groupId: string) => string;
  /** Insert a new 'New category' row ($0) inline and persist it. Returns the temp id. */
  addCategoryRow: (groupId: string) => string;
  handleUpdateItem: (itemId: string, patch: { name: string; plannedCents: number }) => void;
  handleAssignAmount: (item: GroupItem, amountCents: number) => void;
  handleDeleteItem: (item: GroupItem, groupId: string) => void;
  handleUndoDelete: () => void;
  handleReorderItems: (groupId: string, orderedIds: string[]) => void;
  handleReorderCommit: (groupId: string, orderedIds: string[]) => void;
  handleReceiveIncome: (item: GroupItem) => void;
  setDeleteArmingId: (id: string | null) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

let undoTimeoutRef: ReturnType<typeof setTimeout> | null = null;

const noopRun = async () => {};

export const useBudgetGroupsStore = create<BudgetGroupsStore>((set, get) => ({
  groups: MOCK_GROUPS,
  expandedGroups: {},
  deleteArmingId: null,
  receiveHint: null,
  undo: null,
  hasAccounts: true,
  availableToAssign: 0,
  nameInputRef: { current: null },
  amountInputRef: { current: null },
  busy: null,
  runTxAction: noopRun,
  selectedItemId: null,

  hydrateGroups: (groups) => set({ groups }),

  setHasAccounts: (has) => set({ hasAccounts: has }),

  setAvailableToAssign: (amount) => set({ availableToAssign: amount }),

  setBusy: (busy) => set({ busy }),

  registerTxActions: (run) => set({ runTxAction: run }),

  toggleGroup: (id) => {
    const state = get();
    const group = state.groups.find((g) => g.id === id);
    const wasExpanded = state.expandedGroups[id] ?? group?.defaultExpanded ?? false;
    set({ expandedGroups: { ...state.expandedGroups, [id]: !wasExpanded } });
  },

  addIncomeSource: (groupId) => {
    const state = get();
    const tempId = `income-${Date.now()}`;

    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId
        ? {
          ...g,
          items: [
            ...g.items,
            newTempItem(tempId, 'New income'),
          ],
        }
        : g)),
    }));

    state.runTxAction('row', async () => {
      const created = await addCategoryItem(groupId, 'New income', 0);
      set((s) => ({
        groups: s.groups.map((g) => (g.id === groupId
          ? {
            ...g,
            items: g.items.map((it) => (it.id === tempId
              ? mergeCreatedItem(it, created)
              : it)),
          }
          : g)),
      }));
    });

    return tempId;
  },

  addCategoryRow: (groupId) => {
    const state = get();
    const tempId = `cat-${Date.now()}`;

    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId
        ? {
          ...g,
          items: [
            ...g.items,
            newTempItem(tempId, 'New category'),
          ],
        }
        : g)),
    }));

    state.runTxAction('row', async () => {
      const created = await addCategoryItem(groupId, 'New category', 0);
      set((s) => ({
        groups: s.groups.map((g) => (g.id === groupId
          ? {
            ...g,
            items: g.items.map((it) => (it.id === tempId
              ? mergeCreatedItem(it, created)
              : it)),
          }
          : g)),
      }));
    });

    return tempId;
  },

  handleUpdateItem: (itemId, patch) => {
    const { name, plannedCents } = patch;

    set((s) => ({
      groups: s.groups.map((g) => ({
        ...g,
        items: g.items.map((it) => (it.id === itemId ? { ...it, name, plannedCents } : it)),
      })),
    }));

    get().runTxAction('row', async () => {
      await updateCategoryItem(itemId, { name, plannedCents });
    });
  },

  handleAssignAmount: (item, amountCents) => {
    const delta = amountCents - item.fundedCents;
    if (delta === 0) return;

    set((s) => ({
      groups: s.groups.map((g) => ({
        ...g,
        items: g.items.map((it) => (it.id === item.id
          ? {
            ...it,
            fundedCents: amountCents,
            remainingCents: it.remainingCents + delta,
            neededCents: Math.max(it.targetAmountCents - amountCents, 0),
          }
          : it)),
      })),
    }));

    get().runTxAction('row', async () => {
      await setCategoryAssigned(item.id, amountCents);
    });
  },

  handleDeleteItem: (item, groupId) => {
    const state = get();
    const index = state.groups
      .find((g) => g.id === groupId)
      ?.items.findIndex((it) => it.id === item.id);

    set((s) => ({
      groups: s.groups.map((g) => ({
        ...g,
        items: g.items.filter((it) => it.id !== item.id),
      })),
      deleteArmingId: null,
    }));

    state.runTxAction('row', async () => {
      await deleteCategoryItem(item.id);
    });

    set({ undo: { item, groupId, index: index ?? -1 } });
    if (undoTimeoutRef) clearTimeout(undoTimeoutRef);
    undoTimeoutRef = setTimeout(() => set({ undo: null }), 5000);
  },

  handleUndoDelete: () => {
    const state = get();
    if (!state.undo) return;
    const { item, groupId, index } = state.undo;
    set({ undo: null });
    if (undoTimeoutRef) clearTimeout(undoTimeoutRef);

    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId
        ? {
          ...g,
          items:
            index >= 0 && index < g.items.length
              ? [...g.items.slice(0, index), item, ...g.items.slice(index)]
              : [...g.items, item],
        }
        : g)),
    }));

    state.runTxAction('row', async () => {
      await restoreCategoryItem(item.id);
    });
  },

  handleReorderItems: (groupId, orderedIds) => {
    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId
        ? {
          ...g,
          items: orderedIds
            .map((id) => g.items.find((it) => it.id === id))
            .filter((it): it is GroupItem => Boolean(it)),
        }
        : g)),
    }));
  },

  handleReorderCommit: (groupId, orderedIds) => {
    get().runTxAction('row', async () => {
      await reorderCategoryItems(groupId, orderedIds);
    });
  },

  handleReceiveIncome: (item) => {
    const state = get();
    if (!state.hasAccounts) {
      set({ receiveHint: 'Add an account before marking income as received' });
      return;
    }
    set({ receiveHint: null });
    state.runTxAction('row', async () => {
      await receivePlannedIncome(item.id);
    });
  },

  setDeleteArmingId: (id) => set({ deleteArmingId: id }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
}));
