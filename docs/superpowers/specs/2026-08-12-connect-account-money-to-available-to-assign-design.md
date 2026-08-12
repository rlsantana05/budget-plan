# Connect Account Money to "Available to Assign"

- **Status:** Approved
- **Date:** 2026-08-12
- **Related:** ADR-0001 (money-on-available)

## Problem

The planning screen computes "Available to Assign" as `received − funded` —
income transactions minus assigned money. The dashboard shows the raw sum of
account balances under the same label. The two numbers disagree, and neither
answers the real question: *how much money do I actually have in my accounts
that has not been given a purpose?* ADR-0001 defines the pool as "income received
− money already assigned" and explicitly says it is never an account balance;
this spec revises that definition to ground the pool in real account balances.

## Goal

One consistent, live "Available to Assign" number, driven by the money actually
in the user's liquid accounts, shown identically on the planning screen and the
dashboard. The budget screen's "Left to budget" hero (planned income − planned
expenses) is a distinct planned-status number and is out of scope.

## Formula

```
Available to Assign = Σ liquid account balances
                    − Σ category Available
                    − Σ credit-card activity
```

where:

- **Liquid accounts** = `CHECKING`, `SAVINGS`, `MONEY_MARKET`, `CASH`, `OTHER`
  (active, not soft-deleted). `CREDIT_CARD` and `INVESTMENT` are excluded.
- **Category Available** = rollup `assigned − activity` for expense categories
  (income categories contribute 0).
- **Credit-card activity** = the portion of a category's `activity` that came
  from a credit-card account; added back so card spending is neutral to the pool.

### Verified scenarios

| Event | Liquid balance | Assigned | Activity | Pool |
|---|---|---|---|---|
| Add account at $1,000 | 1000 | 0 | 0 | $1,000 |
| Assign $200 to Groceries | 1000 | 200 | 0 | $800 |
| Spend $50 from checking | 950 | 200 | 50 | $800 |
| Track $1,000 income | 1950 | 200 | 50 | $1,800 |
| Spend $50 on credit card | 950 | 200 | 100 | $800 |

### Month semantics

The pool is always computed against the **current (today's) month's** category
rollups with live account balances. It is the same number regardless of which
month the user is viewing — it answers "how much can I assign right now."
Assigning in the current month shrinks it; navigating months does not change it.

## Schema changes

One new column on `category_rollups`:

- `creditActivity` numeric(12,2) not null default `'0'`

Existing rows stay `0`; no data migration is required because credit-card
accounts cannot be created through the UI today.

`incrementRollup` gains a `creditActivity` delta parameter (default `0`).

## Server changes

### `src/actions/budget-planning.ts`

1. **`trackTransaction` / `deleteTransaction`:** look up the transaction's
   account type; when it is a credit card, bump/reverse `creditActivity`
   alongside the existing `activity`/`available` deltas. The card's own balance
   still receives its delta; cards simply never feed the pool.

2. **New helper `getAvailableToAssign()`** (replaces `getReadyToAssign`):
   ```
   liquidBalance − Σ available(current month rollups) − Σ creditActivity(current month rollups)
   ```
   Used both as the DTO value and as the assignment cap in `assignToCategory`,
   `setCategoryAssigned`, `assignToTargets` ("never assign more than exists").

3. **`getMonthBudgetPlan`:**
   - Extend the account query to select `type` and `balance`; sum liquid types
     only → `liquidBalance`.
   - Add `availableToAssign` to `MonthBudgetPlanDTO`. Requires one extra rollup
     query when the viewed month is not the current month (the pool is always
     the current month's live number).

4. **Income feeds the pool via balance.** `addPaycheck` and
   `receivePlannedIncome` currently insert a paycheck row but never touch
   `accounts.balance`, so under a balance-driven pool they would be invisible.
   Fix: both also `applyBalanceDelta(+amount)`. `paychecks` stays as the income
   record; it just no longer drives the pool math.

### `src/actions/accounts.ts`

5. **Dashboard unification:** `getAccountTotal()` currently sums all accounts
   and is labeled "Available to Assign". Change it to return the same
   `availableToAssign` value so dashboard and planning agree. The pool helper
   must be shared across the two action files (e.g. a small `pool.ts` module
   exported from `src/actions/` or `src/lib/`) so `getAccountTotal` and
   `getAvailableToAssign` stay in sync rather than duplicating the formula.

## DTO contract (`src/types/budget.ts`)

`MonthBudgetPlanDTO` gains top-level:

- `availableToAssign: number`
- `liquidBalance: number`
- `creditActivityTotal: number`

No per-item changes.

## Client changes (`src/features/planning`)

### Pool derivation

In `Planning.tsx`, replace the `received − funded` derivation with:

```
readyToAssign = liquidBalance − Σ(item.remaining) − creditActivityTotal
```

where `item.remaining` is the store's per-category `assigned − activity`
(= category Available) and `creditActivityTotal` comes from the DTO. Computed
reactively from the store so optimistic assignment updates keep working (assign
$200 → category remaining +200 → pool −200 instantly). The server value is the
authoritative fallback after `router.refresh()` reconciles.

**Month caveat:** the store holds the *viewed* month's categories, so the
reactive derivation above equals the server's live pool only when viewing the
current month. When the viewed month differs from the current month, display the
server-provided `initialData.availableToAssign` verbatim instead of deriving
from the store — preserving "same number regardless of month."

### Banner (approved option A)

Restructure `BudgetBanner` so the pool is the hero number and the planned-status
is secondary:

- **Hero:** "Available to Assign" — `formatMoney(pool)`, colored by sign (teal
  positive, red negative).
- **Secondary:** the existing planned label ("$240.00 left to budget" / "over
  budget") in a smaller size.
- `BudgetColumnHeader` remains the banner's child, unchanged.

### Existing consumers

`TransactionsPanel` (Assign-to-Targets button) and `CategoryHub` ("Assign $X")
keep their props; they receive the new pool value. No behavioral change.

## Dashboard

`DashboardClient` already renders the number; it receives the same
`availableToAssign` from the unified `getAccountTotal()`. Label unchanged.

## Edge cases

- No liquid accounts / $0 balance → pool can be negative; shows red; Assign
  buttons disabled when `pool <= 0` (existing behavior in `TransactionsPanel`).
- Account edited/deleted → `updateAccount` writes new balance, `deleteAccount`
  soft-hides (balance drops out of liquid total); both already revalidate
  `/planning`.
- Account type is the single source of truth for liquid-vs-not. The unused
  `isLiquid` column is not touched.
- Credit-card spending is neutral to the pool via `creditActivity`.

## Error handling

- Server cap preserved: `setCategoryAssigned` / `assignToTargets` reject with
  "Amount exceeds Available to Assign" when optimistic UI over-shoots; surfaced
  via the existing error banner in `TransactionsPanel`.
- Income actions still require an active account before applying a balance delta.

## Testing

No test framework is configured. Verification:

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build`
- Manual scenario: add checking at $1,000 → pool $1,000; assign $200 to
  Groceries → $800; track a $50 grocery expense → still $800; track $1,000
  income → $1,800; dashboard shows the same number.

## Out of scope

- Carryover between months (ADR-0001, deferred).
- Credit-card payment category flow.
- Per-month frozen pools / historical balance snapshots.
- Per-account liquid toggle in the account dialog.

## Consequences

- Every "Available to Assign" in the product now answers "how much real money
  is unassigned", grounded in account balances.
- Assigning now works immediately against real cash — no income transaction
  required first.
- ADR-0001's "never an account balance" wording is superseded for the pool
  definition; category `Available` (`assigned − activity`) is unchanged.
