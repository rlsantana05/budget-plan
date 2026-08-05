---
labels:
  - wayfinder:map
---

# Map: Planning (EveryDollar) + Budgeting (YNAB)

## Destination

A build-ready spec for two screens in budget-plan:

- **Planning** — EveryDollar-style whole-month budget: collapsible group cards, Planned + Spent/Received↔Remaining columns, item due dates, budget-status banner, Summary/Transactions tabs, transaction panel (new/tracked/deleted, search, load-more), add FAB.
- **Budgeting** — YNAB-style funding: Ready to Assign pool, Assigned/Activity/Available columns, filter tabs, list/detail toggle, category detail (breakdown + target), month note, undo/redo.

Both preserve the app's Planned-vs-Funded separation. The map is complete when the data model and screen behavior for both screens are specified and no decisions remain.

## Notes

- Preserve AGENTS.md domain rules: Planned is aspirational (may exceed cash); Funded never exceeds Available to Allocate; moving money between categories never changes total funded; transactions reduce funded, never planned; weekly reviews are checkpoints, not budgeting periods.
- Stack: Next.js 16, React 19, TypeScript strict, Mantine v9, Drizzle ORM (Postgres), lucide-react.
- Skills to consult: /grilling, /domain-modeling, /building-components, /next-best-practices, /postgresql-table-design.
- Tracker: local-markdown (no issue tracker configured). Blocking by body convention — a ticket is unblocked when every ticket named in its `Blocked by:` is closed. Labels `wayfinder:grilling` / `wayfinder:prototype` in frontmatter.
- Branch strategy: no feature branches during charting. Cut `feature/planning-screen` and `feature/budgeting-screen` from main at handoff.

## Decisions so far

- [Planning ↔ Budgeting relationship](tickets/planning-budgeting-relationship.md) — one shared category tree; both screens use Planned/Spent/Remaining naming; Planning = month horizon (aspirational, planned vs received), Budgeting = paycheck horizon (envelope-style per-check Ready to Assign pool, assign-until-zero, unspent stays in Remaining); paycheck is a first-class income event; month copy carries only categories + residual/unassigned (planned resets); due dates Planning-only.
- [Planning data model & UI spec](tickets/planning-data-model.md) — per-month snapshot (EveryDollar convention): each month owns its groups/items, copy deep-clones structure with planned reset; over-budget banner = planned expenses vs planned income (never transactions); first month seeded with EveryDollar default item sets; schema = `month_budgets` / `category_groups` / `budget_categories` (due_date, planned, sortOrder), spent/remaining derived from transactions; collapse/toggle/tabs/search are client state; a `transactions` table is required but deferred to the funding ticket.
- [YNAB funding model & Ready to Assign](tickets/ynab-funding-model.md) — Ready to Assign = running pool seeded per paycheck, leftover unassigned rolls forward, assign-until-zero; persistence = assignment ledger (truth) + materialized rollups (display) → native Undo/Redo + Recent Moves; full YNAB credit-card system with Budgeting-only payment categories; filters All/Underfunded/Overfunded/Money Available (Snoozed removed); target = Planning planned + dueDate; breakdown = cash left over + assigned − cash − credit spending; schema adds `paychecks`, `transactions` (NEW/TRACKED/DELETED), `assignment_ledger`, `category_rollups`, month note; client state = detail selection/filter/view toggle/search.
- [Prototype: Planning screen](tickets/prototype-planning-screen.md) — rough Mantine v9 component matching the EveryDollar JSON: banner, view tabs, collapsible group cards (chevron, Planned/Spent/Received, per-group Spent↔Remaining toggle, allocated totals), item inline edit + due-date + add-item, transaction panel (new/tracked/deleted, search, month-load-more), add-transaction FAB. Asset: `src/features/planning/Planning.tsx`; drag-and-drop stubbed.
- [Prototype: Budgeting screen](tickets/prototype-budgeting-screen.md) — complete Mantine v9 component matching YNAB JSON: Ready to Assign header with pool + Assign button, month note, filter tabs (All/Underfunded/Overfunded/Money Available), toolbar (Category Group, Undo, Redo, Recent Moves, list/detail toggle), Planned/Spent/Available columns with group totals, category rows with icon/status/availableStatus, detail panel with breakdown (cash left over, assigned, cash/credit spending) + target block, credit-card payment categories (Budgeting-only). Asset: `src/app/(app)/_components/BudgetingPrototype.tsx`.

## Not yet specified

_(nothing — the data model and behavior for both screens are fully specified)_

## Out of scope

- Bank sync / Plaid-style auto-import
- Multi-currency
- Standalone transaction-history UI beyond what the Planning panel needs
- Snoozed categories (per-month target-pausing) — explicitly removed from the Budgeting filter set
