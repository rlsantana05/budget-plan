"use client";

import { useState } from "react";
import { Modal, NumberInput, TextInput } from "@mantine/core";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Pencil,
  Plus,
  Redo2,
  TestTube2,
  Undo2,
} from "lucide-react";
import { addPaycheck, assignToCategory, undoLastMove } from "@/actions/budget-planning";
import type { BudgetScreenDTO } from "@/types/budget";
import classes from "./BudgetingPrototype.module.css";

interface BudgetingPrototypeProps {
  initialData?: BudgetScreenDTO;
}

type AvailableStatus = "positive" | "negative" | "neutral";

interface CategoryItem {
  name: string;
  icon?: string;
  planned: number;
  assigned: number;
  activity: number;
  available: number;
  availableStatus: AvailableStatus;
  status?: string;
}

interface CategoryGroup {
  name: string;
  assigned: number;
  activity: number;
  available: number;
  categories: CategoryItem[];
}

const MOCK_GROUPS: CategoryGroup[] = [
  {
    name: "Bills",
    assigned: 1000,
    activity: 0,
    available: 1000,
    categories: [
      {
        name: "Rent",
        icon: "🏠",
        planned: 1000,
        assigned: 1000,
        activity: 0,
        available: 1000,
        availableStatus: "positive",
        status: "Funded",
      },
      {
        name: "Utilities",
        icon: "⚡",
        planned: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        availableStatus: "positive",
      },
      {
        name: "Insurance",
        icon: "📄",
        planned: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        availableStatus: "positive",
      },
      {
        name: "Music",
        icon: "🎵",
        planned: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        availableStatus: "positive",
      },
    ],
  },
  {
    name: "Needs",
    assigned: 0,
    activity: 0,
    available: 0,
    categories: [
      {
        name: "Groceries",
        icon: "🛒",
        planned: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        availableStatus: "positive",
      },
      {
        name: "Transportation",
        icon: "🎯",
        planned: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        availableStatus: "positive",
      },
      {
        name: "Car maintenance",
        icon: "🚗",
        planned: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        availableStatus: "positive",
      },
      {
        name: "Annual credit card fees",
        icon: "💳",
        planned: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        availableStatus: "positive",
      },
    ],
  },
  {
    name: "Wants",
    assigned: 0,
    activity: 0,
    available: 0,
    categories: [
      {
        name: "Holidays & gifts",
        icon: "🎁",
        planned: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        availableStatus: "positive",
      },
    ],
  },
];

const FILTER_OPTIONS = [
  "All",
  "Underfunded",
  "Overfunded",
  "Money Available",
];

