# Spec: Fix Failing Test Suite

- **Status:** Proposed
- **Date:** 2026-08-22
- **Priority:** P0
- **Related:** Audit findings #3; ADR-0002 (targets)

## Problem

`pnpm test` fails with 3 failures out of 27 tests. A red suite masks real
regressions and blocks any confidence in future refactors (notably the
money-in-cents refactor, which needs a green baseline first).

| Test | File | Cause |
|------|------|-------|
| `disables add group button when no accounts` | `src/features/planning/components/budget-group/BudgetCategoryHeader/BudgetCategoryHeader.test.tsx:28` | The "Add Group" button is now hidden via `showAddButton={false}` (commit `2e6fc48`). The test still expects it to render disabled. |
| `handles end of month edge case for MONTHLY target` | `src/features/planning/utils/status.test.ts:130` | `resolveTargetDueDate` mishandles months with fewer days than the target due-day (e.g. day 31 in a 30-day month). Also has a `no-shadow` lint error (`now` redeclared). |
| `converts NaN to 0` | `src/features/planning/utils/formatters.test.ts` | `parseAmountText('NaN')` returns `NaN`, not `0`. |

## Scope

1. **BudgetCategoryHeader.test.tsx** — Update to the new prop contract:
   - When `showAddButton={false}`: assert no add button renders.
   - When `showAddButton` omitted/true + `hasAccounts=false`: assert button renders **and** is disabled.
   - Add a case: `showAddButton=true, hasAccounts=true` → button enabled.

2. **formatters.ts — `parseAmountText`**: return `0` for non-numeric input:
   ```ts
   const n = Number(value);
   return value === '' || Number.isNaN(n) ? 0 : n;
   ```
   Existing passing tests must stay green.

3. **status.ts — `resolveTargetDueDate`** for MONTHLY targets: clamp the
   due-day to the month's last day (day 31 in April → Apr 30). Rename the
   shadowed `now` variable in the test file to satisfy lint.

## Out of scope

- Any behavior change to target rendering or add-button UX.
- New test coverage beyond the three fixes (tracked separately).

## Acceptance criteria

- [ ] `pnpm test` exits 0 — all 27+ tests pass.
- [ ] `pnpm run build` passes.
- [ ] No new eslint errors introduced.
