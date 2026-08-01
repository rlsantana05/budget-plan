---
labels:
  - wayfinder:grilling
status: closed
---

# YNAB funding model & Ready to Assign

Blocked by: `wayfinder/tickets/planning-budgeting-relationship.md`

Context from the resolved keystone ticket: Budgeting is the **paycheck horizon**, **envelope-style** — Ready to Assign is a **per-check pool** that resets each payday, with an assign-until-zero rule; the **paycheck is a first-class income event** seeding the pool; unspent money stays in category Remaining and rolls forward; both screens use **Planned / Spent / Remaining** naming over one shared tree. Consult `planning-budgeting-relationship.md` for the full resolution.

Context from the resolved planning-model ticket: months are **per-month snapshots** (EveryDollar convention); a `transactions` table does not exist yet and its design (income events, assignments, spending) **lands in this ticket's scope** — it feeds Spent/Activity on both screens. See `planning-data-model.md`.

## Question

Specify the data model and screen behavior for the Budgeting screen, targeting the YNAB JSON shape:

- The Ready to Assign pool: how income lands in it, how "Assign" actions draw from it, and the invariant that total funded never exceeds it.
- Per-category and per-group Assigned / Activity / Available, and how the group totals roll up.
- The detail-panel breakdown math: Cash Left Over From Last Month, Assigned This Month, Cash Spending, Credit Spending, and the available-balance status (confirmed/positive).
- Target sourcing: Budgeting's target (set-aside amount, due-by) derives from Planning's planned amount + `dueDate`, not set independently. What does "You've met your target" mean?
- Filter tabs (All / Underfunded / Overfunded / Money Available / Snoozed) — what each filter selects and what "Snoozed" is.
- Toolbar: Category Group action, Undo/Redo, Recent Moves, list/detail view toggle.
- Month note field.
- What belongs in the DB schema (Drizzle/Postgres) vs client-side UI state.

## Resolution

**Ready to Assign pool (refined).** Envelope-style running pool: each paycheck (income event) seeds the pool; **leftover unassigned money rolls forward** into the pool when the next check arrives; the pool is emptied only when every dollar is assigned (assign-until-zero). Rule: total funded never exceeds the pool; moving money between categories never changes total funded.

**Persistence (premium pattern).** `assignment_ledger` = source of truth; **materialized rollups** (assigned / activity / available per month-category) = read model kept in sync on write. The ledger natively supports Undo/Redo (reverse/replay rows) and Recent Moves (recent rows); per-check sourcing is intrinsic.

**Credit-card system (full YNAB, Budgeting-only).** Adding a CREDIT_CARD account auto-creates a **payment category** for it in a "Credit Cards" group. New credit purchase: spending category's Remaining drops and the amount moves into the card's payment category. Existing balance on add: funded manually by assigning into the payment category. Paying the card: transaction from a cash account to the card; payment-category Available decreases by the payment. Payment-category Available ≥ card balance owed → "confirmed" (green). Credit moves write ledger rows (a spend + a move-to-payment), not just a spend. Payment categories never appear on the Planning screen.

**Filters.** All / Underfunded / Overfunded / Money Available. Snoozed was explicitly removed.
- Underfunded: planned (Planning) > funded + available this month
- Overfunded: funded > planned
- Money Available: Remaining/Available > 0
- All: everything

**Target sourcing.** The target is the Planning item's `planned` + `dueDate`. "Met" = funded ≥ planned. The set-aside description ("Set Aside Another $1,000.00 Each Month") and due description ("By the 1st of the Month") are derived, not stored.

**Breakdown formula.** Available = Cash Left Over From Last Month + Assigned This Month − Cash Spending − Credit Spending. Available-balance status: confirmed (green) when no overspend and payment obligations covered; positive otherwise.

**Schema (Postgres/Drizzle).** Extends the planning snapshot tables (`month_budgets`, `category_groups`, `budget_categories`):
- `paychecks` — income events: id, `month_budget_id` FK, `account_id` FK, amount, date, note. Seeds the pool.
- `transactions` — spending: id, `month_budget_id` FK, `account_id` FK, `category_id` FK (nullable = untracked), amount, date, payee, memo, cleared, status (`NEW` / `TRACKED` / `DELETED` — maps to the Planning panel tabs).
- `assignment_ledger` — funding moves: id, `month_budget_id` FK, `paycheck_id` FK (nullable), `category_id` FK, `move_id` (links debit/credit pairs of a single move), amount (signed), type (`ASSIGN`, `MOVE_IN`, `MOVE_OUT`, `CREDIT_SPEND`, `CARD_PAYMENT`), created_at.
- `category_rollups` — materialized read model: `month_budget_id` + `category_id`, assigned, activity, available, assigned_from_credit, updated_at.
- `month_budgets.note` — the month note field.

**DB vs client state.** DB: paychecks, transactions, ledger, rollups, month note, category/group structure. Client-only (transient UI): selected category (detail-panel state), active filter tab, list/detail view toggle, panel search query.

**UI spec captured from the target JSON + session:** month header + month note ("Enter a note…"); Ready to Assign header (amount + Assign action); filter tabs; toolbar (Category Group, Undo, Redo, Recent Moves) + list/detail toggle; columns Planned / Spent / Remaining (renamed from Assigned/Activity/Available) with group totals; category rows with icon, selected state, status (e.g., Funded), available status; detail panel (category header, available balance + status, breakdown rows, target block with set-aside/due/met).
