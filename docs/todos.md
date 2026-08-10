## Planning

- move chevron to the left of the category
- create just one header Category
  Assigned
  Activity
  Available

- calculate total on the top of the card

Here's what the planning feature implements that the budget feature does not:
Budget row editing (budget rows are read-only)

- Inline rename / planned-amount editing (blur commit, Enter/Escape)
- Inline Assigned-amount editing
- Add category/income item inline form (budget's is a no-op stub console.log)
- Delete category (with arm-with-confirm warning when transactions exist, soft delete)
- Undo-delete toast (5s window, restores item)
- Drag-to-reorder items within a group
- Mark income as "received" (creates paycheck, blocked-with-hint when no account)
  Funding / targets
- Targets modal — set/edit/clear NONE / ONCE / MONTHLY targets (budget only displays target as a MetaPill)
- "Assign to Targets" bulk button — funds all underfunded targets
- Single-category "Assign to Target" from category hub
- Ready-to-Assign computed display (received − funded)
- Budget's hero "Assign" button is a no-op; planning has no hero button
  Transactions (budget has none)
- Add transaction modal (amount/payee/memo/category/account)
- Track NEW → TRACKED with atomic rollup/paycheck/balance side effects
- Delete transaction (soft, reverses side effects)
- Status subtabs (NEW / TRACKED / DELETED)
- Search across payee/memo/category
- Month grouping of transactions
- View toggle Summary ↔ Transactions (donut chart + metric table)
  Category drill-down (budget has none)
- Select a row → full category hub: stats, 3-month spending trend sparkline, target status, per-category transaction list, click-outside deselect
  Cross-cutting behavior (budget is display-only)
- Optimistic UI everywhere with router.refresh() reconciliation (useServerSync)
- Busy/error state management (usePlanningActionState)
- Inline server-error surfacing
- Framer-motion month-slide animations, reduced-motion support, animated banner/money
  Structural (budget is missing)
- useBudgetGroups.ts in budget is empty (0 lines) — the real one lives only in planning
- Budget ignores DTO fields transactions, accounts, budgetStatus, viewTabs, note; planning renders all of them
- Budget's collapse state is ephemeral client state; planning also threads expanded state through cards
  In short: planning is the fully-wired interactive feature (editing, funding, targets, transactions, undo, optimistic sync); budget is a read-only envelope-style display whose Add-item and Assign buttons are stubs, with all the needed server actions (addCategoryItem, setCategoryAssigned, assignToTargets, setCategoryTarget, etc.) already existing but unwired.
