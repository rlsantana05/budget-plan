# Budget Plan

Personal budgeting app (Next.js 16, React 19, TypeScript 5, Mantine v9).

## Commands

| Action     | Command                                                 |
| ---------- | ------------------------------------------------------- |
| Dev server | `pnpm dev`                                              |
| Build      | `pnpm build`                                            |
| Lint       | `pnpm lint` (ESLint 9)                                  |
| Typecheck  | `pnpm exec tsc --noEmit` (no npm script — run manually) |
| Test       | Not configured yet                                      |

Use **pnpm**, not npm/yarn/bun.

## Project map

- `src/app/` — Next.js App Router pages/layouts
- `@/*` — path alias for `./src/*`
- `public/` — static assets

## Stack notes

- App Router, default Server Components. Client Components only when interactivity requires them.
- **Mantine v9** UI library (`@mantine/core`, `@mantine/hooks`)
- `next/font/google` for Geist typeface
- `lucide-react` for icons
- Strict TypeScript (`strict: true` in tsconfig)

## Domain model (must preserve)

The app separates **planning** from **funding**:

```
Plan Month → Receive Income → Fund Categories → Spend Money → Weekly Review → Adjust Funding → Close Month
```

| Concept               | Rule                                                     |
| --------------------- | -------------------------------------------------------- |
| Planned               | Aspirational — may exceed available cash                 |
| Funded                | Real money assigned — never exceed Available to Allocate |
| Spent                 | Reduces Remaining (funded − spent)                       |
| Remaining             | Safe-to-spend amount                                     |
| Available to Allocate | Income received − money already funded                   |

- Account balances and budgeting are separate systems
- Moving money between categories never changes total funded
- Transactions reduce funded money; never modify planned budget
- Weekly reviews are checkpoints, not budgeting periods

## Existing instruction files

- `PHILOSOPHY.md` — legacy product philosophy doc (607 lines). Key domain rules are summarized above.
