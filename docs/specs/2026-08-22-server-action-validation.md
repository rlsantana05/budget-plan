# Spec: Server Action Input Validation

- **Status:** Proposed
- **Date:** 2026-08-22
- **Priority:** P0
- **Related:** Audit finding #4; `src/actions/budget-planning.ts`

## Problem

Server actions in `src/actions/budget-planning.ts` trust client payloads:
ids, names, amounts, and month keys are used without validation. Any client
bug (or crafted request) can write garbage: negative/NaN/huge amounts,
over-long names, malformed ids, out-of-range months.

## Decision

Validate every action's input at the boundary with **zod** (already idiomatic
in Next.js ecosystems; add dependency if absent).

### Schemas (one per action)

```ts
const idSchema  = z.string().cuid();               // match Prisma id format
const amountSchema = z.number().int().min(0).max(100_000_000); // cents, post cents-refactor
// until then: z.number().finite().min(0).max(1_000_000_000)

addCategoryItemSchema   = z.object({ groupId: idSchema, name: z.string().trim().min(1).max(80), planned: amountSchema });
updateCategoryItemSchema= z.object({ itemId: idSchema, name: ..., planned: ... });
setCategoryAssignedSchema = z.object({ itemId: idSchema, amount: amountSchema });
deleteCategoryItemSchema  = z.object({ itemId: idSchema });
reorderCategoryItemsSchema= z.object({ groupId: idSchema, orderedIds: z.array(idSchema).max(200) });
receivePlannedIncomeSchema= z.object({ itemId: idSchema });
monthSchema             = z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12) });
```

### Wrapper

```ts
function withValidation<T>(schema: ZodSchema<T>, fn: (input: T) => Promise<...>) { ... }
```
On failure: throw a typed error the client already surfaces via
`usePlanningActionState`'s catch → `setError`. No silent swallowing.

### Rules

- Names: trim, strip control chars, max 80 chars.
- Amounts: non-negative, finite; assigned may not exceed Available to Assign
  **only as a UI concern** — server enforces ≥ 0 and finite (ADR-0001 semantics
  stay client-enforced for now).
- Month keys validated before any query.
- Reorder lists must reference ids belonging to the group (verify in one query).

## Acceptance criteria

- [ ] Every exported action parses input through a schema.
- [ ] Unit tests: each action rejects malformed payloads (negative, NaN, wrong types, oversized).
- [ ] Valid flows unchanged end to end.
