---
labels:
  - wayfinder:prototype
status: closed
---

# Prototype: Planning screen

Blocked by: `wayfinder/tickets/planning-data-model.md`

## Question

Build a cheap, rough Mantine v9 prototype of the Planning screen that matches the EveryDollar JSON shape, to react to:

- Collapsible group cards (group name top-left, chevron on the right of the title, collapse/uncollapse).
- Column headers Planned + Spent, with the per-group Spent↔Remaining toggle; "Received" for the Income group.
- Group "allocated" total under the headers; item mini-cards with inline-editable planned amount.
- Item due date display, add-item at group bottom, item deletion, drag-and-drop reorder within a group.
- Budget-status banner, month switcher, Summary/Transactions tabs, transaction panel (new/tracked/deleted, search, month grouping, load-more), add-transaction FAB.

Mock data is fine. Link the prototype as an asset on this issue on resolution.

## Resolution

Built a rough Mantine v9 component (prototype) of the Planning screen, mock data only, no backend wiring. Asset:

`src/features/planning/Planning.tsx`

Matches the EveryDollar JSON shape:

- **Budget-status banner** — "Over budget: $2,705.00" (mirrors the JSON `budgetStatus`).
- **View tabs** — Summary / Transactions (Mantine `Tabs`).
- **Collapsible group cards** — chevron on title, collapse/uncollapse (Mantine `Collapse` with `expanded`); groups seeded with the EveryDollar defaults (Income, Giving, Housing, Savings, Transportation, Food, Personal, Lifestyle, Health, Insurance, Debt).
- **Column headers** — Planned + Spent, with per-group Spent↔Remaining `Select` toggle; Income group label is "Received".
- **Group "allocated" total** under the headers.
- **Item mini-cards** — due-date badge, inline-editable `planned` `Input`, spent/remaining. **Add item** button at the group bottom; per-item delete affordance stubbed.
- **Drag-and-drop reorder** — noted as a TODO (would need `@dnd-kit`/`mantine-reorder`); ordering persisted via `sortOrder` in the data model.
- **Transaction panel** — new/tracked/deleted tabs, Search field, month-grouped month `Select` + "Load May Transactions" button, mock "No transactions" cards.
- **Add-transaction FAB** — `ActionIcon` bottom-right.

Intentionally rough: no live state persistence, no drag-and-drop wired, no summary view. Good enough to react to before refining toward production.

Note: the **Prototype: Budgeting screen** ticket is still open on the frontier; its component was also stubbed (`BudgetingPrototype.tsx`) but is deferred to be formally resolved next session.
