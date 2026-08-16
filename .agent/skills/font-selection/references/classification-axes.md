# Classification Axes

Map the product's intended voice to an axis position BEFORE naming candidate fonts. This
turns "pick something nice" into a narrowing filter.

## Sans-serif axis (most UI work lives here)

| Category | Characteristics | Feels like | Google Fonts examples |
|---|---|---|---|
| **Geometric** | Circular bowls, consistent stroke width, based on simple shapes | Modern, confident, slightly cold, tech-forward | Poppins, Space Grotesk, Outfit |
| **Humanist** | Organic proportions, based on handwriting/calligraphy, varied stroke width | Warm, approachable, readable at small sizes | DM Sans, Inter, Source Sans 3, Work Sans |
| **Grotesque/Neo-grotesque** | Neutral, minimal contrast, utilitarian | Neutral, editorial, "gets out of the way" | IBM Plex Sans, Public Sans, Archivo |

## Serif axis (less common in UI, used for editorial/premium contexts)

| Category | Characteristics | Feels like | Google Fonts examples |
|---|---|---|---|
| **Old-style** | Low contrast, angled stress, warm | Traditional, trustworthy, bookish | Lora, Source Serif 4 |
| **Transitional** | Medium contrast, more vertical stress | Refined, editorial | Newsreader, Playfair Display (headings only) |
| **Slab** | Heavy, uniform-weight serifs | Bold, sturdy, approachable-but-serious | Roboto Slab, Zilla Slab |

## Tone → axis lookup

| If the product should feel... | Lean toward |
|---|---|
| Neutral, data-forward, "invisible" (dashboards, fintech, admin tools) | Grotesque or Humanist sans |
| Friendly, consumer-facing, approachable | Humanist sans |
| Modern, confident, startup/tech | Geometric sans |
| Premium, editorial, trustworthy | Old-style/Transitional serif for headings + humanist sans for body |
| Bold, structural, sturdy | Slab serif (headings only, rarely body) |

## Anti-pattern

Don't pick from personality alone without checking Step 3 (technical verification) — a
geometric sans with a gorgeous regular weight can have a genuinely bad semibold, or no true
italic. Voice-matching narrows the field; it doesn't finish the job.
