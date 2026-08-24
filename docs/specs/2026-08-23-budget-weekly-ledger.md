# Spec: Budget Screen — Weekly Review Ledger (Friday Check-in)

- **Status:** Proposed
- **Date:** 2026-08-23
- **Priority:** Feature (next major)
- **Supersedes (UI only):** `2026-08-22-budget-envelope-screen.md` — the envelope
  engine (Phase 1 shipped) stays; this spec replaces its screen layout.
- **Related:** ADR-0001/0002, `assignmentLedger` + `categoryRollups`,
  `addPaycheck`, unified row component, Planning screen (forecast layer)

## The ritual (from Leonardo's family workflow)

> "We personally review the budget every Friday. Planning is the forecast;
> the weekly review is about what needs taking care of before we get paid.
> Even paid every two weeks, if we don't check weekly, everything derails."

So the Budget screen is a **weekly check-in tool**, not a monthly envelope wall:

1. Every Friday (or whenever), open Budget.
2. See the month as a list of weeks; the current week is highlighted.
3. Open this week → a **mini Planning view** scoped to the week: what income
   lands before next Friday, what bills come due, what we'll spend.
4. Assign money for exactly that window. Next week, repeat.
5. Overspent last week? Adjust between weeks — **roll with the punches**.

Planning answers "what does the *month* look like?" (forecast).
Budget-weekly answers "**what do I need to handle before the next paycheck?**"

## Core model

### Weeks are calendar Fridays, not paychecks

Weeks run **Saturday → Friday** (review happens ON Friday, covering through
it). Derived from the month — no new table:

```
weekStart = Saturday
weekEnd   = following Friday
A month yields 4–5 weeks; partial edge weeks clip to the month boundary.
```

Paycheck anchoring was considered and rejected: reviews are calendar-driven,
and biweekly paychecks drift across weeks. A paycheck landing mid-week is
just income visible in that week's workspace.

### Week states

| State | Meaning | Workspace shows |
|---|---|---|
| `unplanned` | No assignments tagged to this week | Empty-state card + "Plan this week" CTA |
| `planned` | ≥1 assignment tagged this week | Mini-Planning workspace |
| `past` (derived from dates) | Before today | Dimmed rows; can still be opened |
| `current` (derived) | Contains today | Highlighted rail row + torn-stub notch |

State is **computed**, never stored: `planned` = ∃ ledger row with
`createdAt` (or explicit `weekKey`) inside the week window.

### Week scoping of money — additive tagging, not partitioning

The monthly pool and envelopes stay authoritative (MoneyStrip, RTA,
Assigned, Available — all kept as-is). A week adds a **view** over them:

