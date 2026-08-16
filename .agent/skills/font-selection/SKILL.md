---
name: font-selection
description: >
  Procedural, senior-designer-style workflow for selecting UI/product typefaces from Google
  Fonts. Use this skill whenever the user wants to pick, shortlist, audit, or pair fonts for
  a product, app, dashboard, or design system — triggers include "what font should I use",
  "pick a typeface", "font recommendation", "help me choose a font", "font pairing", or any
  request to evaluate fonts for a UI. Also trigger when the user is starting a new project's
  design system and hasn't locked in typography yet. Scoped to UI/product contexts (not
  editorial, print, or branding/logo type) and to fonts available on Google Fonts (free,
  webfont-licensed). Always use this skill instead of just naming a font from memory — font
  suitability depends on verifiable technical facts (weight availability, character set,
  variable font support) that must be checked, not guessed.
---

# Font Selection Skill

A structured elimination process for picking UI/product typefaces — not a taste-first
"browse until something looks nice" approach. Mirrors how a senior designer actually works:
constraints first, then classification, then technical audit, then pairing, then a real
visual proof before locking anything in.

**Scope:** UI/product typography only (dashboards, apps, design systems). Not editorial,
print, or logo/branding type. **Source:** Google Fonts only — free, webfont-licensed,
programmatically verifiable.

---

## Workflow

Work through these steps in order. Don't skip to "here are 3 fonts" without steps 1–2 — that's
the exact failure mode this skill exists to prevent.

### Step 1: Pin down constraints

Ask (or infer from existing project context, e.g. an AGENT.md or existing design tokens):

- **Density/context**: dashboard/data-heavy UI, marketing-adjacent product UI, or long-form
  reading within the product?
- **Weight range needed**: how many weights will the design system actually use? (Most UIs
  need 3–4: regular, medium, semibold, and maybe a light for display text.)
- **Variable font okay?** Variable fonts cut HTTP requests and file size — prefer them unless
  there's a specific reason not to.
- **Numeral needs**: financial/data UI → tabular lining numerals are close to mandatory.
- **Character set**: does the product need more than basic Latin (accented characters,
  Cyrillic, etc.)?

If the user is working inside an existing project with established conventions (check for an
AGENT.md, existing tokens file, or prior font decisions in memory/context), surface those
before starting — don't re-litigate a font choice that's already locked in.

### Step 2: Classify by voice

Read `references/classification-axes.md` and map the product's intended tone to an axis
position (geometric/humanist/grotesque for sans; old-style/transitional/didone/slab for
serif) **before** naming candidates. This produces a shortlist of 4–6 typefaces, not a random
guess.

### Step 3: Verify technical facts — don't assume

For every shortlisted candidate, run `scripts/check_google_fonts.py <font-name>` to pull real
data: available weights, italic availability, variable axes, subsets/character set coverage.
Never state a font "has X weight" or "supports Y" from memory — Google Fonts listings change
and free fonts frequently have incomplete weight ranges or fake/missing italics. This script
requires network access to `fonts.google.com`; if that's unavailable in the current
environment, say so explicitly and ask the user to verify manually rather than presenting
memorized guesses as verified facts.

### Step 4: Glyph and numeral audit

Run through `references/glyph-audit-checklist.md` for the top 2–3 candidates: numeral
disambiguation (1/l/I, 0/O), tabular numeral support, italic authenticity, all-caps behavior.
This is where free fonts most often fail — flag it plainly if a candidate has a synthetic or
missing italic/bold rather than glossing over it.

### Step 5: Pairing (if a second font is needed)

Read `references/pairing-rules.md`. Default heuristic: prefer a superfamily (one type family
with both a sans and a companion cut) when available — it removes most pairing risk. If
pairing across families, contrast in exactly one dimension while keeping proportions/era
compatible.

### Step 6: Generate the visual proof

Before recommending anything as final, render the candidates using the specimen template —
don't just describe them in prose. Use the Visualizer or an HTML artifact:

1. Read `assets/specimen-template.html` for structure.
2. Populate it with the shortlisted font(s) via Google Fonts `<link>` embed, showing: a
   pangram at display/heading/body/label sizes, a numeral row (tabular, in context, e.g. a
   fake currency amount), and an all-caps label line.
3. Render via the Visualizer (`show_widget`, HTML mode) so the user sees real rendered type,
   not a description of it.

### Step 7: State the recommendation with the trade-off, not just the winner

Every real font choice has a trade-off (file size vs. weight range, distinctiveness vs.
safety, free-tier limitation vs. paid alternative that exists). Name it. Don't present a pick
as risk-free.

---

## Output format

End with:
1. The recommended font (+ pairing, if applicable)
2. The specimen render
3. One sentence on the trade-off
4. The Google Fonts `<link>`/`@import` snippet and CSS `font-family` stack, ready to drop in

---

## Reference files

- `references/classification-axes.md` — voice/tone → typeface-axis mapping
- `references/pairing-rules.md` — pairing heuristics + superfamily shortlist
- `references/glyph-audit-checklist.md` — numeral/glyph/italic stress-test checklist
- `references/google-fonts-shortlist.md` — curated, pre-vetted UI-safe fonts by category (starting point, not a substitute for step 3's verification)

## Scripts

- `scripts/check_google_fonts.py` — queries Google Fonts metadata for a given font: weights, italics, variable axes, subsets. Requires network access to fonts.google.com.

## Assets

- `assets/specimen-template.html` — static specimen page (pangram at 4 sizes + numeral row + all-caps line) used to generate live visual proofs via the Visualizer
