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
import { parseAmountText, sanitizeAmountText } from '../utils/formatters';
import type { Group, GroupItem } from '../types';

export interface BudgetGroupUndo {
  item: GroupItem;
  groupId: string;
  index: number;
}

interface BudgetGroupsStore {
  groups: Group[];
  expandedGroups: Record<string, boolean>;
  addItemGroup: string | null;
  newItemName: string;
  newItemAmount: number;
  amountText: string;
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
  beginAddItem: (groupId: string) => void;
  cancelAddItem: () => void;
  handleAmountInputChange: (value: string) => void;
  handleAddItem: (groupId: string) => void;
  /** Add a brand-new "New income" row ($0) and persist it. Returns the temp id. */
  addIncomeSource: (groupId: string) => string;
  handleUpdateItem: (itemId: string, patch: { name: string; planned: number }) => void;
  handleAssignAmount: (item: GroupItem, amount: number) => void;
  handleDeleteItem: (item: GroupItem, groupId: string) => void;
  handleUndoDelete: () => void;
  handleReorderItems: (groupId: string, orderedIds: string[]) => void;
  handleReorderCommit: (groupId: string, orderedIds: string[]) => void;
  handleReceiveIncome: (item: GroupItem) => void;
  setDeleteArmingId: (id: string | null) => void;
  setNewItemName: (name: string) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

let undoTimeoutRef: ReturnType<typeof setTimeout> | null = null;

const noopRun = async () => {};

export const useBudgetGroupsStore = create<BudgetGroupsStore>((set, get) => ({
  groups: MOCK_GROUPS,
  expandedGroups: {},
  addItemGroup: null,
  newItemName: '',
  newItemAmount: 0,
  amountText: '',
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

  beginAddItem: (groupId) => set({
    newItemName: '',
    amountText: '',
    newItemAmount: 0,
    addItemGroup: groupId,
  }),

  cancelAddItem: () => set({
    newItemName: '',
    amountText: '',
    newItemAmount: 0,
    addItemGroup: null,
  }),

  handleAmountInputChange: (value) => {
    const sanitized = sanitizeAmountText(value);
    set({ amountText: sanitized, newItemAmount: parseAmountText(sanitized) });
  },

  setNewItemName: (name) => set({ newItemName: name }),

  handleAddItem: (groupId) => {
    const state = get();
    const name = state.newItemName.trim();
    if (!name || state.busy !== null) return;
    const planned = state.newItemAmount;
    const tempId = `pending-${Date.now()}`;

    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId
        ? {
          ...g,
          items: [
            ...g.items,
            {
              id: tempId,
              name,
              dueDate: null,
              planned,
              funded: 0,
              spent: 0,
              received: 0,
              remaining: 0,
              transactionCount: 0,
              templateId: null,
              targetType: 'NONE',
              targetAmount: 0,
              targetDue: null,
              targetDate: null,
              targetMonthDay: null,
              needed: 0,
              trend: [],
            },
          ],
        }
        : g)),
    }));
    set({ newItemName: '', amountText: '', newItemAmount: 0 });

    state.runTxAction('row', async () => {
      const created = await addCategoryItem(groupId, name, planned);
      set((s) => ({
        groups: s.groups.map((g) => (g.id === groupId
          ? {
            ...g,
            items: g.items.map((it) => (it.id === tempId
              ? {
                ...it,
                id: created.id,
                name: created.name,
                dueDate: created.dueDate,
                planned: created.planned,
                funded: Number(created.funded ?? 0),
                spent: created.spent,
                received: created.received ?? 0,
                remaining: created.remaining,
                transactionCount: created.transactionCount,
                templateId: created.templateId ?? null,
                targetType: created.targetType ?? 'NONE',
                targetAmount: Number(created.targetAmount ?? 0),
                targetDue: created.targetDue ?? null,
                targetDate: created.targetDate ?? null,
                targetMonthDay: created.targetMonthDay ?? null,
                needed: Number(created.needed ?? 0),
                trend: created.trend ?? [],
              }
              : it)),
          }
          : g)),
      }));
    });

    state.nameInputRef.current?.focus();
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
            {
              id: tempId,
              name: 'New item',
              dueDate: null,
              planned: 0,
              funded: 0,
              spent: 0,
              received: 0,
              remaining: 0,
              transactionCount: 0,
              templateId: null,
              targetType: 'NONE' as const,
              targetAmount: 0,
              targetDue: null,
              targetDate: null,
              targetMonthDay: null,
              needed: 0,
              trend: [],
            },
          ],
        }
        : g)),
    }));

    state.runTxAction('row', async () => {
      const planned = 0;
      const created = await addCategoryItem(groupId, 'New income', planned);
      set((s) => ({
        groups: s.groups.map((g) => (g.id === groupId
          ? {
            ...g,
            items: g.items.map((it) => (it.id === tempId
              ? {
                ...it,
                id: created.id,
                name: created.name,
                dueDate: created.dueDate,
                planned: created.planned,
                funded: Number(created.funded ?? 0),
                spent: created.spent,
                received: created.received ?? 0,
                remaining: created.remaining,
                transactionCount: created.transactionCount,
                templateId: created.templateId ?? null,
                targetType: created.targetType ?? 'NONE',
                targetAmount: Number(created.targetAmount ?? 0),
                targetDue: created.targetDue ?? null,
                targetDate: created.targetDate ?? null,
                targetMonthDay: created.targetMonthDay ?? null,
                needed: Number(created.needed ?? 0),
                trend: created.trend ?? [],
              }
              : it)),
          }
          : g)),
      }));
    });

    return tempId;
  },

  handleUpdateItem: (itemId, patch) => {
    const { name, planned } = patch;

    set((s) => ({
      groups: s.groups.map((g) => ({
        ...g,
        items: g.items.map((it) => (it.id === itemId ? { ...it, name, planned } : it)),
      })),
    }));

    get().runTxAction('row', async () => {
      await updateCategoryItem(itemId, { name, planned });
    });
  },

  handleAssignAmount: (item, amount) => {
    const delta = amount - item.funded;
    if (Math.abs(delta) < 0.005) return;

    set((s) => ({
      groups: s.groups.map((g) => ({
        ...g,
        items: g.items.map((it) => (it.id === item.id
          ? {
            ...it,
            funded: amount,
            remaining: it.remaining + delta,
            needed: Math.max(it.targetAmount - amount, 0),
          }
          : it)),
      })),
    }));

    get().runTxAction('row', async () => {
      await setCategoryAssigned(item.id, amount);
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
