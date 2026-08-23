# Audit ToDos (2026-08-22)

Prioritized from the app audit. Specs live in `docs/specs/`. Work in order —
the test fix restores the safety net everything else depends on.

## P0 — Correctness

- [x] **Fix failing test suite** (3 failures) — spec: `2026-08-22-fix-failing-test-suite.md` ✅ `977bdb6`
  - [ ] Update `BudgetCategoryHeader.test.tsx` for `showAddButton` prop
  - [ ] `parseAmountText`: NaN → 0 (`formatters.ts`)
  - [ ] `resolveTargetDueDate` MONTHLY end-of-month clamp (`status.ts`) + rename shadowed `now`
- [x] **Optimistic update rollback on API failure** — spec: `2026-08-22-optimistic-update-rollback.md` ✅ `bd1266b`/`13038f5`
  - [x] Rollback registry in store actions
  - [x] Wire into `runTxAction` failure branch
  - [x] Store unit tests with mocked failing API (5 tests)
- [x] **Server action input validation** (zod) — spec: `2026-08-22-server-action-validation.md` ✅ `c301b1f`
  - [x] Schemas per action + formatValidationError wrapper
  - [x] 19 rejection/acceptance tests
- [x] **Money in integer cents** — spec: `2026-08-22-money-in-cents.md` ✅ `f46c8b9`/`82ece5c`
  - [x] `money.ts` helpers + property tests
  - [x] DTO fields → `*Cents`; fix server actions
  - [x] `GroupItem` → cents; fix store/components
  - [x] `formatMoney(cents)` / `parseAmountToCents`; delete wrappers

## P1 — Consistency & UX

- [ ] **Budget screen: envelope budgeting (YNAB-style real money)** — spec: `2026-08-22-budget-envelope-screen.md`
  - [ ] Phase 1 MVP: header strip (Cash on Hand / Assigned / Ready to Assign), paycheck inbox, envelope columns, assign flow, cover overspend
- [ ] **Unify Income + Category rows into one `BudgetRow`** — spec: `2026-08-22-unify-row-components.md`
  - [ ] Shared component w/ `isIncome` switch; single keyboard contract (Enter/Escape/blur)
  - [ ] Shared reorder wrapper usage; adopt two-step delete for income
  - [ ] Delete `IncomeRow` + duplicate CSS (target ≥ −300 LOC)

## P2 — Hygiene

- [ ] **Replace `<span role="button">` with real buttons** (4 files) — part of row-unification spec §3
  - [ ] `BudgetGroupHeader.tsx:100`, `BudgetGroupCardItem.tsx:197`, `AccountsClient.tsx:313`, `TypeCard.tsx:27`
- [ ] **Repo hygiene: lint gate + stray files** — spec: `2026-08-22-repo-hygiene.md`
  - [ ] Fix ~31 eslint errors; wire lint into build gate
  - [ ] Commit/delete `.agent/`, `.claude/`, scratch docs; gitignore tool dirs
  - [ ] Decide `onAssignAll`/`assignAllBusy`: implement per ADR-0002 §3 or remove
- [ ] Minor polish: skip no-op reorder commits; clear undo timer on new delete

## Pre-existing ToDos (carried over)

- [ ] Update account creation form (color)
- [ ] Option to reset budget or delete and create budget
- [ ] How much money is available to assign