function formatMoney(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function BudgetingPrototype({
  initialData,
}: BudgetingPrototypeProps) {
  const router = useRouter();

  const groups: CategoryGroup[] = initialData
    ? initialData.categoryGroups.map((g) => ({
        name: g.name,
        assigned: g.assigned,
        activity: g.activity,
        available: g.available,
        categories: (g.items ?? []).map((c) => ({
          name: c.name,
          icon: undefined,
          planned: c.planned,
          assigned: c.assigned,
          activity: c.activity,
          available: c.available,
          availableStatus: c.availableStatus,
          status: c.status,
        })),
      }))
    : MOCK_GROUPS;

  const month = initialData?.month ?? "Apr";
  const year = initialData?.year ?? 2026;
  const note = initialData?.note ?? "Enter a note...";
  const readyAmount = initialData?.readyToAssign?.amount ?? 2000;
  const readyLabel = initialData?.readyToAssign?.label ?? "Ready to Assign";
  const readyAction = initialData?.readyToAssign?.action ?? "Assign";
  const filterOptions = initialData?.filterTabs?.options ?? FILTER_OPTIONS;
  const activeFilterDefault = initialData?.filterTabs?.active ?? "All";

  const [activeFilter, setActiveFilter] = useState(activeFilterDefault);
  const [selectedName, setSelectedName] = useState<string | null>(() => {
    const cats = initialData
      ? initialData.categoryGroups.flatMap((g) => g.items)
      : MOCK_GROUPS.flatMap((g) => g.categories);
    return cats[0]?.name ?? null;
  });
  const [paycheckOpen, setPaycheckOpen] = useState(false);
  const [paycheckAmount, setPaycheckAmount] = useState<number>(0);
  const [paycheckNote, setPaycheckNote] = useState("");
  const [assignAmount, setAssignAmount] = useState<number>(0);
  const [busy, setBusy] = useState<"paycheck" | "assign" | "undo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allCategories = groups.flatMap((g) => g.categories);
  const selected =
    allCategories.find((c) => c.name === selectedName) ?? null;

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      categories: group.categories.filter((cat) => {
        switch (activeFilter) {
          case "Underfunded":
            return cat.planned > cat.assigned;
          case "Overfunded":
            return cat.assigned > cat.planned;
          case "Money Available":
            return cat.available > 0;
          default:
            return true;
        }
      }),
    }))
    .filter((group) => group.categories.length > 0);

  const runAction = async (
    key: "paycheck" | "assign" | "undo",
    fn: () => Promise<void>,
  ) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const handleAddPaycheck = () =>
    runAction("paycheck", async () => {
      await addPaycheck(paycheckAmount, paycheckNote || undefined);
      setPaycheckOpen(false);
      setPaycheckAmount(0);
      setPaycheckNote("");
    });

  const handleAssign = () =>
    runAction("assign", async () => {
      if (!selected) return;
      await assignToCategory(
        initialData?.categoryGroups
          .flatMap((g) => g.items)
          .find((c) => c.name === selected.name)?.id ?? "",
        assignAmount,
      );
      setAssignAmount(0);
    });

  const handleUndo = () => runAction("undo", undoLastMove);

  const breakdown = [
    { label: "Cash Left Over From Last Month", amount: 0, signed: true },
    {
      label: "Assigned This Month",
      amount: selected?.assigned ?? 0,
      signed: true,
    },
    { label: "Cash Spending", amount: selected?.activity ?? 0, neg: true },
    { label: "Credit Spending", amount: 0, neg: true },
  ];

  const planned = selected?.planned ?? 0;
  const assigned = selected?.assigned ?? 0;
  const metTarget = planned > 0 && assigned >= planned;

  const breakdownText = (b: (typeof breakdown)[number]) => {
    const text = formatMoney(b.amount);
    if (b.signed) return `+${text}`;
    if (b.neg && b.amount > 0) return `-${text}`;
    return text;
  };

  return (
    <div className={classes.page}>
      {/* Top row */}
      <div className={classes.topRow}>
        <div className={classes.monthNav}>
          <button className={classes.arrow} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className={classes.month}>
              {month} {year}
              <ChevronDown size={14} />
            </div>
            <div className={classes.note}>{note}</div>
          </div>
          <button className={classes.arrow} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className={classes.readyBanner}>
          <div>
            <div className={classes.readyAmt}>{formatMoney(readyAmount)}</div>
            <div className={classes.readyLbl}>{readyLabel}</div>
          </div>
          <button
            className={classes.readyBtn}
            type="button"
            onClick={() => setPaycheckOpen(true)}
          >
            {readyAction} <ChevronDown size={14} />
          </button>
        </div>

        <div className={classes.addMember}>+ Add Member</div>
      </div>

      {/* Filters */}
      <div className={classes.filters}>
        {filterOptions.map((f) => (
          <button
            key={f}
            type="button"
            className={`${classes.pill} ${activeFilter === f ? classes.active : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
        <span className={classes.filterIcon}>
          <TestTube2 size={16} />
        </span>
      </div>

      <div className={classes.layout}>
        {/* Left column */}
        <div>
          <div className={classes.toolbar}>
            <div className={classes.toolbarLeft}>
              <button type="button">
                <Plus size={14} /> Category Group
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={busy === "undo"}
              >
                <Undo2 size={14} /> Undo
              </button>
              <button type="button" className={classes.dim}>
                <Redo2 size={14} /> Redo
              </button>
              <button type="button">
                <History size={14} /> Recent Moves
              </button>
            </div>
          </div>

          <table className={classes.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Assigned</th>
                <th>Activity</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {visibleGroups.map((group) => (
                <GroupRows
                  key={group.name}
                  group={group}
                  selectedName={selectedName}
                  onSelect={(name) => setSelectedName(name)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Right panel */}
        <div>
          {selected ? (
            <>
              <div className={classes.panel}>
                <div className={classes.panelHeader}>
                  <h2 className={classes.panelTitle}>
                    {selected.icon && <span>{selected.icon}</span>}
                    {selected.name}
                  </h2>
                  <button className={classes.editBtn} aria-label="Edit">
                    <Pencil size={16} />
                  </button>
                </div>

                <div className={classes.availRow}>
                  Available Balance <ChevronDown size={14} />
                  <span className={classes.availBadge}>
                    ✓ {formatMoney(selected.available)}
                  </span>
                </div>
                {breakdown.map((b) => (
                  <div className={classes.breakdownRow} key={b.label}>
                    <span>{b.label}</span>
                    <span
                      className={
                        b.signed && b.amount > 0 ? classes.breakdownPos : ""
                      }
                    >
                      {breakdownText(b)}
                    </span>
                  </div>
                ))}

                <div className={classes.assignBox}>
                  <NumberInput
                    className={classes.assignInput}
                    value={assignAmount}
                    onChange={(v) =>
                      setAssignAmount(typeof v === "number" ? v : 0)
                    }
                    min={0}
                    decimalScale={2}
                    placeholder="0.00"
                    disabled={busy !== null}
                  />
                  <button
                    type="button"
                    className={classes.assignBtn}
                    onClick={handleAssign}
                    disabled={
                      busy !== null || assignAmount <= 0 || readyAmount <= 0
                    }
                  >
                    Assign
                  </button>
                </div>
                {error && <div className={classes.error}>{error}</div>}
              </div>

              <div className={classes.panel}>
                <div className={classes.targetTitle}>
                  ✓ Target <ChevronDown size={14} />
                </div>
                <div className={classes.targetDesc}>
                  Set Aside Another {formatMoney(planned)} Each Month
                </div>
                <div className={classes.targetSub}>By the 1st of the Month</div>
                <div className={classes.targetCheck}>✓</div>
                <div
                  className={classes.metBanner}
                  style={{
                    color: metTarget ? "var(--green-light)" : "var(--ink-soft)",
                    background: metTarget
                      ? "rgba(95, 162, 58, 0.16)"
                      : "rgba(255,255,255,0.05)",
                  }}
                >
                  {metTarget
                    ? "You've met your target!"
                    : "Not yet funded"}
                </div>
                <div className={classes.amountRow}>
                  <span>Amount to Assign This Month</span>
                  <b>{formatMoney(Math.max(planned - assigned, 0))}</b>
                </div>
                <div className={classes.amountRow}>
                  <span>Assigned So Far</span>
                  <b>{formatMoney(assigned)}</b>
                </div>
              </div>
            </>
          ) : (
            <div className={classes.panel}>
              <div className={classes.panelTitle}>Select a category</div>
            </div>
          )}
        </div>
      </div>

      {/* Add paycheck modal */}
      <Modal.Root
        opened={paycheckOpen}
        onClose={() => setPaycheckOpen(false)}
      >
        <Modal.Overlay backgroundOpacity={0.6} blur={3} />
        <Modal.Content
          style={{
            borderRadius: 16,
            background: "var(--mantine-color-surface-2)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 24,
          }}
        >
          <div className={classes.modalTitle}>Add a paycheck</div>
          <div className={classes.modalField}>
            <NumberInput
              label="Amount"
              value={paycheckAmount}
              onChange={(v) =>
                setPaycheckAmount(typeof v === "number" ? v : 0)
              }
              min={0}
              decimalScale={2}
              autoFocus
            />
          </div>
          <div className={classes.modalField}>
            <TextInput
              label="Note (optional)"
              value={paycheckNote}
              onChange={(e) => setPaycheckNote(e.target.value)}
              placeholder="e.g. Mid-month check"
            />
          </div>
          {error && <div className={classes.error}>{error}</div>}
          <div className={classes.modalActions}>
            <button
              type="button"
              className={`${classes.modalButton} ${classes.secondary}`}
              onClick={() => setPaycheckOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={classes.modalButton}
              onClick={handleAddPaycheck}
              disabled={busy === "paycheck" || paycheckAmount <= 0}
            >
              {busy === "paycheck" ? "Saving…" : "Save paycheck"}
            </button>
          </div>
        </Modal.Content>
      </Modal.Root>
    </div>
  );
}

function GroupRows({
  group,
  selectedName,
  onSelect,
}: {
  group: CategoryGroup;
  selectedName: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <>
      <tr className={classes.groupRow}>
        <td>{group.name}</td>
        <td>{formatMoney(group.assigned)}</td>
        <td>{formatMoney(group.activity)}</td>
        <td>{formatMoney(group.available)}</td>
      </tr>
      {group.categories.map((cat) => {
        const isSelected = cat.name === selectedName;
        return (
          <tr
            key={cat.name}
            className={`${classes.catRow} ${isSelected ? classes.selected : ""}`}
            onClick={() => onSelect(cat.name)}
          >
            <td>
              <div className={classes.catName}>
                <input
                  type="checkbox"
                  className={classes.checkbox}
                  checked={isSelected}
                  readOnly
                />
                {cat.icon && <span>{cat.icon}</span>}
                <span>{cat.name}</span>
                {cat.status && (
                  <span className={classes.fundedTag}>{cat.status}</span>
                )}
              </div>
              {isSelected && <div className={classes.underlineBar} />}
            </td>
            <td>
              <span className={classes.assignedCell}>
                {formatMoney(cat.assigned)}
              </span>
            </td>
            <td>{formatMoney(cat.activity)}</td>
            <td>
              {cat.availableStatus === "positive" ? (
                <span className={classes.availableBadge}>
                  ✓ {formatMoney(cat.available)}
                </span>
              ) : (
                <span className={classes.availablePlain}>
                  {formatMoney(cat.available)}
                </span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
