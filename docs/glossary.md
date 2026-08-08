# Glossary

Terms are defined the way **this product** uses them. Decisions in ADR-0001..0003
have been folded in; anything marked "(deferred)" is recorded but not yet built.

## Money movement

- **Available to Assign** — income received minus money already Assigned. The most
  important number — the pool of dollars that have not yet been given a purpose.
  Not an account balance. (ADR-0001; formerly "Ready to Assign" / "Available to
  Allocate".)
- **Assigned** — real money moved into a category this month. Never exceeds
  Available to Assign.
- **Activity** — money spent from a category this month (rollup activity).
- **Available** — Assigned − Activity; the safe-to-spend number for a category.
  May be negative when overspent. (ADR-0001)
- **Received** — income that has arrived as real money this month (tracked income
  transactions and marked-received income).
- **Planned** — the aspirational monthly amount for a category or income item. May
  exceed cash on hand. Not real money. With no target set, it is what the category
  shows; with a target set, the target's note carries the plan. (ADR-0002)

## Targets (ADR-0002)

| Term | Meaning |
| ---- | ------- |
| Target | A reminder note on a category: "set aside $X by date". Optional; not a funding engine. |
| Target type: none | No target; category behaves as a plain planned amount. |
| Target type: once | Set aside amount by one specific date (absolute). |
| Target type: monthly | A bill-style rule that reappears each month, carrying amount + due day forward. |
| Needed / Underfunded | `target amount − assigned`, clamped ≥ 0. Rendered as "$50.00 needed by Aug 21". |
| Assign-to-Targets | One-click catch-up routing Available to Assign into underfunded targets (fund-all or chosen), never over the Available pool. |

## Category model (ADR-0002)

| Term | Meaning |
| ---- | ------- |
| Persistent category | The durable entity for e.g. "Groceries" that exists across months; each month holds its own assigned/activity/available state against it. |

## Transactions

| Term | Meaning |
| ---- | ------- |
| NEW | A transaction entered but not yet applied to the budget. |
| TRACKED | A transaction applied to the budget and account. |
| DELETED | A transaction that was hidden (soft delete). |
| Paycheck | A record of income marked as received; feeds the Available pool. |
| Cleared | Whether the bank has settled the transaction (unused in budget math). |

## Budget structure

| Term | Meaning |
| ---- | ------- |
| Category | The purpose of money (Rent, Groceries…) — a durable entity within a group. |
| Category Group | A named collection of categories (Food, Housing…). |
| Item | A concrete category row in a group (the UI's name for a category). |
| Rollup | Materialized per-category `assigned` / `available` / `activity` totals. |

## Deferred (not built)

- Carryover: rolling this month's leftover Available into next month (ADR-0001).
- The formal "what is safely spendable" rules behind Assign-to-Targets.
- Group-level column totals on the new Assigned/Activity/Available columns.