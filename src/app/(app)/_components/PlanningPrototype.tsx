"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  Reorder,
  useReducedMotion,
} from "framer-motion";
import { useDisclosure } from "@mantine/hooks";
import {
  Collapse,
  Menu,
  Modal,
  NumberInput,
  Popover,
  Select,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Heart,
  Home,
  MoreVertical,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash,
  User,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  addCategoryItem,
  addTransaction,
  deleteCategoryItem,
  deleteTransaction,
  receivePlannedIncome,
  reorderCategoryItems,
  restoreCategoryItem,
  trackTransaction,
  updateCategoryItem,
} from "@/actions/budget-planning";
import type {
  BudgetTransactionDTO,
  MonthBudgetPlanDTO,
} from "@/types/budget";
import { formatMonthValue, parseMonthValue, shiftMonthValue } from "@/lib/month";
import classes from "./PlanningPrototype.module.css";

interface PlanningPrototypeProps {
  initialData?: MonthBudgetPlanDTO;
  selectedMonth?: string;
}

interface GroupItem {
  id: string;
  name: string;
  dueDate: string | null;
  planned: number;
  spent: number;
  remaining: number;
  transactionCount: number;
}

interface Group {
  id: string;
  name: string;
  defaultExpanded: boolean;
  isIncome: boolean;
  rightColumnOptions: Array<{ label: "Spent" | "Remaining"; selected: boolean }>;
  items: GroupItem[];
}

