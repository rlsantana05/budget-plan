---
labels:
  - wayfinder:grilling
status: closed
---

# Planning ↔ Budgeting relationship

## Question

The keystone decision for the whole map.

1. **Category tree.** Planning ships an EveryDollar-style tree (Income, Giving, Housing, Savings, Transportation, …) while Budgeting ships a YNAB-style tree (Bills, Needs, Wants, …). Do the two screens share one category tree (same groups/items, per-screen columns) or keep separate structures? If shared, which default groups win? If separate, how do they stay consistent?
2. **Same month.** Do both screens operate on the same budget month, or separate monthly cycles?
3. **Surplus concepts.** EveryDollar's over-budget (Planned income vs total planned) and YNAB's Ready to Assign (income received vs funded) are two different balances. How do they coexist under the Planned-vs-Funded separation?
4. **Confirm locked facts.** Due dates are Planning-only; Budgeting's target due-description derives from the Planning item's `dueDate`. Month transition carries over only categories + residual/unassigned money — planned amounts reset.

## Resolution

**One shared category tree.** Planning and Budgeting render the same groups/items with the same column naming — **Planned / Spent / Remaining** (not Assigned / Activity / Available). Default groups are the EveryDollar set (Income, Giving, Housing, Savings, Transportation, Food, Personal, Lifestyle, Health, Insurance, Debt + custom).

**Two horizons over the same categories:**

- **Planning = month horizon, aspirational.** Records planned vs received. Over-budget banner = planned income vs total planned (may exceed cash).
- **Budgeting = paycheck horizon, envelope-style.** Concerned only with the current paycheck. **Ready to Assign = this check's amount** — a per-check pool that resets each payday. Rule: assign until Ready to Assign hits $0.00. Unspent money stays in each category's **Remaining** (rolls forward); unassigned money never lingers because the assign-until-zero rule clears each pool.

**Surplus concepts coexist** as two balances on two horizons: Planning's over-budget (aspirational, planned vs received) and Budgeting's Ready to Assign (real money, per-check envelope pool). They are never the same number.

**Paycheck is a first-class concept:** an income event that seeds a per-check Ready to Assign pool.

**Confirmed:** due dates are Planning-only (Budgeting's target due-description derives from the Planning item's `dueDate`); month transition copies only the category structure + residual (category Remaining) + any unassigned money — planned amounts reset.