- Each `assignmentLedger` write made from a week workspace gets a
  **nullable `weekKey`** column (`'2026-04-10'`, the week's start date).
  Null = assigned at month level (existing flows unchanged).
- Week plan totals = Σ ledger rows where `weekKey = week`.
- Envelope Available still comes from `categoryRollups` (month-wide);
  the week workspace shows **this week's slice**: planned vs. spent-so-far
  within the window.
- Roll-with-the-punches = assign more to an envelope from any week, or use
  the existing cover-overspend move — both just write more ledger rows
  (tagged with whichever week you're in).

Schema change: one nullable `text week_key` column on `assignmentLedger`
+ index. No backfill needed (nulls read as month-level).

## Screen layout (per mockup)

```
┌──────────────────────────────────────────────────────────┐
│  WEEKLY LEDGER                                           │
│  April 2026                                              │
│  ┌──────────────┐  ┌────────────────────────────────┐    │
│  │ Mar 28–Apr 3 │  │                                │    │
│  │ Past         │  │   [planned: mini-Planning]     │    │
│  │ Apr 4–Apr 10 │  │   [unplanned: empty state      │    │
│  │ Current ◀    │  │    + "Plan this week" CTA]     │    │
│  │ Apr 11–17    │  │                                │    │
│  │ Future       │  │                                │    │
│  │ ...          │  │                                │    │
│  └──────────────┘  └────────────────────────────────┘    │
│  ‹ Prev March 2026      • • ———       May 2026 Next ›     │
│              MoneyStrip (Cash · RTA · Assigned)           │
└──────────────────────────────────────────────────────────┘
```

- **Left rail** (`weeks` nav): date range (serif), tag (mono caps:
  Past/Current/Future), status pill (dot = orange when unplanned, green
  planned). Current week: accent gradient + notch. Click selects.
- **Workspace panel**:
  - *Unplanned*: icon card, kicker `Apr 11 – Apr 17 · Current week`,
    copy varies by tag (Past: log what happened / Current: plan before
    payday / Future: plan ahead), CTA button.
  - *Planned*: mini-Planning (see below).
- **Footer**: prev/next month nav with labels + archive dots (kept from
  mockup); MoneyStrip stays above or below per visual weight.
- Typography: Fraunces (serif headings/dates), Inter (body),
  IBM Plex Mono (tags/status) — matches the mockup; add via next/font.

## Planned workspace (mini-Planning)

Reuses existing components pointed at week-scoped data:

```
This week (Apr 11 – Apr 17)                    [Close week ✓]
Income expected            $2,000.00   ← paychecks/income txs in window
Bills & spending planned   $1,450.00   ← Σ week-tagged assignments
Left for this week         $550.00

CATEGORIES (rows = unified BudgetGroupCardItem)
Giving        planned $100   spent $0     ✓
Groceries     planned $250   spent $180   ⚠ $70 left
Electricity   planned $0     spent $140   ⚠ overspent — Cover?
```

Behaviors:
- **Plan this week**: opens the category list with inline editable
  week-planned amounts (writes ASSIGN rows tagged with weekKey).
- **Spent** = tracked transactions within the window per category.
- **Cover overspend**: same paired MOVE_OUT/MOVE_IN flow, tagged current week.
- **Close week** (Phase 2): marks review done, offers "roll leftover into
  next week" (writes next-week tagged assignments) — the punch-rolling act.
- Income expected: income transactions dated in window (Starting Balance,
  paychecks). If none: "No income expected this week."

## Server actions & data

New/changed (all zod-validated, integer cents):

- `getMonthWeeks(year, month)` → `{ weeks: [{ key, start, end, tag,
  plannedCents, spentCents, state }] }` (pure computation; no writes).
- `getWeekDetail(weekKey)` → income/planned/spent per category in window.
- `assignToCategory(categoryId, amountCents, weekKey?)` — extend signature;
  writes `week_key` on the ledger row.
- `moveBetweenCategories(...)` gains optional `weekKey` likewise.
- Schema migration: `ALTER TABLE assignment_ledger ADD COLUMN week_key text`.

Unchanged: MoneyStrip numbers, rollups, RTA math, Planning screen.

## Phases

### Phase A — Ledger shell (MVP, the mockup)
1. Fonts (Fraunces/IBM Plex Mono via next/font) + theme tokens.
2. Week derivation util + `getMonthWeeks`.
3. New Budget layout: month header, week rail, workspace empty state,
   prev/next month footer. Selection purely client-side.
4. Acceptance: clicking weeks swaps workspace copy/state; current week
   auto-selected on load; month nav works.

### Phase B — Plan a week
5. `week_key` migration + extended assign/move signatures.
6. Planned workspace: income/planned/left summary + category rows with
   inline week-planned editing (reuse unified row).
7. Spent tracking within window; overspend warning + cover action.

### Phase C — Close the loop
8. "Close week" + leftover rollover nudge.
9. Unplanned-past-week note ("log what happened").
10. Paycheck inbox nudge inside current week ("$X lands Friday — plan it").

## Acceptance criteria

### Phase A
- [ ] `/budget` renders week rail for any month; correct Sat→Fri windows,
      clipping at month edges; current week auto-selected.
- [ ] Unplanned weeks show empty state with tag-appropriate copy + CTA.
- [ ] Prev/next month navigation regenerates rail; archive dots update.
- [ ] Existing MoneyStrip/envelope data untouched.

### Phase B
- [ ] "Plan this week" → assign $50 to Groceries from week workspace →
      ledger row has `week_key`; month Assigned/RTA update identically to
      assigning from month view (single source of truth preserved).
- [ ] Week detail shows spent = Σ tracked txs in window; overspent row
      offers cover; cover writes both rows tagged current week.
- [ ] Month-level assigns (no weekKey) still work everywhere.

### Phase C
- [ ] Closing a week with leftover offers rollover into next week; accepting
      creates next-week-tagged assignments equal to leftover.
- [ ] All numbers agree: week planned Σ ≤ month Assigned; strip ↔ rollups
      consistent after every action.

## Out of scope
- Bank sync/import; credit-card payment envelopes (see prior spec).
- Push notifications/reminders for Friday review (later nice-to-have).
