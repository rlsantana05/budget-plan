# Google Fonts — UI-Safe Starting Shortlist

A pre-vetted starting point to speed up Step 2, organized by classification axis. This is a
starting shortlist, NOT a substitute for Step 3's technical verification — weight ranges and
feature support on Google Fonts change over time, so always confirm with
`scripts/check_google_fonts.py` before finalizing, rather than trusting this list as current
truth.

## Humanist sans (default for most product UI)

- **Inter** — extremely wide weight range, variable, excellent tabular numerals, huge
  adoption (safe/neutral choice, also means it's become a "default" look — flag this
  trade-off if distinctiveness matters).
- **DM Sans** — variable, warm but neutral, good at small sizes.
- **Source Sans 3** — Adobe-quality hinting, reliable across weights.
- **Work Sans** — slightly more character than Inter, still neutral enough for dashboards.

## Geometric sans (modern/tech-forward)

- **Space Grotesk** — distinctive without being loud, good for headings; check body-text
  legibility at small sizes before using for body copy.
- **Outfit** — clean geometric, wide weight range.
- **Poppins** — very popular (same distinctiveness trade-off as Inter, arguably more so).

## Grotesque/neutral sans (editorial, admin, "gets out of the way")

- **IBM Plex Sans** — part of a full superfamily (Serif, Mono, Condensed), designed
  specifically for software/technical contexts, excellent numeral support.
- **Public Sans** — US government design system font, extremely neutral, accessible-first.
- **Archivo** — wide weight and width range, grotesque with slight warmth.

## Monospace (for numeric/code-adjacent UI)

- **IBM Plex Mono** — pairs natively with Plex Sans.
- **JetBrains Mono** — excellent for code, less common as a UI numeral font but strong
  disambiguation of 0/O/1/l/I by design.
- **DM Mono** — pairs with DM Sans, good tabular numeral support.

## Serif (headings/editorial accents only — rare in core UI)

- **Newsreader** — Google's own editorial serif, pairs well with a humanist sans body.
- **Source Serif 4** — same superfamily benefit as Source Sans.

## Caution list (common but check carefully in Step 3/4)

- Many "display" category fonts on Google Fonts have only 1–2 weights and no real italic —
  fine for a hero headline, unsuitable as a body or UI-label font. Always verify before
  assuming a fuller range exists.
