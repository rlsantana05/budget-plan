# Project Context: Personal Budgeting App

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **UI Library**: Mantine v9 (`@mantine/core`, `@mantine/hooks`)
- **Icons**: lucide-react
- **Font**: Geist (`next/font/google`)
- **Package Manager**: **pnpm** only (no npm/yarn/bun)

## Commands

| Action     | Command                                               |
| ---------- | ----------------------------------------------------- |
| Dev server | `pnpm dev`                                            |
| Build      | `pnpm build`                                          |
| Lint       | `pnpm lint` (ESLint 9)                                |
| Typecheck  | `pnpm exec tsc --noEmit` (no npm script—run manually) |
| Test       | Not configured yet                                    |

## Project Structure

- `src/app/` → Next.js App Router pages/layouts
- `@/*` → path alias for `./src/*`
- `public/` → static assets

## Stack Notes

- App Router with **default Server Components**. Client Components only when interactivity requires them.
- Strict TypeScript (`strict: true` in tsconfig).

## Domain Model (Must Preserve)

The app separates **planning** from **funding**:
Plan Month → Receive Income → Fund Categories → Spend Money → Weekly Review → Adjust Funding → Close Month

| Concept               | Rule                                                     |
| --------------------- | -------------------------------------------------------- |
| Planned               | Aspirational — may exceed available cash                 |
| Funded                | Real money assigned — never exceed Available to Allocate |
| Spent                 | Reduces Remaining (funded − spent)                       |
| Remaining             | Safe-to-spend amount                                     |
| Available to Allocate | Income received − money already funded                   |

**Critical Rules:**

- Account balances and budgeting are separate systems.
- Moving money between categories never changes total funded.
- Transactions reduce funded money; never modify planned budget.
- Weekly reviews are checkpoints, not budgeting periods.

## Ubiquitous Language

One vocabulary for UI, code, and requirements. Code identifiers appear in backticks.

> **Term bridge to the Domain Model:** "Assigned" = Funded, "Activity" = Spent/Received, "Available" = Remaining, "Available to Assign" = "Available to Allocate".

### Screen & layout

| Term | Code | Definition |
| ---- | ---- | ---------- |
| Planning screen | `/planning` | The budget page. |
| Budget table | `BudgetCategoryContainer` | The rounded card that holds the budget groups. |
| Toolbar / table head | `BudgetCategoryHeader` | Slim top bar with the "Add Group" button. |
| Column header | `BudgetColumnHeader` | The "Category / Assigned / Activity / Available" row. |
| Left column | `.leftCol` | The budget table column. |
| Transactions panel | `TransactionsPanel` | Right-hand panel for transactions. |

### Money concepts

| Term | Code | Definition |
| ---- | ---- | ---------- |
| Planned | `planned` | The amount budgeted for an item this month. Aspirational. |
| Assigned | `funded` | Real money moved into the category. |
| Activity | `spent` / `received` | Money that flowed out (spending) or in (income). |
| Available | `remaining` | Assigned minus activity. For income: received minus planned. |
| Available to Assign | `availableToAssign` | Unassigned money from connected accounts. |
| On budget / Over budget / Left to budget | banner `complete` / `over` / `in-progress` | Month status shown in the budget banner. |

### Entities

| Term | Code | Definition |
| ---- | ---- | ---------- |
| Group (category group) | `Group` | A section of the table, e.g. Housing, Debt. |
| Item (category) | `GroupItem` | A row inside a group, e.g. Gas. |
| Income group | `isIncome` | Group of income sources. |
| Spending group | `!isIncome` | Group of budget categories. |
| Target | `targetType` | Saving goal on an item: `NONE`, `ONCE`, or `MONTHLY`. |
| Needed | `needed` | Target amount minus assigned. |
| Transaction | `Transaction` | A record of money flow (payee, memo, account, amount). |

### State & interactions

| Term | Code | Definition |
| ---- | ---- | ---------- |
| Expanded / Closed | `expandedGroups` | Accordion state of a group. |
| Status chip | `.status` | Indicator shown when closed: "Empty" or the item count. |
| Empty group | `items.length === 0` | A group with zero items. |
| Add item | `beginAddItem` | Create a category row in a group. |
| Add group | `onAddGroup` | Create a new group (toolbar). |
| Reorder | `reorderCategoryItems` | Drag items to change their order. |
| Delete / Undo | `deleteCategoryItem` / `restoreCategoryItem` | Remove a row with a 5s undo window. |
| Available status | `AvailableStatus` | Row health: `unset`, `complete`, `at-risk`, `in-progress`. |
| Receive income | `receivePlannedIncome` | Mark planned income as received. |

## Existing Instruction Files

- `PHILOSOPHY.md` — legacy product philosophy doc (607 lines). Key domain rules are summarized above.
