## Objective
- Connect the actual money in user accounts with the "Available to Assign" number in the planning feature so users see how much real money is available to fund categories.

## Important Details
- **Constraints/Preferences**:
  - Pool = `income received − money already assigned` per ADR-0001, but must reflect actual account money, not just paycheck income
  - Must use **liquid accounts only** (checking, savings, money market, cash, other) for balance; exclude credit cards and investments
  - Pool must be **live** — show current balance regardless of selected month
  - Credit cards: **spending on card doesn't touch the pool**; pool calculation excluded credit card accounts
  - Maintain existing UI components and interaction flows
  - Must follow strict TypeScript config (`strict: true`)

- **Decisions**:
  - **Approach A (recommended):** Account-balance based — pool = sum(liquid account balances) − money already assigned
  - Month handling: "Always the live number" — pool is live/current regardless of month selected
  - Credit card handling: "Spending on card doesn't touch the pool" — transactions on credit card accounts excluded
  - Liquid accounts only for pool calculation; credit card/investment accounts excluded

- **Key Facts**:
  - Current planning pool = `received − funded` (paycheck-based)
  - Dashboard shows "Available to Assign" = raw account balance (disagrees with planning pool)
  - ADR-0001: "Available is the pool that exists to be given a purpose; it is never an account balance" — but user wants the account money connected
  - Credit cards not creatable in UI but exist in transactions
  - Planning screen `readyToAssign` = `received − funded`

## Work State
### Completed
- [x] Explore project context — files, docs, recent commits, AGENTS.md
- [x] Offer visual companion just-in-time
- [x] Ask clarifying questions one at a time
- [x] Propose 2-3 approaches with trade-offs
- [x] Present design in sections (schema, actions, types, UI)
- [x] Get user approval for Approach A

### Active
- [x] Design approved; ready for implementation

### Blocked
- (none)

## Next Move
1. Create implementation plan via `writing-plans` skill
2. Implement: schema → actions → types → UI

## Relevant Files
- `src/db/schema.ts` — Schema for accounts, transactions, credit_entries
- `src/actions/budget-planning.ts` — Core pool logic and funding
- `src/types/budget.ts` — DTOs: BudgetState, PlanningData, AvailableToAssignInfo
- `src/features/planning/Planning.tsx` — Client-side planning screen
- `src/features/planning/components/budget/BudgetBanner/BudgetBanner.tsx` — UI display
- `src/lib/pool.ts` — Shared helper functions (getAccountTotal, getAvailable)
- `src/app/_components/DashboardClient.tsx` — Dashboard unified metrics
- `PHILOSOPHY.md` — Legacy domain rules (summarized in AGENTS.md)
- `docs/superpowers/adr-0001-budgeting-principles.md` — Budgeting principles (referenced but not found)
