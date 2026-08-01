---
labels:
  - wayfinder:grilling
status: closed
---

# Planning data model & UI spec

Blocked by: `wayfinder/tickets/planning-budgeting-relationship.md`

Context from the resolved keystone ticket: one **shared category tree** with EveryDollar default groups (Income, Giving, Housing, Savings, Transportation, Food, Personal, Lifestyle, Health, Insurance, Debt + custom); both screens use **Planned / Spent / Remaining** naming; Planning is the **month horizon** (aspirational); month copy carries only the category structure + residual/unassigned money — planned amounts reset. Consult `planning-budgeting-relationship.md` for the full resolution.

## Question

Specify the data model and screen behavior for the Planning screen, targeting the EveryDollar JSON shape:

- Schema for groups and items (name, `dueDate`, `planned`, `spent`/remaining), including `columnLabels` where Income uses "Received" instead of "Spent".
- Per-group right-column toggle (Spent ↔ Remaining) — state lives per group, not global.
- Budget-status banner (over/under budget amount + label) — what rule computes it?
- Month view header and month switching; month-copy semantics (categories only — structure carries, planned amounts reset).
- Transaction panel state: Summary/Transactions view tabs; new/tracked/deleted tabs; search; month-grouped transactions with load-more ("Load May Transactions").
- Add-item per group, item deletion, drag-and-drop reorder within a group, inline amount editing.
- The add-transaction FAB.
- What belongs in the DB schema (Drizzle/Postgres) vs client-side UI state.

## Resolution

**Per-month snapshot (EveryDollar convention).** Each month owns its own full copy of groups/items. Copying to a new month deep-clones the structure with planned amounts reset to $0; drag-drop ordering and due dates carry over as part of the structure.

**Budget-status banner (EveryDollar logic).** Computed from planned vs planned only — sum of planned expenses minus sum of Income-group planned amounts. Expenses > income → "over budget" (excess shown); income > expenses → "left to budget". Transactions/received amounts never affect it.

**Default items.** The first-ever month is seeded with EveryDollar's default item sets per group (e.g., Transportation → Gas, Maintenance). Copy-forward then carries them like any other item.

**Schema split.**

Persisted (Postgres/Drizzle), keyed off a per-month snapshot:
- `month_budgets` — id, `budget_id` FK, month, year, note (one row per month)
- `category_groups` — id, `month_budget_id` FK, name, sortOrder
- `budget_categories` (items) — id, `group_id` FK, name, `due_date` (nullable), `planned` (numeric), sortOrder

Spent/Remaining are **derived** from transactions, never stored. A `transactions` table does not exist in the schema yet (only accounts) — it is required, but its full design (income events, assignments, spending) belongs to the YNAB funding model ticket.

Client-side only (transient UI state): group collapsed/expanded, per-group Spent↔Remaining toggle, Summary/Transactions view tab, panel tabs (new/tracked/deleted), search query. Drag-drop writes sortOrder (persisted); the action itself is UI.

**UI spec captured from the target JSON + session:** month header + month switcher; collapsible group cards (name top-left, chevron right of title); column headers Planned + Spent with per-group Spent↔Remaining dropdown, Income group showing "Received"; group "allocated" total under headers; item mini-cards with inline-editable planned, due-date display, add-item at group bottom, item deletion, drag-drop reorder within a group; transaction panel with new/tracked/deleted tabs, search, month-grouped transactions, load-more link; add-transaction FAB.
