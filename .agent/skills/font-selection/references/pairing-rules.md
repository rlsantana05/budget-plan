# Font Pairing Rules

## Default heuristic: superfamily first

The lowest-risk pairing is a single type family that ships both a sans and a serif (or a
sans + a mono) cut, sharing proportions, x-height, and era. This removes almost all pairing
risk because the designer already solved the compatibility problem for you.

Google Fonts superfamilies worth defaulting to:

| Family | Cuts available | Good for |
|---|---|---|
| IBM Plex | Sans, Serif, Mono, Condensed | Full design systems, dashboards |
| Source | Sans 3, Serif 4, Code Pro | Editorial products with a UI layer |
| Public Sans + companion mono | Sans + system mono pairing | Government/utility-style UI |

If a superfamily fits the voice from `classification-axes.md`, stop there — don't manufacture
a pairing problem that doesn't need solving.

## If pairing across two separate families

Contrast in **exactly one** dimension. Keep everything else compatible:

- **Contrast dimension options** (pick one): serif/sans split, weight extreme (very light
  display + regular body), or x-height/proportion difference.
- **Keep compatible**: era/mood (don't pair a playful geometric display font with a somber
  old-style serif body), and overall proportions (avoid pairing a very condensed font with a
  very wide one).

## Common safe pairings (Google Fonts)

| Heading | Body | Contrast used |
|---|---|---|
| Space Grotesk | Inter | geometric display / humanist body |
| Newsreader | DM Sans | serif/sans split |
| Archivo | Public Sans | weight/width contrast within grotesque family |

## Red flags

- Two fonts from the same category (e.g. two different geometric sans) — not enough contrast,
  reads as an inconsistency rather than a deliberate choice.
- Pairing a display-only font (no real text weights, e.g. many "display" Google Fonts) as a
  body font — check in Step 3 whether the font actually has a usable regular/text weight.