const MOCK_GROUPS: Group[] = [
  {
    id: "income",
    name: "Income",
    defaultExpanded: false,
    isIncome: true,
    rightColumnOptions: [],
    items: [],
  },
  {
    id: "giving",
    name: "Giving",
    defaultExpanded: false,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
  {
    id: "housing",
    name: "Housing",
    defaultExpanded: true,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
  {
    id: "savings",
    name: "Savings",
    defaultExpanded: false,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
  {
    id: "transportation",
    name: "Transportation",
    defaultExpanded: true,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [
      {
        id: "mock-gas",
        name: "Gas",
        dueDate: "2026-07-31T00:00:00.000Z",
        planned: 240,
        spent: 0,
        remaining: 0,
        transactionCount: 0,
      },
      {
        id: "mock-maint",
        name: "Maintenance",
        dueDate: null,
        planned: 0,
        spent: 0,
        remaining: 0,
        transactionCount: 0,
      },
    ],
  },
  {
    id: "food",
    name: "Food",
    defaultExpanded: false,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
  {
    id: "personal",
    name: "Personal",
    defaultExpanded: false,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    defaultExpanded: false,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
  {
    id: "health",
    name: "Health",
    defaultExpanded: false,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
  {
    id: "insurance",
    name: "Insurance",
    defaultExpanded: false,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
  {
    id: "debt",
    name: "Debt",
    defaultExpanded: false,
    isIncome: false,
    rightColumnOptions: [
      { label: "Remaining", selected: false },
      { label: "Spent", selected: true },
    ],
    items: [],
  },
];

const TRANSACTION_TABS = ["new", "tracked", "deleted"];

const GROUP_ICONS: Record<string, LucideIcon> = {
  Income: Banknote,
  Giving: Heart,
  Housing: Home,
  Savings: PiggyBank,
  Transportation: Car,
  Food: UtensilsCrossed,
  Personal: User,
  Lifestyle: Sparkles,
  Health: Stethoscope,
  Insurance: ShieldCheck,
  Debt: CreditCard,
};

const GROUP_COLORS: Record<string, string> = {
  Income: "#34d399",
  Giving: "#fb7185",
  Housing: "#60a5fa",
  Savings: "#2dd4bf",
  Transportation: "#fbbf24",
  Food: "#fb923c",
  Personal: "#a78bfa",
  Lifestyle: "#e879f9",
  Health: "#f87171",
  Insurance: "#22d3ee",
  Debt: "#facc15",
};

const FALLBACK_ICON_COLOR = "#94a3b8";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTxDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatMonthLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function buildMonthsForYear(year: number): Array<{
  value: string;
  label: string;
}> {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    months.push({
      value: formatMonthValue(year, m),
      label: new Date(year, m - 1, 1).toLocaleString("default", {
        month: "short",
      }),
    });
  }
  return months;
}

function toGroups(dto: MonthBudgetPlanDTO): Group[] {
  return (dto.categories ?? []).map((cg) => ({
    id: cg.id,
    name: cg.name,
    defaultExpanded: (cg.items ?? []).length > 0,
    isIncome: cg.name === "Income",
    rightColumnOptions:
      cg.name === "Income"
        ? []
        : [
            { label: "Remaining", selected: cg.rightColumn === "Remaining" },
            { label: "Spent", selected: cg.rightColumn === "Spent" },
          ],
    items: (cg.items ?? []).map((it) => ({
      id: it.id,
      name: it.name,
      dueDate: it.dueDate ?? null,
      planned: Number(it.planned),
      spent: Number(it.spent),
      remaining: Number(it.remaining),
      transactionCount: it.transactionCount,
    })),
  }));
}

export default function PlanningPrototype({
  initialData,
  selectedMonth,
}: PlanningPrototypeProps = {}) {
  const dtoGroups: Group[] | undefined = initialData
    ? toGroups(initialData)
    : undefined;

  const { year, month: monthNumber } = parseMonthValue(selectedMonth);
  const selectedValue = formatMonthValue(year, monthNumber);
  const month =
    initialData?.month ??
    new Date(year, monthNumber - 1, 1).toLocaleString("default", {
      month: "long",
    });

  const now = new Date();
  const currentValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [pickerOpened, { close: closePicker, toggle: togglePicker }] =
    useDisclosure(false);
  const [pickerYear, setPickerYear] = useState<number>(year);
  const [navDir, setNavDir] = useState<1 | -1>(1);
  const handlePickerToggle = () => {
    if (!pickerOpened) setPickerYear(year);
    togglePicker();
  };
  const pickerMonths = useMemo(() => buildMonthsForYear(pickerYear), [pickerYear]);
  const bannerAmount = initialData?.budgetStatus?.amount ?? 2705;
  const bannerLabel = initialData?.budgetStatus?.label ?? "over budget";
  const isOverBudget = bannerAmount > 0;
  const isUnderBudget = bannerAmount < 0;

  const [groups, setGroups] = useState<Group[]>(dtoGroups ?? MOCK_GROUPS);
  const [transactions, setTransactions] = useState<BudgetTransactionDTO[]>(
    initialData?.transactions ?? [],
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );  const [rightColumns, setRightColumns] = useState<
    Record<string, "Spent" | "Remaining">
  >({});
  const [activeView, setActiveView] = useState<"summary" | "transactions">(
    "transactions",
  );
  const [activeTab, setActiveTab] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txPayee, setTxPayee] = useState("");
  const [txMemo, setTxMemo] = useState("");
  const [txCategory, setTxCategory] = useState<string | null>(null);
  const [txAccount, setTxAccount] = useState<string | null>(null);
  const [busy, setBusy] = useState<"add" | "row" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addItemGroup, setAddItemGroup] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState(0);
  const [amountText, setAmountText] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlanned, setEditPlanned] = useState<number>(0);
  const [deleteArmingId, setDeleteArmingId] = useState<string | null>(null);
  const [receiveHint, setReceiveHint] = useState<string | null>(null);
  const [undo, setUndo] = useState<{
    item: GroupItem;
    groupId: string;
    index: number;
  } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const motionTransition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: "easeOut" as const,
  };
  const itemMotionProps = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98, height: 0 },
    transition: motionTransition,
  };

  useEffect(
    () => () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    },
    [],
  );

  const router = useRouter();

  const goToMonth = (value: string) => {
    setNavDir(value > selectedValue ? 1 : -1);
    router.push(`/planning?month=${value}`);
  };

  const accounts = initialData?.accounts ?? [];

  const { categoryOptions, incomeCategoryIds } = useMemo(() => {
    const incomeIds = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];
    for (const g of initialData?.categories ?? []) {
      for (const it of g.items ?? []) {
        options.push({ value: it.id, label: `${g.name} · ${it.name}` });
        if (g.name === "Income") incomeIds.add(it.id);
      }
    }
    return { categoryOptions: options, incomeCategoryIds: incomeIds };
  }, [initialData]);

  // Re-sync local state from the server once a background refresh lands.
  // Adjusted during render (not in an effect) so optimistic patches persist
  // until the server payload actually changes.
  const [syncedData, setSyncedData] = useState(initialData);
  if (syncedData !== initialData) {
    setSyncedData(initialData);
    if (initialData) {
      setGroups(toGroups(initialData));
      setTransactions(initialData.transactions);
    }
  }

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const group = groups.find((g) => g.id === id);
      const wasExpanded = prev[id] ?? group?.defaultExpanded ?? false;
      return { ...prev, [id]: !wasExpanded };
    });
  };

  const groupRightColumn = (group: Group): "Spent" | "Remaining" =>
    rightColumns[group.id] ??
    group.rightColumnOptions.find((o) => o.selected)?.label ??
    "Spent";

  const runTxAction = async (key: "add" | "row", fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      // Reconcile local state with the server in the background.
      router.refresh();
      setBusy(null);
    }
  };

  const handleAddTransaction = () => {
    const amount = txAmount;
    const categoryId = txCategory;
    const accountId = txAccount;
    const payee = txPayee.trim() || null;
    const memo = txMemo.trim() || null;
    const category = categoryOptions.find((c) => c.value === categoryId);
    const account = accounts.find((a) => a.id === accountId);
    const tempId = `pending-${Date.now()}`;

    setTransactions((prev) => [
      {
        id: tempId,
        amount,
        payee,
        memo,
        date: new Date().toISOString(),
        status: "NEW",
        categoryName: category?.label ?? null,
        accountName: account?.name ?? null,
        isIncome: !!categoryId && incomeCategoryIds.has(categoryId),
      },
      ...prev,
    ]);
    setAddOpen(false);
    setTxAmount(0);
    setTxPayee("");
    setTxMemo("");
    setTxCategory(null);
    setTxAccount(null);

    runTxAction("add", async () => {
      const created = await addTransaction({
        amount,
        categoryId,
        accountId,
        payee,
        memo,
      });
      setTransactions((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t)),
      );
    });
  };

  const handleTrack = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "TRACKED" } : t)),
    );
    runTxAction("row", async () => {
      await trackTransaction(id);
    });
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "DELETED" } : t)),
    );
    runTxAction("row", async () => {
      await deleteTransaction(id);
    });
  };

  const handleAddItem = (groupId: string) => {
    const name = newItemName.trim();
    if (!name || busy !== null) return;
    const planned = newItemAmount;
    const tempId = `pending-${Date.now()}`;

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
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
          : g,
      ),
    );
    setNewItemName("");
    setAmountText("");
    setNewItemAmount(0);

    runTxAction("row", async () => {
      const created = await addCategoryItem(groupId, name, planned);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                items: g.items.map((it) =>
                  it.id === tempId
                    ? {
                        ...it,
                        id: created.id,
                        name: created.name,
                        dueDate: created.dueDate,
                        planned: created.planned,
                        spent: created.spent,
                        remaining: created.remaining,
                      }
                    : it,
                ),
              }
            : g,
        ),
      );
    });

    nameInputRef.current?.focus();
  };

  const cancelAddItem = () => {
    setNewItemName("");
    setAmountText("");
    setNewItemAmount(0);
    setAddItemGroup(null);
  };

  const startEditItem = (item: GroupItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPlanned(item.planned);
    setDeleteArmingId(null);
  };

  const handleUpdateItem = (itemId: string) => {
    const name = editName;
    const planned = editPlanned;

    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((it) =>
          it.id === itemId ? { ...it, name, planned } : it,
        ),
      })),
    );
    setEditingItemId(null);

    runTxAction("row", async () => {
      await updateCategoryItem(itemId, { name, planned });
    });
  };

  const handleDeleteItem = (item: GroupItem, groupId: string) => {
    const index = groups
      .find((g) => g.id === groupId)
      ?.items.findIndex((it) => it.id === item.id);

    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.filter((it) => it.id !== item.id),
      })),
    );
    setEditingItemId(null);
    setDeleteArmingId(null);

    // Soft-delete server-side immediately; undo restores the same row.
    runTxAction("row", async () => {
      await deleteCategoryItem(item.id);
    });

    setUndo({ item, groupId, index: index ?? -1 });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setUndo(null), 5000);
  };

  const handleUndoDelete = () => {
    if (!undo) return;
    const { item, groupId, index } = undo;
    setUndo(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              items:
                index >= 0 && index < g.items.length
                  ? [...g.items.slice(0, index), item, ...g.items.slice(index)]
                  : [...g.items, item],
            }
          : g,
      ),
    );

    runTxAction("row", async () => {
      await restoreCategoryItem(item.id);
    });
  };

  const handleReorderItems = (groupId: string, orderedIds: string[]) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              items: orderedIds
                .map((id) => g.items.find((it) => it.id === id))
                .filter((it): it is GroupItem => !!it),
            }
          : g,
      ),
    );
    runTxAction("row", async () => {
      await reorderCategoryItems(groupId, orderedIds);
    });
  };

  const handleReceiveIncome = (item: GroupItem) => {
    if (accounts.length === 0) {
      setReceiveHint(
        "Add an account before marking income as received",
      );
      return;
    }
    setReceiveHint(null);
    runTxAction("row", async () => {
      await receivePlannedIncome(item.id);
    });
  };

  const activeStatus = activeTab.toUpperCase() as
    | "NEW"
    | "TRACKED"
    | "DELETED";
  const query = searchQuery.trim().toLowerCase();
  const filteredTx = transactions
    .filter((t) => t.status === activeStatus)
    .filter(
      (t) =>
        !query ||
        (t.payee ?? "").toLowerCase().includes(query) ||
        (t.memo ?? "").toLowerCase().includes(query) ||
        (t.categoryName ?? "").toLowerCase().includes(query),
    );

  const txByMonth = new Map<string, BudgetTransactionDTO[]>();
  for (const t of filteredTx) {
    const label = formatMonthLabel(t.date) || "Unknown";
    const list = txByMonth.get(label) ?? [];
    list.push(t);
    txByMonth.set(label, list);
  }

  return (
    <div className={classes.page}>
      {/* Month header */}
      <header className={classes.header}>
        <Popover
          width={300}
          position="bottom-start"
          shadow="md"
          withArrow={false}
          withinPortal
          offset={8}
          opened={pickerOpened}
          onClose={closePicker}
        >
          <Popover.Target>
            <div
              className={classes.monthTitle}
              onClick={handlePickerToggle}
            >
              <strong>{month}</strong>
              <span className={classes.year}>{year}</span>
              <ChevronDown size={16} className={classes.chev} />
            </div>
          </Popover.Target>
          <Popover.Dropdown className={classes.monthPicker}>
            <div className={classes.yearNav}>
              <button
                type="button"
                aria-label="Previous year"
                onClick={() => setPickerYear((y) => y - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span>{pickerYear}</span>
              <button
                type="button"
                aria-label="Next year"
                onClick={() => setPickerYear((y) => y + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className={classes.monthGrid}>
              {pickerMonths.map((m) => {
                const isSelected = m.value === selectedValue;
                const isCurrent = m.value === currentValue;
                return (
                  <button
                    key={m.value}
                    type="button"
                    className={`${classes.monthTile} ${
                      isSelected ? classes.monthTileActive : ""
                    } ${isCurrent && !isSelected ? classes.monthTileCurrent : ""}`}
                    onClick={() => {
                      closePicker();
                      goToMonth(m.value);
                    }}
                  >
                    <span>{m.label}</span>
                    {isCurrent && <span className={classes.currentDot} />}
                  </button>
                );
              })}
            </div>
          </Popover.Dropdown>
        </Popover>
        <div className={classes.navArrows}>
          <button
            aria-label="Previous month"
            onClick={() => goToMonth(shiftMonthValue(selectedValue, -1))}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Next month"
            onClick={() => goToMonth(shiftMonthValue(selectedValue, 1))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className={classes.layout}>
        {/* Left column */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={selectedValue}
            className={classes.leftCol}
            initial={{ opacity: 0, x: navDir * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: navDir * -28 }}
            transition={motionTransition}
          >
          <div className={`${classes.card} ${classes.banner}`}>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${isOverBudget ? "over" : isUnderBudget ? "under" : "on"}${bannerAmount}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={motionTransition}
                className={`${classes.bannerAmount} ${
                  isOverBudget
                    ? classes.bannerOver
                    : isUnderBudget
                      ? classes.bannerUnder
                      : classes.bannerOnTrack
                }`}
              >
                {formatMoney(
                  isUnderBudget ? -bannerAmount : bannerAmount,
                )}
              </motion.div>
            </AnimatePresence>
            <div className={classes.bannerLabel}>{bannerLabel}</div>
          </div>

          {groups.map((group) => {
            const isExpanded =
              expandedGroups[group.id] ?? group.defaultExpanded;
            const rightColumn = groupRightColumn(group);
            const rightLabel = group.isIncome ? "Received" : rightColumn;
            const totalPlanned = group.items.reduce(
              (s, it) => s + it.planned,
              0,
            );
            const totalSpent = group.items.reduce((s, it) => s + it.spent, 0);
            const totalRight = group.items.reduce(
              (s, it) =>
                s + (rightColumn === "Remaining" ? it.remaining : it.spent),
              0,
            );
            const progressPct =
              totalPlanned > 0
                ? Math.min(100, (totalSpent / totalPlanned) * 100)
                : 0;

            return (
              <div className={classes.card} key={group.id}>
                <UnstyledButton
                  className={classes.catRow}
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className={classes.catMain}>
                    <div
                      className={classes.catIcon}
                      style={{
                        background: hexToRgba(
                          GROUP_COLORS[group.name] ?? FALLBACK_ICON_COLOR,
                          0.14,
                        ),
                      }}
                    >
                      {(() => {
                        const Icon = GROUP_ICONS[group.name] ?? Wallet;
                        const color =
                          GROUP_COLORS[group.name] ?? FALLBACK_ICON_COLOR;
                        return (
                          <Icon size={24} color={color} strokeWidth={2} />
                        );
                      })()}
                    </div>
                    <div>
                      <div className={classes.catTitleRow}>
                        <span className={classes.catTitle}>{group.name}</span>
                        <ChevronUp
                          size={16}
                          className={`${classes.catChev} ${
                            isExpanded ? "" : classes.open
                          }`}
                        />
                      </div>
                      <div className={classes.catSubtitle}>
                        {formatMoney(totalSpent)} of{" "}
                        {formatMoney(totalPlanned)}
                      </div>
                    </div>
                  </div>

                  <div
                    className={classes.catRight}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={classes.progressTrack}>
                      <span
                        className={classes.progressDot}
                        style={{ left: `calc(${progressPct}% - 7px)` }}
                      />
                    </div>
                    <span className={classes.rightLabel}>
                      {rightLabel}
                      {!group.isIncome && (
                        <Menu
                          shadow="md"
                          width={150}
                          position="bottom-end"
                          withinPortal
                        >
                          <Menu.Target>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <ChevronDown size={14} />
                            </span>
                          </Menu.Target>
                          <Menu.Dropdown>
                            {group.rightColumnOptions.map((o) => (
                              <Menu.Item
                                key={o.label}
                                leftSection={
                                  <Check
                                    size={14}
                                    style={{
                                      visibility:
                                        o.label === rightColumn
                                          ? "visible"
                                          : "hidden",
                                    }}
                                  />
                                }
                                onClick={() =>
                                  setRightColumns((prev) => ({
                                    ...prev,
                                    [group.id]: o.label,
                                  }))
                                }
                              >
                                {o.label}
                              </Menu.Item>
                            ))}
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </span>
                  </div>
                </UnstyledButton>

                <Collapse expanded={isExpanded}>
                  <div className={classes.items}>
                    <Reorder.Group
                      axis="y"
                      values={group.items.map((it) => it.id)}
                      onReorder={(ordered) =>
                        handleReorderItems(group.id, ordered)
                      }
                      className={classes.reorderGroup}
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {group.items.map((item) =>
                          editingItemId === item.id ? (
                            <Reorder.Item
                              key={item.id}
                              value={item.id}
                              className={classes.reorderItem}
                              drag={editingItemId === null}
                              {...itemMotionProps}
                            >
                              <div
                                className={`${classes.itemRow} ${classes.itemEditing}`}
                              >
                                <div className={classes.editForm}>
                                  <TextInput
                                    autoFocus
                                    size="xs"
                                    placeholder="Name"
                                    value={editName}
                                    onChange={(e) =>
                                      setEditName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleUpdateItem(item.id);
                                      if (e.key === "Escape")
                                        setEditingItemId(null);
                                    }}
                                  />
                                  <NumberInput
                                    size="xs"
                                    placeholder="Planned"
                                    value={editPlanned}
                                    onChange={(v) =>
                                      setEditPlanned(
                                        typeof v === "number" ? v : 0,
                                      )
                                    }
                                    min={0}
                                    decimalScale={2}
                                  />
                                  <div className={classes.editActions}>
                                    <button
                                      type="button"
                                      className={classes.addItemSave}
                                      onClick={() => handleUpdateItem(item.id)}
                                      disabled={
                                        busy !== null || !editName.trim()
                                      }
                                      aria-label="Save item"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className={classes.addItemCancel}
                                      onClick={() => setEditingItemId(null)}
                                      aria-label="Cancel edit"
                                    >
                                      <span aria-hidden>×</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Reorder.Item>
                          ) : (
                            <Reorder.Item
                              key={item.id}
                              value={item.id}
                              className={classes.reorderItem}
                              drag={editingItemId === null}
                              {...itemMotionProps}
                              whileDrag={{
                                scale: 1.02,
                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                              }}
                            >
                              <div className={classes.itemRow}>
                                <div className={classes.itemMain}>
                                  <div>
                                    <div className={classes.itemName}>
                                      {item.name}
                                    </div>
                                    <div className={classes.itemSub}>
                                      {formatMoney(item.spent)} of{" "}
                                      {formatMoney(item.planned)}
                                    </div>
                                  </div>
                                </div>
                                <div className={classes.itemAmounts}>
                                  <span>
                                    {formatMoney(
                                      rightColumn === "Remaining"
                                        ? item.remaining
                                        : item.spent,
                                    )}
                                  </span>
                                  <Menu
                                    shadow="md"
                                    width={160}
                                    position="bottom-end"
                                    withinPortal
                                  >
                                    <Menu.Target>
                                      <button
                                        type="button"
                                        className={classes.itemMoreBtn}
                                        disabled={busy !== null}
                                        aria-label={`Actions for ${item.name}`}
                                      >
                                        <MoreVertical size={16} />
                                      </button>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                      {group.isIncome && (
                                        <Menu.Item
                                          leftSection={<Check size={14} />}
                                          onClick={() =>
                                            handleReceiveIncome(item)
                                          }
                                        >
                                          Mark received
                                        </Menu.Item>
                                      )}
                                      <Menu.Item
                                        leftSection={<Pencil size={14} />}
                                        onClick={() => startEditItem(item)}
                                      >
                                        Edit
                                      </Menu.Item>
                                      <Menu.Item
                                        leftSection={<Trash size={14} />}
                                        color="red"
                                        onClick={() => {
                                          if (
                                            item.transactionCount > 0 &&
                                            deleteArmingId !== item.id
                                          ) {
                                            setDeleteArmingId(item.id);
                                          } else {
                                            handleDeleteItem(item, group.id);
                                          }
                                        }}
                                      >
                                        Delete
                                      </Menu.Item>
                                    </Menu.Dropdown>
                                  </Menu>
                                </div>
                              </div>
                              {deleteArmingId === item.id &&
                                item.transactionCount > 0 && (
                                  <div className={classes.deleteWarning}>
                                    <span>
                                      {item.transactionCount}{" "}
                                      {item.transactionCount === 1
                                        ? "transaction"
                                        : "transactions"}{" "}
                                      will be hidden with this category
                                    </span>
                                    <div className={classes.deleteWarningActions}>
                                      <button
                                        type="button"
                                        className={classes.deleteWarningConfirm}
                                        onClick={() =>
                                          handleDeleteItem(item, group.id)
                                        }
                                      >
                                        Delete
                                      </button>
                                      <button
                                        type="button"
                                        className={classes.deleteWarningCancel}
                                        onClick={() => setDeleteArmingId(null)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </Reorder.Item>
                          ),
                        )}
                      </AnimatePresence>
                    </Reorder.Group>

                    {group.isIncome && receiveHint && (
                      <div className={classes.receiveHint}>{receiveHint}</div>
                    )}

                    {addItemGroup === group.id ? (
                      <div className={classes.addItemForm}>
                        <TextInput
                          ref={nameInputRef}
                          autoFocus
                          size="xs"
                          placeholder={
                            group.isIncome
                              ? "e.g. Paycheck"
                              : "Groceries, rent, coffee…"
                          }
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              amountInputRef.current?.focus();
                            }
                            if (e.key === "Escape") cancelAddItem();
                          }}
                        />
                        <TextInput
                          ref={amountInputRef}
                          size="xs"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={
                            amountText
                              ? `$${formatMoney(Number(amountText))}`
                              : ""
                          }
                          onChange={(e) => {
                            const digits = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 9);
                            setAmountText(digits);
                            setNewItemAmount(digits ? Number(digits) : 0);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddItem(group.id);
                            }
                            if (e.key === "Escape") cancelAddItem();
                          }}
                        />
                        <button
                          type="button"
                          className={classes.addItemSave}
                          onClick={() => handleAddItem(group.id)}
                          disabled={busy !== null || !newItemName.trim()}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className={classes.addItemCancel}
                          onClick={cancelAddItem}
                          aria-label="Cancel add item"
                        >
                          <span aria-hidden>×</span>
                        </button>
                      </div>
                    ) : (
                      <div className={classes.addRow}>
                        <button
                          type="button"
                          className={classes.addLink}
                          onClick={() => {
                            setNewItemName("");
                            setAmountText("");
                            setNewItemAmount(0);
                            setAddItemGroup(group.id);
                          }}
                        >
                          + {group.isIncome ? "Add income" : "Add item"}
                        </button>
                        {group.isIncome && (
                          <div
                            className={`${classes.itemAmounts} ${classes.totalAmounts}`}
                          >
                            <span>{formatMoney(totalPlanned)}</span>
                            <span>{formatMoney(totalRight)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Collapse>
              </div>
            );
          })}
          </motion.div>
        </AnimatePresence>

        {/* Right column – transactions panel */}
        <aside className={classes.rightCol}>
          <div className={classes.toggle}>
            <button
              className={activeView === "summary" ? classes.active : ""}
              onClick={() => setActiveView("summary")}
            >
              <span aria-hidden>◐</span> Summary
            </button>
            <button
              className={activeView === "transactions" ? classes.active : ""}
              onClick={() => setActiveView("transactions")}
            >
              <span aria-hidden>$</span> Transactions
            </button>
          </div>

          <div className={classes.subtabs}>
            {TRANSACTION_TABS.map((t) => (
              <span
                key={t}
                className={activeTab === t ? classes.active : ""}
                onClick={() => setActiveTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
                {activeTab === t && (
                  <motion.span
                    layoutId="planning-subtab-underline"
                    className={classes.subtabUnderline}
                    transition={motionTransition}
                  />
                )}
              </span>
            ))}
          </div>

          {activeView === "transactions" ? (
            <>
              <TextInput
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={classes.search}
                leftSection={<Search size={16} />}
              />

              {[...txByMonth.entries()].map(([label, txs]) => (
                <div className={classes.monthGroup} key={label}>
                  <div className={classes.monthLabel}>{label}</div>
                  {txs.length === 0 ? (
                    <div className={classes.empty}>No transactions</div>
                  ) : (
                    txs.map((t) => (
                      <div className={classes.txRow} key={t.id}>
                        <div className={classes.txMain}>
                          <div className={classes.txPayee}>
                            {t.payee ?? "Untracked"}
                          </div>
                          <div className={classes.txMeta}>
                            {t.categoryName ?? "No category"}
                            {" · "}
                            {formatTxDate(t.date)}
                            {t.accountName ? ` · ${t.accountName}` : ""}
                          </div>
                        </div>
                        <div className={classes.txRight}>
                          <span
                            className={`${classes.txAmount} ${
                              t.isIncome ? classes.txAmountIn : ""
                            }`}
                          >
                            {t.isIncome ? "+" : "-"}
                            {formatMoney(t.amount)}
                          </span>
                          <div className={classes.txActions}>
                            {t.status === "NEW" && (
                              <button
                                type="button"
                                className={classes.txTrack}
                                onClick={() => handleTrack(t.id)}
                                disabled={busy !== null}
                              >
                                Track
                              </button>
                            )}
                            {t.status !== "DELETED" && (
                              <button
                                type="button"
                                className={classes.txDelete}
                                onClick={() => handleDelete(t.id)}
                                disabled={busy !== null}
                                aria-label="Delete transaction"
                              >
                                <Trash size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}

              {filteredTx.length === 0 && (
                <div className={classes.monthGroup}>
                  <div className={classes.monthLabel}>{month}</div>
                  <div className={classes.empty}>No transactions</div>
                </div>
              )}

              {error && <div className={classes.error}>{error}</div>}
            </>
          ) : (
            <div className={classes.summaryPlaceholder}>
              Summary view – not implemented in this prototype.
            </div>
          )}
        </aside>
      </div>

      <button
        type="button"
        className={classes.fab}
        aria-label="Add transaction"
        onClick={() => setAddOpen(true)}
      >
        <Plus size={26} />
      </button>

      {/* Add transaction modal */}
      <Modal.Root opened={addOpen} onClose={() => setAddOpen(false)}>
        <Modal.Overlay backgroundOpacity={0.6} blur={3} />
        <Modal.Content
          style={{
            borderRadius: 16,
            background: "var(--mantine-color-surface-2)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 24,
          }}
        >
          <div className={classes.modalTitle}>Add transaction</div>
          <div className={classes.modalField}>
            <NumberInput
              label="Amount"
              value={txAmount}
              onChange={(v) => setTxAmount(typeof v === "number" ? v : 0)}
              min={0}
              decimalScale={2}
              autoFocus
            />
          </div>
          <div className={classes.modalField}>
            <TextInput
              label="Payee"
              value={txPayee}
              onChange={(e) => setTxPayee(e.target.value)}
              placeholder="e.g. Kroger"
            />
          </div>
          <div className={classes.modalField}>
            <TextInput
              label="Memo (optional)"
              value={txMemo}
              onChange={(e) => setTxMemo(e.target.value)}
              placeholder="e.g. Weekly groceries"
            />
          </div>
          <div className={classes.modalField}>
            <Select
              label="Category"
              data={categoryOptions}
              value={txCategory}
              onChange={setTxCategory}
              searchable
              clearable
              placeholder="Select a category"
            />
          </div>
          <div className={classes.modalField}>
            <Select
              label="Account"
              data={accounts.map((a) => ({ value: a.id, label: a.name }))}
              value={txAccount}
              onChange={setTxAccount}
              clearable
              placeholder="Select an account"
            />
          </div>
          {error && <div className={classes.error}>{error}</div>}
          <div className={classes.modalActions}>
            <button
              type="button"
              className={`${classes.modalButton} ${classes.secondary}`}
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={classes.modalButton}
              onClick={handleAddTransaction}
              disabled={busy === "add" || txAmount <= 0}
            >
              {busy === "add" ? "Saving…" : "Add transaction"}
            </button>
          </div>
        </Modal.Content>
      </Modal.Root>

      {/* Delete undo toast */}
      <AnimatePresence>
        {undo && (
          <motion.div
            className={classes.undoToast}
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 24, x: "-50%" }}
            transition={motionTransition}
            role="status"
          >
            <span>Deleted {undo.item.name}</span>
            <button type="button" onClick={handleUndoDelete}>
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
