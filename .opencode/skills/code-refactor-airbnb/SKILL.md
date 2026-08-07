---
name: code-refactor-airbnb
description: Refactor JavaScript/TypeScript/React/Next.js code toward Airbnb-style industry best practices, combining automated ESLint+Airbnb mechanical fixes with a structural code review (hook stability, memoization, component decomposition, ref-vs-state patterns, duplication) — auto-applying low-risk changes and flagging larger structural changes for confirmation before applying. Use this skill whenever the user asks to "refactor," "clean up," "make this more industry standard," "apply best practices," "make this look professional," or asks about the Airbnb style guide / ESLint conventions for their code — even if they don't name ESLint or Airbnb explicitly. Also trigger when a user is unhappy with code verbosity, messiness, or consistency and wants it improved. Operates at folder/feature scope, not single-line edits.
---

# Code Refactor: Airbnb Style + Structural Review

Two-track refactor, kept deliberately separate so the user always knows what changed automatically vs. what's waiting on their judgment:

1. **Mechanical track** — ESLint + Airbnb config, auto-applied. Deterministic, style-only, no behavior risk.
2. **Structural track** — hook stability, memoization, component splits, ref-vs-state architecture. Low-risk items auto-applied; anything that changes behavior, timing, or contracts is flagged and held for the user's decision.

Never blur these two into one undifferentiated "refactor applied" — the user needs to trust that anything auto-applied genuinely couldn't have broken something.

## Scope

Default to a **feature folder** (e.g. `features/planning/`), not a whole-repo sweep. If the user names a single file, still run the full workflow but keep findings scoped to that file and its direct siblings/hooks. Never silently expand scope beyond what was asked — if a structural finding depends on a file outside scope, note the dependency in the report rather than pulling that file in unasked.

## Step 1 — Confirm/set up Airbnb ESLint config

Check `package.json` devDependencies for `eslint-config-airbnb`, `eslint-config-airbnb-typescript`. If missing:

- Tell the user it's missing before doing anything else.
- Offer to install (for a Next.js + React + TypeScript stack):

```bash
pnpm add -D eslint-config-airbnb eslint-config-airbnb-typescript eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

- Confirm the `extends` array includes `airbnb`, `airbnb-typescript`, and `airbnb/hooks` (React Hooks rules live in the separate `airbnb/hooks` config, easy to miss).
- This is a one-time, project-wide config change — always confirm with the user before editing their ESLint config file, even though later per-run mechanical fixes don't need confirmation.

If no ESLint config exists at all, stop and ask before creating one from scratch — that's a project decision, not something to infer silently.

## Step 2 — Mechanical pass (auto-apply, no confirmation needed)

```bash
pnpm eslint <scope> --fix
```

`--fix` only touches what ESLint can deterministically resolve on its own — quotes, spacing, import order, semicolons, arrow-function parens, trailing commas, and similar. That's the actual low-risk boundary; don't try to manually extend it by hand-applying additional "obviously safe" style changes ESLint itself declined to auto-fix — if ESLint didn't fix it, treat it as needing a human look, not as an oversight to patch around.

After `--fix`, run once more without `--fix` and capture what's left:

```bash
pnpm eslint <scope>
```

Carry every remaining warning/error into the Step 4 report with rule name and `file:line` — don't silently drop rules ESLint flagged but couldn't auto-resolve.

## Step 3 — Structural review pass

Read every file in scope fresh each session — treat `references/structural-checklist.md` as the checklist to re-apply now, not something to recall from memory, since these are judgment calls that depend on the actual code in front of you.

Classify every finding:

- **Low-risk (auto-apply):** local to one file, doesn't change props/exports/external behavior, doesn't touch hook dependency arrays or effect timing. Examples: extracting a repeated inline object/style to a named constant, removing genuinely dead code or unused imports ESLint missed, renaming a clearly mismatched variable, splitting an overlong JSX return into named sub-elements within the same file without changing render output.
- **Needs confirmation:** touches hook dependencies, memoization boundaries (`useCallback`/`useMemo`/`React.memo`), ref-vs-state architecture, component file splits, prop contracts, or anywhere a "correct" answer depends on a trade-off (performance vs. simplicity, indicator UX vs. code size) rather than a fact.

Apply low-risk changes directly. For needs-confirmation items, present each individually as **what / why it's flagged / the trade-off**, and let the user approve or decline each on its own — don't bundle unrelated findings into a single yes/no.

## Step 4 — Report

One scannable summary, not prose per finding:

- Mechanical fixes applied (count, grouped by rule category)
- Remaining ESLint findings ESLint couldn't auto-fix (rule + file:line)
- Structural changes auto-applied (low-risk)
- Structural changes awaiting the user's decision (needs-confirmation, listed individually)

## Notes

- Don't run `--fix` outside the requested scope even if ESLint would happily touch adjacent files.
- This skill doesn't run tests or type-check automatically. If the project has `pnpm typecheck` / `pnpm test`, suggest running them after the session — don't assume they exist or run them unprompted.
- If a structural finding echoes something the user has explicitly chosen for a stated reason elsewhere in the conversation or codebase (e.g. a deliberate perf trade-off), don't re-flag it as an issue — note it as intentional instead.

## Reference files

- `references/structural-checklist.md` — the judgment-level patterns to check for (hook stability, memoization, ref-vs-state, component size/splitting, duplication, naming, prop drilling), each with concrete low-risk vs. needs-confirmation guidance and short examples.
