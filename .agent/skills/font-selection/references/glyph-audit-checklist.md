# Glyph & Numeral Audit Checklist

Run this against the top 2–3 shortlisted candidates before finalizing. This is the step where
free/Google Fonts most often fail — check plainly, don't assume quality from the regular
weight alone.

## Numeral disambiguation

- [ ] Does `1` (one), `l` (lowercase L), and `I` (capital i) look visually distinct?
- [ ] Does `0` (zero) look distinct from `O` (capital O)? (Many UI-safe fonts use a slashed
      or dotted zero — check if that's present or if it's ambiguous.)

## Numeral behavior (critical for data/financial UI)

- [ ] Does the font support **tabular (monospaced) numerals** via
      `font-variant-numeric: tabular-nums` or OpenType `tnum` feature? Verify via
      `scripts/check_google_fonts.py`, not assumption.
- [ ] Lining vs. oldstyle numerals — UI numerals should default to lining (same height as
      caps), not oldstyle (varying baseline/ascender, which reads as editorial/serif-body
      style and looks broken in a data table).

## Weight and italic authenticity

- [ ] Does the font ship a **true italic** (a separate drawn cut), or is the "italic" browser
      applying a synthetic slant to the roman? Synthetic italics look distorted and
      unprofessional — flag this explicitly if found.
- [ ] Does the semibold/bold weight exist as an actual cut, or is it browser-faked
      (`font-weight: bold` on a font with only one real weight)? A faked bold blurs and looks
      cheap, especially at small sizes.
- [ ] For variable fonts: confirm the weight axis actually spans the range needed (some
      "variable" fonts have a narrower registered axis than expected).

## All-caps behavior

- [ ] Does the font look cramped in all-caps without added letter-spacing? Most fonts need
      positive tracking (`+0.06em` to `+0.12em`) applied to caps — check whether the
      default spacing already accounts for this or needs correction.

## Small-size legibility

- [ ] At the smallest size the UI will actually use (often 11–13px for labels/captions), are
      counters (the enclosed space in letters like `e`, `a`, `g`) still open, or do they clog
      up? This matters more than how the font looks at 48px.

## Reporting

State findings plainly per candidate — e.g. "Font X has no true italic (browser-synthesized);
if italics are needed anywhere in the design system, this is disqualifying" — rather than
softening or omitting a real limitation to keep the recommendation clean.
