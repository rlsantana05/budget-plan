# Spec: Budget Screen — Envelope Budgeting (YNAB-style, Real Money On Hand)

- **Status:** Proposed
- **Date:** 2026-08-22
- **Priority:** Feature (next major)
- **Related:** ADR-0001 (money on available), ADR-0002 (persistent categories/targets),
  `src/lib/pool.ts`, `assignmentLedger` + `categoryRollups` schema, Planning screen
  (EveryDollar-style plan layer)

## Vision

The app has two money layers:

| Layer | Screen | Question it answers | Model |
|---|---|---|---|
| **Plan** | Planning (exists) | "What do I *expect* to earn and *plan* to spend this month?" | EveryDollar zero-based plan; Received = progress tracking |
| **Cash** | **Budget (this spec)** | "What money do I *actually have* right now, and what job does each dollar have?" | YNAB envelope budgeting |

The Budget screen is where **real money on hand** is assigned, paycheck by
paycheck, into envelopes (categories). Monarch-inspired conveniences
(recurring detection, flexible rollover) are in scope as follow-ups.

## Core concepts

- **Cash on Hand (pool)** — Σ liquid account balances. The only source of real
  money. (`getLiquidAccountBalance()` already exists.)
- **Ready to Assign** — Cash on Hand − Σ Assigned this month (+/− overspend
  coverage adjustments). `calculateAvailableToAssign()` exists and stays authoritative.
- **Envelope** — a persistent category's monthly bucket: `assigned`,
  `activity`, `available = assigned − activity`. Materialized in
  `categoryRollups`; ledger of truth in `assignmentLedger`.
- **Paycheck-first flow** — money enters via income transactions/paychecks;
  the user immediately assigns it to envelopes ("give every dollar a job").
- **Overspend** — `available < 0` at month end must be covered from another
  envelope or carried as debt (explicit user choice).

## Feature set

### Phase 1 — Assign real money (MVP)

1. **Header strip**: Cash on Hand · Assigned this month · **Ready to Assign**
   (large, live). Negative RTA renders in warning tone.
2. **Paycheck inbox**: unassigned income detected (income transaction without a
   linked assignment) surfaces as "Assign $X?" nudge.
3. **Envelope columns**: per category row — `Assigned | Activity | Available`
   (schema fields already exist). Inline edit on Assigned.
4. **Assign flow**: typing an amount writes an `assignmentLedger` row
   (`moveType: ASSIGN`), refreshes `categoryRollups`, decrements Ready to
   Assign. Server actions for assign/move already partially exist (`setCategoryAssigned`).
5. **Cover overspend**: context action on a negative-available category →
   pick donor envelope → writes paired MOVE_OUT/MOVE_IN ledger rows sharing a
   `moveId`.
6. **Month selector**: exists (`MonthSelector`). Each month starts with RTA =
   Cash on Hand − assigned that month; prior months frozen.

### Phase 2 — Automation & insight

7. **Recurring detection**: transactions with same payee + ~monthly cadence →
   suggested monthly targets (Monarch-style).
8. **Auto-assign**: one-click "fund targets" using existing
   `assignAvailableToTargets` (ADR-0002 §3), capped by Ready to Assign.
9. **Rollover policy per category**: ask / carry available / reset (Monarch-style flexibility).
10. **Goals progress bars** on envelopes with targets.

### Out of scope (later)

- Bank syncing/import (CSV import first if needed).
- Credit card payment envelopes (requires credit-flow design; schema has
  `CREDIT_SPEND` move type reserved).

## Data & actions

All write paths go through server actions validating inputs (per
`2026-08-22-server-action-validation.md`). No new tables required:

- Writes: `assignmentLedger` (+ paired rows for moves) → recompute
  `categoryRollups` (existing refresh routine) → revalidate `/budget`, `/planning`.
- Reads: `categoryRollups`, `accounts.balance`, `transactions` (income inbox).
- Money math follows `2026-08-22-money-in-cents.md` when implemented.

## UI notes

- Reuse Planning visual language (dark cards, flat banner, inline editable
  amounts) so the two screens feel like siblings.
- Row component should come from the unified `BudgetRow` spec
  (`2026-08-22-unify-row-components.md`) if completed first.

## Acceptance criteria

### Phase 1

- [ ] Creating an account with opening balance → Cash on Hand + RTA increase;
      Planning shows matching Starting Balance income (already shipped, `0285d9b`).
- [ ] Assigning $50 to Groceries: ledger row written, rollup updated,
      RTA −$50, envelope Available $50.
- [ ] Spending tracked against Groceries: Activity −$x, Available drops.
- [ ] Cover overspend moves money between envelopes atomically (single moveId).
- [ ] Month navigation shows each month's own assignments; no cross-month bleed.
- [ ] All numbers agree between header strip and sum of envelope rows.

## Open questions

- Should Planning's "planned" prefill Budget's initial assigned amounts when a
  new month starts (plan → cash handoff), or start every month at 0?
  Recommendation: optional "copy plan" button, default empty.
