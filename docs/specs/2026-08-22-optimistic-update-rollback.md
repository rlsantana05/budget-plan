# Spec: Optimistic Update Rollback on API Failure

- **Status:** Proposed
- **Date:** 2026-08-22
- **Priority:** P0
- **Related:** Audit finding #1; ADR-0002; `usePlanningActionState.ts`; `budgetGroupsStore.ts`

## Problem

Row mutations (create / rename / assign / delete / reorder) apply an optimistic
change to the zustand store **before** the server call. When the server call
fails, `runTxAction` (`src/features/planning/hooks/usePlanningActionState.ts:15-30`)
catches the error, sets an error message, and calls `router.refresh()` — but
**never reverts the optimistic mutation**.

Consequences:

- A failed create leaves a phantom "New category" row until refresh completes.
- A failed delete makes a deleted row vanish, then pop back.
- A failed rename/assign shows wrong values.
- If `router.refresh()` itself fails or is slow, the UI lies indefinitely.
- The error banner appears but rows are visibly wrong, which reads as data loss.

## Current flow

```
store action: set(optimistic change)
            └→ runTxAction('row', async () => { await api(...); set(reconcile) })
                 ├─ success: reconcile with created row
                 └─ failure: setError + router.refresh()   ← no revert!
```

## Proposed design

### Option chosen: inverse-action rollback registered by each store action

Each mutating store action registers an undo function alongside its optimistic
set. `runTxAction` invokes it on failure.

1. Extend the action context passed to store actions:

   ```ts
   // budgetGroupsStore.ts
   type TxRollback = () => void;
   interface TxContext {
     registerRollback: (fn: TxRollback) => void;
   }
   ```

   Simplest wiring: module-level variable in the store file,
   `let currentRollback: TxRollback | null`, set at the start of each
   `runTxAction('row', ...)` via a new store field `beginTx()`. Store actions
   read it when they mutate.

2. Per-action rollbacks:

   | Action | Optimistic set | Rollback |
   |---|---|---|
   | `addCategoryRow` / `addIncomeSource` | push temp row | remove row by `clientId` |
   | `handleUpdateItem` | `{name, planned}` | restore previous name/planned for that item |
   | `handleAssignAmount` | funded/remaining/needed | restore prior funded/remaining/needed |
   | `handleDeleteItem` | filter out item | re-insert item at saved index (reuse `undo.item`/`undo.index` snapshot already captured) |
   | `handleReorderItems` + commit | reorder array | restore previous order |

3. In `runTxAction` failure branch:
   ```ts
   catch (e) {
     get().rollbackTx();      // runs currentRollback if present
     setError(...);
     ...
   }
   ```

4. `router.refresh()` stays as the final reconciliation on failure — after
   rollback the refresh is a correction, not the only fix.

## Constraints

- No rollback for actions whose API call already succeeded — only the failing one.
- Rollback must be synchronous and local (no network).
- Rapid successive actions while busy are blocked by the existing
  `busy !== null` guards; keep that invariant.
- Do not touch money semantics in this spec (cents refactor is separate).

## Acceptance criteria

- [ ] Simulated API failure during create → row disappears, error shown.
- [ ] Simulated failure during delete → row returns to original position.
- [ ] Simulated failure during assign → previous amount restored.
- [ ] Success paths unchanged; all existing tests pass.
- [ ] Unit test: store rollback functions restore exact prior state (snapshot before/after).

## Test plan

- Add `budgetGroupsStore.test.ts` with a mocked `runTxAction` that rejects;
  assert state equality pre/post for each action type.
