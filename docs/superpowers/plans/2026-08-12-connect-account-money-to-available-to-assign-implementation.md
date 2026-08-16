# Connect Account Money to Available to Assign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "Available to Assign" number in the planning feature reflect the actual money in user accounts (liquid accounts only), excluding credit cards and investments, while maintaining the YNAB-style TBB invariant (pool = income received − money already assigned).

**Architecture:**
- **Core Logic:** `src/actions/budget-planning.ts` - Calculate pool as sum of liquid account balances minus money already assigned
- **Schema:** `src/db/schema.ts` - Add fields to track account types (liquid vs. non-liquid) and credit card transaction handling
- **Types:** `src/types/budget.ts` - Extend DTOs to include account balance info and available-to-assign calculations
- **UI:** `src/features/planning/Planning.tsx` and `src/features/planning/components/budget/BudgetBanner/BudgetBanner.tsx` - Display correct available-to-assign value
- **Helpers:** `src/lib/pool.ts` - Add utility functions for getting account totals and calculating available funds
- **Dashboard:** `src/app/_components/DashboardClient.tsx` - Ensure consolidated view shows accurate pool

**Global Constraints:**
- Pool = sum of liquid account balances (checking, savings, money market, cash, other) − money already assigned
- Exclude credit cards and investment accounts from pool calculation
- Pool must be live (current balance) and consistent across months
- Credit card transactions do not affect the pool
- Follow strict TypeScript (`strict: true`)
- Maintain existing UI components and interactions

## Task 1: Update Schema for Account Balance Tracking

**Files:**
- Create/Modify: `src/db/schema.ts`

**Interfaces:**
- Consumes: None (schema definition)
- Produces: Updated account models with liquid/non-liquid classification

- [ ] Step 1: Identify existing account model in `src/db/schema.ts`
- [ ] Step 2: Add `accountType` enum (LIQUID, CREDIT_CARD, INVESTMENT, OTHER) to account model
- [ ] Step 3: Add `isLiquid` boolean field to indicate if account contributes to pool
- [ ] Step 4: Add `creditTransactionCount` counter for tracking credit card activity
- [ ] Step 5: Update migration script to add new columns

## Task 2: Update Pool Calculation Logic

**Files:**
- Modify: `src/actions/budget-planning.ts`

**Interfaces:**
- Consumes: `BudgetState`, `PlanningData` from `src/types/budget.ts`
- Produces: Updated `AvailableToAssignInfo` with correct pool calculation

- [ ] Step 1: Analyze current `calculatePool` function in `budget-planning.ts`
- [ ] Step 2: Replace pool calculation with liquid account balance sum minus `moneyAssigned`
- [ ] Step 3: Add helper function `getLiquidAccountBalance` in `lib/pool.ts`
- [ ] Step 4: Update `calculatePool` to use new helper
- [ ] Step 5: Add validation to ensure pool ≥ 0

## Task 3: Update Budget Types

**Files:**
- Modify: `src/types/budget.ts`

**Interfaces:**
- Consumes: Existing `BudgetState`, `PlanningData`
- Produces: Extended types with account balance information

- [ ] Step 1: Review current `BudgetState` and `PlanningData` types
- [ ] Step 2: Add `availableToAssign` field with proper type (number)
- [ ] Step 3: Add `accountBalances` array to track liquid account contributions
- [ ] Step 4: Add `creditCardTransactions` array to track card activity
- [ ] Step 5: Export updated types for consumption by other modules

## Task 4: Update UI Components

**Files:**
- Modify: `src/features/planning/Planning.tsx`
- Modify: `src/features/planning/components/budget/BudgetBanner/BudgetBanner.tsx`

**Interfaces:**
- Consumes: Updated `AvailableToAssignInfo` from types
- Produces: Correct display of available-to-assign amount

- [ ] Step 1: Update `Planning.tsx` to compute and display `availableToAssign` from new types
- [ ] Step 2: Update `BudgetBanner.tsx` to show accurate available-to-assign value
- [ ] Step 3: Add loading/error states for pool calculation
- [ ] Step 4: Ensure month selection doesn't affect pool value (always live number)

## Task 5: Update Shared Pool Helpers

**Files:**
- Modify: `src/lib/pool.ts`

**Interfaces:**
- Consumes: None (standalone utility module)
- Produces: Functions for account balance retrieval and pool calculations

- [ ] Step 1: Create `getLiquidAccountBalance` function that sums balances of liquid accounts only
- [ ] Step 2: Create `calculateAvailableToAssign` function using liquid balances minus assigned funds
- [ ] Step 3: Add `getCreditCardActivity` function to track card transactions separately
- [ ] Step 4: Export functions for use by actions and UI components

## Task 6: Update Dashboard Client (if needed)

**Files:**
- Modify: `src/app/_components/DashboardClient.tsx`

**Interfaces:**
- Consumes: Updated pool helpers and types
- Produces: Consolidated dashboard showing accurate available-to-assign

- [ ] Step 1: Review `DashboardClient.tsx` for pool display logic
- [ ] Step 2: Integrate new pool calculation to show live available-to-assign
- [ ] Step 3: Ensure consistency with Planning screen values

## Task 7: Testing and Verification

**Files:**
- Create: `tests/actions/budget-planning.test.ts`
- Create: `tests/utils/pool.test.ts`

**Interfaces:**
- Tests existing functionality with new pool calculation logic
- Verify edge cases (zero liquidity, negative balances, credit card transactions)

- [ ] Step 1: Write unit tests for `calculatePool` with various account configurations
- [ ] Step 2: Write integration tests for budget state transitions
- [ ] Step 3: Run existing test suite to ensure no regressions
- [ ] Step 4: Verify pool calculation handles credit card transactions correctly (should not affect pool)

## Execution Order
1. Task 1 (Schema) – foundation for data modeling
2. Task 2 (Actions) – core business logic
3. Task 3 (Types) – type definitions
4. Task 4 (UI) – display layer
5. Task 5 (Helpers) – shared utilities
6. Task 6 (Dashboard) – consolidated view
7. Task 7 (Tests) – verification

## Success Criteria
- `[ ]` Pool calculation correctly sums liquid account balances only
- `[ ]` Credit card transactions do not affect pool
- `[ ]` Available to Assign equals `sum(liquid balances) − moneyAssigned`
- `[ ]` UI displays correct available-to-assign value consistently
- `[ ]` All existing tests pass
- `[ ]` No regression in related functionality
