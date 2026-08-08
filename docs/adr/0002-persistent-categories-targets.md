# ADR-0002: Persistent categories, Targets, and Assign-to-Targets

- **Status:** Accepted
- **Date:** 2026-08-08

## Context

Today a category is a per-month row (`budget_categories.group_id →
category_groups.month_budget_id`). The same mental "Groceries" exists as a different
row each month, so:

- a **target** (a monthly rule) cannot live on the category once and apply every
  month,
- an information hub cannot show a category's history across 3 months without
  name-matching rows,
- planned/funded/spent semantics are re-provisioned every month.

The product is committing to a YNAB-style model where the category is a durable
identity and each month carries its own money state. We also need to *targets*:
a note "needed $X by date" with defined recurrence, and the one-click catch-up action.

## Decision

1. **Categories become persistent identities.** A durable category owns its
   position/name/target rule; per-month budget state (planned, assigned, activity,
   available) lives against that identity and the month budget. This is a migration
   from the current per-month copies.

2. **Target** on a category, optional:
   - `type`: `none` (no target — behave as a plain planned amount),
     `once` (set aside `amount` by a specific `date`),
     `monthly` (reappears every month, carrying amount and due-day forward).
   - Fields: `targetType`, `targetAmount`, `targetDate`.
   - The row renders the shortfall note: `"$50.00 needed by Aug 21"`. For `once`,
     the date is absolute; for `monthly` the note uses the current month's
     due date.

3. **Assign-to-Targets** — a one-click catch-up action, exact YNAB replica:
   - Computes each category's shortfall = `target − assigned` (≥ 0) toward
     targets for the active month.
   - Routes `Available to Assign` into underfunded targets (fund-all, or a
     user-chosen subset), in order.
   - Never funds more than Available; any amounts beyond Available remain
     unfilled. Total assigned never exceeds the pool.

4. Deferred (recorded, not built): Available carryover across months, and the
   formal "what is safely spendable" rules the catch-up should honor later.

## Consequences

- **+** Targets and history become natural: one row per durable category, per-month
  timestamps.
- **+** Assign-to-Targets gives the "work only with money we have" payoff: Available
  flows to underfunded targets in one click, without violating the money-on-hand
  rule.
- **−** The persistent-category migration is the riskiest change so far: every
  existing monthly snapshot (rollups, paychecks, transactions, assignment ledger)
  must re-key to durable category ids without dropping history. Mitigated by doing it
  as a dedicated Phase-1 migration with backfill.
- **−** Two target types add surface area to the row UI and the data model.

## Supersedes

None. Complements ADR-0001 (money-on-available).