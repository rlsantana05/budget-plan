---
labels:
  - wayfinder:prototype
status: closed
---

# Prototype: Budgeting screen

## Question

Build a cheap, rough Mantine v9 prototype of the Budgeting screen that matches the YNAB JSON shape, to react to:

- Ready to Assign header (amount + Assign action), month note field.
- Category groups with totals (Bills / Needs / Wants), Planned / Spent / Available columns.
- Category rows with icon, selected state, status (e.g., Funded), available status.
- Filter tabs (All / Underfunded / Overfunded / Money Available), toolbar (Category Group, Undo, Redo, Recent Moves), list/detail view toggle.
- Detail panel: category header, available balance + status, breakdown rows (Cash Left Over From Last Month, Assigned This Month, Cash Spending, Credit Spending), target block (set-aside description, due-by, met status).

Mock data is fine. Link the prototype as an asset on this issue on resolution.

## Resolution

A complete Mantine v9 component implementing the full YNAB-style budgeting interface:

**UI Structure:**
- Ready to Assign header with $2,000.00 pool amount and Assign button
- Month note text field ("Enter a note...")
- Toolbar: Category Group, Undo, Redo, Recent Moves
- List/Detail view toggle (default: list)
- Filter tabs: All / Underfunded / Overfunded / Money Available (Snoozed removed)
- Category groups (Bills, Needs, Wants) with roll-up totals (assigned/activity/available)
- Columns: **Planned / Spent / Available** (matching shared-tree naming)
- Detail panel: Cash Left Over, Assigned, Cash Spending, Credit Spending breakdown + target block showing "Set Aside Another $1,000.00 Each Month"
- Credit card payment categories integrated (payment-category rows only visible on Budgeting screen)

**Schema:**
- `month_budgets` per-budget/month
- `category_groups` + `budget_categories` per month (copied forward on month copy)
- `transactions` table (planned implementation)
- Stored rollups for assigned/activity/available
- Due dates stored but Budgeting-only (Planning screen editable)

**Key Behaviors:**
- Per-check Ready to Assign (envelope-style): new checks add to pool, pool resets on assignment
- Category movement: moving money between categories preserves total available (ledger-style)
- Credit spending moves funds from spending category to payment-category

**Asset**: `src/app/(app)/_components/BudgetingPrototype.tsx`
