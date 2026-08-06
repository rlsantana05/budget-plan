import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import type { MonthBudgetPlanDTO } from '@/types/budget';
import {
  addCategoryItem,
  deleteCategoryItem,
  receivePlannedIncome,
  reorderCategoryItems,
  restoreCategoryItem,
  updateCategoryItem,
} from '@/actions/budget-planning';
import { MOCK_GROUPS } from '../constants';
import { toGroups } from '../utils/mappers';
import type { Group, GroupItem } from '../types';
import type { PlanningActionState } from './usePlanningActionState';
import { useServerSync } from './useServerSync';

export interface BudgetGroupUndo {
  item: GroupItem;
  groupId: string;
  index: number;
}

export function useBudgetGroups(
  initialData: MonthBudgetPlanDTO | undefined,
  action: PlanningActionState,
) {
  const dtoGroups: Group[] | undefined = initialData
    ? toGroups(initialData)
    : undefined;

  const [groups, setGroups] = useState<Group[]>(dtoGroups ?? MOCK_GROUPS);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [addItemGroup, setAddItemGroup] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(0);
  const [amountText, setAmountText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlanned, setEditPlanned] = useState<number>(0);
  const [deleteArmingId, setDeleteArmingId] = useState<string | null>(null);
  const [receiveHint, setReceiveHint] = useState<string | null>(null);
  const [undo, setUndo] = useState<BudgetGroupUndo | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useServerSync(initialData, (latest) => {
    setGroups(toGroups(latest));
  });

  useEffect(
    () => () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    },
    [],
  );

  const { busy, runTxAction } = action;
  const accounts = useMemo(() => initialData?.accounts ?? [], [initialData]);

  const toggleGroup = useCallback(
    (id: string) => {
      setExpandedGroups((prev) => {
        const group = groups.find((g) => g.id === id);
        const wasExpanded = prev[id] ?? group?.defaultExpanded ?? false;
        return { ...prev, [id]: !wasExpanded };
      });
    },
    [groups],
  );

  const beginAddItem = useCallback((groupId: string) => {
    setNewItemName('');
    setAmountText('');
    setNewItemAmount(0);
    setAddItemGroup(groupId);
  }, []);

  const cancelAddItem = useCallback(() => {
    setNewItemName('');
    setAmountText('');
    setNewItemAmount(0);
    setAddItemGroup(null);
  }, []);

  const handleAmountInputChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setAmountText(digits);
    setNewItemAmount(digits ? Number(digits) : 0);
  }, []);

  const handleAddItem = useCallback(
    (groupId: string) => {
      const name = newItemName.trim();
      if (!name || busy !== null) return;
      const planned = newItemAmount;
      const tempId = `pending-${Date.now()}`;

      setGroups((prev) => prev.map((g) => (g.id === groupId
        ? {
          ...g,
          items: [
            ...g.items,
            {
              id: tempId,
              name,
              dueDate: null,
              planned,
              spent: 0,
              remaining: 0,
              transactionCount: 0,
            },
          ],
        }
        : g)));
      setNewItemName('');
      setAmountText('');
      setNewItemAmount(0);

      runTxAction('row', async () => {
        const created = await addCategoryItem(groupId, name, planned);
        setGroups((prev) => prev.map((g) => (g.id === groupId
          ? {
            ...g,
            items: g.items.map((it) => (it.id === tempId
              ? {
                ...it,
                id: created.id,
                name: created.name,
                dueDate: created.dueDate,
                planned: created.planned,
                spent: created.spent,
                remaining: created.remaining,
              }
              : it)),
          }
          : g)));
      });

      nameInputRef.current?.focus();
    },
    [newItemName, newItemAmount, busy, runTxAction],
  );

  const startEditItem = useCallback((item: GroupItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPlanned(item.planned);
    setDeleteArmingId(null);
  }, []);

  const cancelEditItem = useCallback(() => {
    setEditingItemId(null);
  }, []);

  const handleUpdateItem = useCallback(
    (itemId: string) => {
      const name = editName;
      const planned = editPlanned;

      setGroups((prev) => prev.map((g) => ({
        ...g,
        items: g.items.map((it) => (it.id === itemId ? { ...it, name, planned } : it)),
      })));
      setEditingItemId(null);

      runTxAction('row', async () => {
        await updateCategoryItem(itemId, { name, planned });
      });
    },
    [editName, editPlanned, runTxAction],
  );

  const handleDeleteItem = useCallback(
    (item: GroupItem, groupId: string) => {
      const index = groups
        .find((g) => g.id === groupId)
        ?.items.findIndex((it) => it.id === item.id);

      setGroups((prev) => prev.map((g) => ({
        ...g,
        items: g.items.filter((it) => it.id !== item.id),
      })));
      setEditingItemId(null);
      setDeleteArmingId(null);

      runTxAction('row', async () => {
        await deleteCategoryItem(item.id);
      });

      setUndo({ item, groupId, index: index ?? -1 });
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => setUndo(null), 5000);
    },
    [groups, runTxAction],
  );

  const handleUndoDelete = useCallback(() => {
    if (!undo) return;
    const { item, groupId, index } = undo;
    setUndo(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    setGroups((prev) => prev.map((g) => (g.id === groupId
      ? {
        ...g,
        items:
                index >= 0 && index < g.items.length
                  ? [...g.items.slice(0, index), item, ...g.items.slice(index)]
                  : [...g.items, item],
      }
      : g)));

    runTxAction('row', async () => {
      await restoreCategoryItem(item.id);
    });
  }, [undo, runTxAction]);

  const handleReorderItems = useCallback((groupId: string, orderedIds: string[]) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId
      ? {
        ...g,
        items: orderedIds
          .map((id) => g.items.find((it) => it.id === id))
          .filter((it): it is GroupItem => !!it),
      }
      : g)));
  }, []);

  const handleReorderCommit = useCallback(
    (groupId: string, orderedIds: string[]) => {
      runTxAction('row', async () => {
        await reorderCategoryItems(groupId, orderedIds);
      });
    },
    [runTxAction],
  );

  const handleReceiveIncome = useCallback(
    (item: GroupItem) => {
      if (accounts.length === 0) {
        setReceiveHint('Add an account before marking income as received');
        return;
      }
      setReceiveHint(null);
      runTxAction('row', async () => {
        await receivePlannedIncome(item.id);
      });
    },
    [accounts, runTxAction],
  );

  return {
    groups,
    expandedGroups,
    toggleGroup,
    addItemGroup,
    beginAddItem,
    cancelAddItem,
    handleAddItem,
    newItemName,
    setNewItemName,
    newItemAmount,
    setNewItemAmount,
    amountText,
    setAmountText,
    handleAmountInputChange,
    editingItemId,
    setEditingItemId,
    editName,
    setEditName,
    editPlanned,
    setEditPlanned,
    startEditItem,
    cancelEditItem,
    handleUpdateItem,
    deleteArmingId,
    setDeleteArmingId,
    handleDeleteItem,
    receiveHint,
    handleReceiveIncome,
    handleReorderItems,
    handleReorderCommit,
    undo,
    handleUndoDelete,
    nameInputRef,
    amountInputRef,
  };
}
