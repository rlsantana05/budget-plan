# Spec: Unify Income and Category Row Components

- **Status:** Proposed
- **Date:** 2026-08-22
- **Priority:** P1
- **Related:** Audit findings #5, #6, #7; user preference: UI/interaction consistency between similar components

## Problem

Income rows and Category rows implement the same interaction pattern twice:

| Concern | Income | Category |
|---|---|---|
| Component | `budget/Income.tsx` (`IncomeRow`, inline) | `BudgetGroupCard/BudgetGroupCardItem.tsx` (~370 lines) |
| Name editing | own `<input>` + blur/Enter/Escape logic | separate implementation, different edge cases |
| Amount editing | plan input | assigned input (different semantics, same mechanics) |
| Delete | own button flow | `deleteArmingId` two-step arm/confirm |
| Reorder wrapper | plain `Reorder.Item` in `Income.tsx` | `BudgetGroupReorderItem.tsx` |
| CSS modules | `Income.module.css` | `BudgetGroupCardItem.module.css` (near-duplicates) |

This duplication has already caused real bugs this month: the name-editing
duplicate-render bug, the income/category add-flow divergence, and the row-key
flicker had to be fixed in both places. Every future row feature must be
implemented twice — or worse, once, silently diverging the other.

Additionally, several interactive controls are `<span role="button">`
(`BudgetGroupHeader.tsx:100`, `BudgetGroupCardItem.tsx:197`) without keyboard
handlers — no Enter/Space activation.

## Decision

### 1. One shared row component

Create `src/features/planning/components/budget-group/BudgetRow/`:

```tsx
interface BudgetRowProps {
  item: GroupItem;
  isIncome: boolean;
  // callbacks injected by parent; identical shapes for both contexts
  onNameCommit(id: string, name: string): void;
  onAmountCommit(id: string, cents: number): void;
  onDelete(item: GroupItem): void;
  onReceive?(item: GroupItem): void;   // income only
}
```

- Internals: grip, editable name, one amount input, delete button.
- `isIncome` switches: amount label ("Planned" vs "Assigned"), received/
  remaining columns, receive button, color tokens if any.
- Keyboard contract for **all** text inputs: Enter commits, Escape reverts,
  blur commits-if-dirty (single implementation).

### 2. One reorder wrapper

`BudgetGroupReorderItem` stays but renders `BudgetRow`; `Income.tsx` uses it
too (passing `isIncome`). Kills the second `Reorder.Item` config.

### 3. Real buttons everywhere

Replace all `<span role="button">` with `<button type="button">`:
- `BudgetGroupHeader` add button
- `BudgetGroupCardItem` action buttons
- `AccountsClient.tsx:313`, `TypeCard.tsx:27` (accounts pages)

Restyle to strip default button chrome where the span look is desired.

### 4. Delete flow parity

Adopt the category two-step arm/confirm (`deleteArmingId`) for income rows too
— currently income deletes immediately, categories require a second click.

## Migration plan

1. Build `BudgetRow` from `BudgetGroupCardItem` (superset), keeping its tests green.
2. Switch category list to `BudgetRow` → visual regression pass.
3. Switch income list to `BudgetRow` with `isIncome` → parity pass:
   - [ ] name editing behaves identically (focus/select-on-new, Enter/Escape)
   - [ ] delete flow identical (two-step)
   - [ ] hover/focus states identical
4. Replace spans with buttons across the four files.
5. Delete `IncomeRow`, duplicate CSS; merge surviving styles into
   `BudgetRow.module.css`.

## Acceptance criteria

- [ ] Only one row component; `IncomeRow` deleted.
- [ ] All interactive controls are real `<button>`s; full keyboard operability (Tab order, Enter/Space, Escape).
- [ ] Manual matrix: create/rename/assign/delete/reorder × {income, category} behave identically except labeled columns.
- [ ] axe or manual a11y spot-check: no `role="button"` on non-button elements.
- [ ] Bundle diff shows net-negative LOC (target ≥ 300 lines removed).
