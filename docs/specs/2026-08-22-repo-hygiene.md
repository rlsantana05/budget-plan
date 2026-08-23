# Spec: Repo Hygiene — Dead Code, Lint, and Stray Files

- **Status:** Proposed
- **Date:** 2026-08-22
- **Priority:** P2
- **Related:** Audit findings #8–#10

## Problem

1. **~31 pre-existing eslint errors** across `TransactionSearch.tsx` (missing
   EOF newline), `TransactionsPanel.tsx` (unused `onAssignAll`/`assignAllBusy`
   props), `status.test.ts` (`no-shadow`), `validate-budget.ts`
   (`comma-dangle`). `pnpm lint` cannot act as a gate.
2. **Stray/untracked files** committed or sitting in the tree:
   `.agent/plans/`, `.claude/knowledge/`, `CHANGES_SUMMARY.md`,
   `design-system.md`, `docs/options.md`, `validate-budget.ts` (untracked but
   present). Unclear what is intentional.
3. **Dead code**: `BudgetGroupAddItemForm` was deleted, but its store actions
   and the unused `Planning.module.css .loadingOverlay` remain; unused
   `onAssignAll` plumbing in TransactionsPanel.

## Plan

1. Commit or delete each stray file (decide with owner; default: delete
   scratch files, keep `design-system.md` + `docs/options.md` if wanted).
   Add `.agent/`, `.claude/` to `.gitignore`.
2. Fix all lint errors; make `pnpm lint` part of `pnpm run build` (or CI) gate.
   - Decide fate of `onAssignAll`/`assignAllBusy`: implement Assign-to-Targets
     wiring (per ADR-0002 §3) or remove the props.
3. Delete confirmed-dead exports; grep for importers first.
4. Add `validate-budget.ts` tests if it's kept (it's currently untracked and
   untested).

## Acceptance criteria

- [ ] `pnpm lint` exits 0.
- [ ] `git status` clean of stray files; gitignore covers tool dirs.
- [ ] No unused exported props/actions on touched components.
