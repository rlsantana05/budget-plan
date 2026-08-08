# ADR-0003: Context-sensitive right panel — the category hub

- **Status:** Accepted
- **Date:** 2026-08-08

## Context

The planning screen's right panel is a *global* transactions list with a
Summary/Transactions tab toggle, driven by all of the month's transactions. There is
no concept of a selected category in `Planning.tsx` today. Users want to inspect one
category — its numbers, the transactions, and its spending trend — without hunting
through the global list.

## Decision

1. Add a **selection state** `selectedCategoryId: string | null` to the planning
   screen. The default `null` keeps the current global Summary/Transactions view.
2. Tapping/clicking a *non-income* category row sets `selectedCategoryId` and flips
   the right panel into a **category hub** for that category:
   - header: target / planned amount, Assigned, Activity, Available
   - the category's transactions this month (filtered)
   - a 3-month spending trend for the category (from the durable-category history
     of ADR-0002)
   - target note rendering "needs $X by date" where applicable.
3. A prominent **"All"** chip/button in the hub header returns the panel to the
   global view (sets `selectedCategoryId` back to `null`).
4. Income rows do not open a hub (they have no Assigned/Activity/Available triad).

## Consequences

- **+** The panel becomes context-sensitive without adding screens; the left
  category list and right details stay visually anchored.
- **+** Selection is ordinary React state — cheap to reset on month navigation.
- **−** Two sources of content in one panel (global vs hub) adds a small tax on the
  panel's header/back UX.

## Supersedes

None.