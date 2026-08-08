# ADR-0001: Money-on-available — Assigned/Activity/Available and the Target note

- **Status:** Accepted
- **Date:** 2026-08-08

## Context

The early product computed category "Remaining" as `funded - spent`, which produced
confusing negative values on categories that had a plan but no assigned money yet
(plan $200, spent $25, no funding → –$25). An interview question ("I budgeted 200,
so spending 25 should leave 175") exposed two latent, competing meanings:

- *(a)* "Remaining" = plan progress → `planned - spent` (aspirational).
- *(b)* "Remaining" = safe-to-spend cash → `funded - spent` (real money).

Resolving this forks every number shown on a category row, the `/budget` screen, and
the status banner. We also had two labels for the same pool — "Ready to Assign"
(`/budget` screen) and "Available to Allocate" (older docs).

## Decision

- The **real-money layer is money that actually entered an account**.
  `Available to Assign = income received − money already assigned (funded)`.
  Available is the pool that exists to be given a purpose; it is never an account
  balance.
- **Spending draws only on assigned money.** The columns on every *non-income*
  category are:
    | Column | Definition |
    | ------ | ---------- |
    | Assigned | money moved into the category this month (formerly "funded") |
    | Activity | spending out of the category this month (formerly "spent") |
    | Available | Assigned − Activity (formerly "Remaining"); the safe-to-spend number |
  - Available may be negative (overspent, shown in danger color).
- **Income rows opt out** of the triad and show only `Planned | Received`. Income is
  not "Assigned/Spent/Available" money; it feeds the Available pool instead.
- A **Target is a reminder note, not a funding engine**: "set aside $X by date".
  It answers the minimal question "how much do I still need to put in". Categories
  may run entirely without a target, in which case they keep the simple planned
  amount.
- **Carryover is deferred.** A true YNAB-style `Available` rolls the previous
  month's leftovers into the current month. Our `Available` resets each month
  (`assigned − activity`). Carryover is a later ADR and is tightly coupled to the
  deferred "what is safely spendable" refinement. We deliberately do not pretend to
  support it yet.
- **Naming:** the money pool is standardized as **"Available to Assign"**
  everywhere (replacing "Ready to Assign" and "Available to Allocate").

## Consequences

- **+** Every number on a category row means the same thing everywhere
  (`Assigned | Activity | Available`), uniting the planning panel and the `/budget`
  screen.
- **+** No mouse. Spendable money is grounded in funds that actually entered
  accounts, so the product's core promise ("work only with money we have") holds.
- **−** A planned-but-unassigned category legitimately shows negative Available until
  money is assigned; the Target note (ADR-0002) is the mitigation.
- **−** No carryover means money left in a category disappears conceptually at month
  close; acceptable until the safe-to-spend refinement ADR.

## Supersedes

None.