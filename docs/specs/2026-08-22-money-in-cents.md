# Spec: Money in Integer Cents

- **Status:** Proposed
- **Date:** 2026-08-22
- **Priority:** P0 (do before further money features)
- **Related:** Audit finding #2; ADR-0001 (money semantics); glossary "Money movement"

## Problem

All money math uses JS floats:

- `src/actions/budget-planning.ts:495` — `receivedByCategory` sums `Number(tx.amount)`.
- `src/actions/budget-planning.ts:512-515` — `funded`, `spent`, `remaining` computed with float arithmetic.
- `src/features/planning/utils/formatters.ts` — `parseAmountText` returns `Number(text)`; `handleAssignAmount` does `amount - item.funded` with floats.
- Client totals in `BudgetGroupCard.tsx:104-115` reduce floats.

Classic drift: `0.1 + 0.2 = 0.30000000000000004`. Today this is masked by
`toLocaleString` rounding at display time, but:

- `remaining = funded - spent` can show `-0.00`-style artifacts,
- `Math.abs(delta) < 0.005` guards in `handleAssignAmount` behave unpredictably,
- server-side totals (`availableToAssign`) can disagree with client sums by a cent.

## Decision

Represent all money as **integer cents** end to end.

1. **Database** — verify column types in `family-planner-schema.prisma`:
   amounts are already `Decimal(…)` at the DB boundary; server actions must
   convert with `Prisma.Decimal` or `Math.round(x * 100)` at read/write edges.
   No schema change required if columns are decimal — only arithmetic hygiene.

2. **DTO boundary (`src/types/budget.ts` + server actions)**
   - All monetary DTO fields become integer cents: `plannedCents`, `fundedCents`,
     `spentCents`, `receivedCents`, `remainingCents`, `amountCents`, etc.
   - Conversion helpers in `src/features/planning/utils/money.ts`:
     ```ts
     export const toCents = (d: Decimal | number | string): number =>
       Math.round(Number(d) * 100);
     export const fromCents = (c: number): number => c / 100; // display only
     ```

3. **Client store & components**
   - `GroupItem` fields switch to `*Cents` names (compile-time catches every
     arithmetic site).
   - All sums/reductions/guards become integer math:
     `const delta = amountCents - item.fundedCents; if (delta === 0) return;`
   - `parseAmountText` returns cents: `'12.34' → 1234` (rename to
     `parseAmountToCents`; keep old export as deprecated wrapper during migration).
   - `formatMoney` accepts cents: `formatMoney(1234)` → `$12.34`.

4. **Input UX** — unchanged: users type decimal strings; `sanitizeAmountText`
   still enforces `^\d{0,9}(\.\d{0,2})?$`; conversion to cents happens once at
   commit time.

## Migration plan (single PR, compile-error-driven)

1. Add `money.ts` helpers + tests (property tests: `toCents(fromCents(c)) === c`
   for all cent values; no float ops anywhere).
2. Rename DTO fields to `*Cents`; fix compile errors in server actions.
3. Rename `GroupItem` fields; fix compile errors through store → components.
4. Update `formatMoney`/`parseAmountText` and their tests.
5. Delete deprecated wrappers; grep for `Number(` on money fields as a guardrail.

## Risks

- Any missed conversion shows amounts 100× off — the compile-error-driven
  rename makes this unlikely; the 100× smoke test on the planning screen
  catches the rest.
- Prisma `Decimal` → cents rounding: use `Math.round`, never `parseInt`.

## Acceptance criteria

- [ ] `grep -rn "Number(.*(amount|planned|funded|spent|received|remaining|assigned)" src/` returns no float-money arithmetic.
- [ ] All money fields end in `Cents` and are integers.
- [ ] Existing UI behavior identical (manual pass on planning screen: totals, assign, receive, banner).
- [ ] `pnpm test` green including new `money.test.ts` property tests.
