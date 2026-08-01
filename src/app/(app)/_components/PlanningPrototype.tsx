"use client";

import { useMemo, useState } from "react";
import { Menu, Modal, NumberInput, Select, TextInput } from "@mantine/core";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import {
  addCategoryItem,
  addTransaction,
  deleteCategoryItem,
  deleteTransaction,
  trackTransaction,
  updateCategoryItem,
} from "@/actions/budget-planning";
import type {
  BudgetTransactionDTO,
  MonthBudgetPlanDTO,
} from "@/types/budget";
import classes from "./PlanningPrototype.module.css";

interface PlanningPrototypeProps {
  initialData?: MonthBudgetPlanDTO;
}

interface GroupItem {
  id: string;
  name: string;
  dueDate: string | null;
  planned: number;
  spent: number;
  remaining: number;
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
      },
      {
        id: "mock-maint",
        name: "Maintenance",
        dueDate: null,
        planned: 0,
        spent: 0,
        remaining: 0,
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

function formatDue(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const monthName = d.toLocaleString("en-US", { month: "short" });
  return `${monthName} ${day}${suffix}`;
}

function toGroups(dto: MonthBudgetPlanDTO): Group[] {
  return (dto.categories ?? []).map((cg) => ({
    id: cg.id,
    name: cg.name,
    defaultExpanded: false,
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
    })),
  }));
}

export default function PlanningPrototype({
  initialData,
}: PlanningPrototypeProps = {}) {
  const dtoGroups: Group[] | undefined = initialData
    ? toGroups(initialData)
    : undefined;

  const month = initialData?.month ?? "July";
  const year = initialData?.year ?? 2026;
  const bannerAmount = initialData?.budgetStatus?.overBudgetAmount ?? 2705;
  const bannerLabel = initialData?.budgetStatus?.label ?? "over budget";

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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlanned, setEditPlanned] = useState<number>(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const router = useRouter();

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
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
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
    const name = newItemName;
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
                  planned: 0,
                  spent: 0,
                  remaining: 0,
                },
              ],
            }
          : g,
      ),
    );
    setNewItemName("");
    setAddItemGroup(null);

    runTxAction("row", async () => {
      const created = await addCategoryItem(groupId, name);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                items: g.items.map((it) =>
                  it.id === tempId
                    ? {
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
  };

  const startEditItem = (item: GroupItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPlanned(item.planned);
    setConfirmDeleteId(null);
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

  const handleDeleteItem = (itemId: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.filter((it) => it.id !== itemId),
      })),
    );
    setConfirmDeleteId(null);

    runTxAction("row", async () => {
      await deleteCategoryItem(itemId);
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
        <div className={classes.monthTitle}>
          <strong>{month}</strong>
          <span className={classes.year}>{year}</span>
          <ChevronDown size={16} className={classes.chev} />
        </div>
        <div className={classes.navArrows}>
          <button aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <button aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className={classes.layout}>
        {/* Left column */}
        <div className={classes.leftCol}>
          <div className={`${classes.card} ${classes.banner}`}>
            <span className={classes.bannerAmount}>
              {formatMoney(bannerAmount)}
            </span>{" "}
            {bannerLabel}
          </div>

          {groups.map((group) => {
            const isExpanded =
              expandedGroups[group.id] ?? group.defaultExpanded;
            const rightColumn = groupRightColumn(group);
            const rightLabel = group.isIncome ? "Received" : rightColumn;

            return (
              <div className={classes.card} key={group.id}>
                <div
                  className={classes.catRow}
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className={classes.catName}>
                    {group.name}
                    <ChevronDown
                      size={16}
                      className={`${classes.catChev} ${isExpanded ? classes.open : ""}`}
                    />
                  </div>

                  <div
                    className={classes.catCols}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Planned</span>
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
                </div>

                {isExpanded && (
                  <div className={classes.items}>
                    {group.items.map((item, idx) =>
                      editingItemId === item.id ? (
                        <div
                          className={`${classes.itemRow} ${classes.itemEditing}`}
                          key={`${group.id}-${idx}`}
                        >
                          <div className={classes.editForm}>
                            <TextInput
                              autoFocus
                              size="xs"
                              placeholder="Name"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdateItem(item.id);
                                if (e.key === "Escape") setEditingItemId(null);
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
                      ) : (
                        <div
                          className={classes.itemRow}
                          key={`${group.id}-${idx}`}
                        >
                          <div className={classes.itemMain}>
                            <div>
                              <div className={classes.itemName}>
                                {item.name}
                              </div>
                              {item.dueDate && (
                                <div className={classes.itemDue}>
                                  Due: {formatDue(item.dueDate)}
                                </div>
                              )}
                            </div>
                            <div className={classes.itemActions}>
                              <button
                                type="button"
                                className={classes.itemIconBtn}
                                onClick={() => startEditItem(item)}
                                aria-label={`Edit ${item.name}`}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className={`${classes.itemIconBtn} ${classes.itemDelete}`}
                                onClick={() =>
                                  confirmDeleteId === item.id
                                    ? handleDeleteItem(item.id)
                                    : setConfirmDeleteId(item.id)
                                }
                                disabled={busy !== null}
                                aria-label={`Delete ${item.name}`}
                              >
                                {confirmDeleteId === item.id ? (
                                  <span className={classes.confirmLabel}>
                                    Sure?
                                  </span>
                                ) : (
                                  <Trash size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className={classes.itemAmounts}>
                            <span>{formatMoney(item.planned)}</span>
                            <span>
                              {formatMoney(
                                rightColumn === "Remaining"
                                  ? item.remaining
                                  : item.spent,
                              )}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                    {addItemGroup === group.id ? (
                      <div className={classes.addItemForm}>
                        <TextInput
                          autoFocus
                          placeholder="Item name"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddItem(group.id);
                            if (e.key === "Escape") {
                              setNewItemName("");
                              setAddItemGroup(null);
                            }
                          }}
                          size="xs"
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
                          onClick={() => {
                            setNewItemName("");
                            setAddItemGroup(null);
                          }}
                          aria-label="Cancel add item"
                        >
                          <span aria-hidden>×</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={classes.addItem}
                        onClick={() => setAddItemGroup(group.id)}
                      >
                        + Add item
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
    </div>
  );
}
