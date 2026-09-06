# Travis Gautier — Design System

Canonical reference for the brand stack. Components consume from this list;
nothing else.

## Palette

| Token | Hex | Role |
|-------|-----|------|
| Marble | #F7F4EC | Primary surface |
| Parchment | #F0E6D2 | Secondary warm surface |
| Ink | #1C1814 | Text, button fills — warm near-black, never pure |
| Oxblood | #6B2020 | The one saturated accent |
| Verdigris | #2F5D50 | Completion / success states only |
| Bone | #E8DCC4 | Layered secondary parchment |
| Shadow | #2A2520 | Vignettes, edges, code surfaces |

## Contrast Pairs

Three explicit levels of contrast, used consistently:

| Pair | Use |
|------|-----|
| Marble + Ink | Maximum contrast — body text, headlines (must be legible) |
| Marble + Oxblood | Medium contrast — accents (eye attractors, not reading material) |
| Ink + Oxblood | Rare — dark button against the rest of the page |

## Typography

Display: **Cinzel Black** — Roman/inscriptional roots. ALL CAPS only.
Working face: **Inter** — modern humanist sans. Sentence case only.
Monospace: **JetBrains Mono** — terminals, code, prices, spec-sheet labels.

No third typeface, ever.

## Material Language

**Allowed**: marble, parchment, ink-on-paper texture, columns, arches, friezes,
Roman/Greek numerals, curly braces used decoratively, carved letterforms,
brushstroke / painted edges, subtle material satin.

**Forbidden**: gradients, drop shadows that look like UI, glowing circuits,
neural meshes, robot icons, lightning bolts, rockets, gears, sparkles, 3D
rendering, isometric perspective, pure black, pure white, pure red, any
saturated primary other than Oxblood.

**Exceptions — scrims**: a translucent color wash layered over a texture or
photograph for text legibility is brand-approved. Same shape as the
illuminated-manuscript hero overlay (`HeroBackdrop`) and the marble nav
texture (`.bg-marble-texture`). These are functional readability overlays,
not decorative color sweeps — the "no gradients" rule targets the latter.
Implemented via a two-stop translucent cream wash because CSS has no other
one-property way to lay a tint over a `background-image`. Allow-listed
per-pattern in `src/__tests__/brand/forbidden-patterns.test.ts`. A scrim is
always: same hue across both stops, low alpha range, functional purpose
(legibility). Anything else — color shifts, decorative purpose — is still
forbidden.

Test: if the element could appear on an object pulled from a museum or
archaeological dig, it belongs. If it could appear on an AI startup's About
page, it doesn't.

## Composition

The defining move: brushstroke-seam composition. Marble overlay painted across
the left of a darker photo/texture zone, with the brushstroke edge feathered
organically. Headline crosses from marble onto photo.

Three hierarchy levels per surface: accent tag (Oxblood label) → headline
(Cinzel Ink) → subtitle (Inter Ink-muted).

## Mobile-first legibility

Every thumbnail / og:image checked at 320×180 before shipping. If the main
headline isn't legible at that scale, the design fails.

## Asset paths

| Asset | Path |
|-------|------|
| Logo SVG (wordmark) | `public/logo.svg` |
| Favicon | `public/favicon.svg` |
| Apple touch icon (180×180) | `public/apple-touch-icon.png` |
| Android Chrome 192 | `public/android-chrome-192.png` |
| Android Chrome 512 | `public/android-chrome-512.png` |
| Hero texture (default) | `public/hero/floatbg.png` |
| Cinzel Black TTF | `public/fonts/Cinzel-Black.ttf` |
| Inter Regular TTF | `public/fonts/Inter-Regular.ttf` |
| Inter SemiBold TTF | `public/fonts/Inter-SemiBold.ttf` |
| Inter Bold TTF | `public/fonts/Inter-Bold.ttf` |

The four TTFs in `public/fonts/` are consumed only by `next/og`'s
`ImageResponse` (which cannot read `next/font/google` data). The site itself
loads Cinzel + Inter + JetBrains Mono via `next/font/google`.

## Off-site brand surfaces

The brand travels beyond the site through social-share previews and YouTube
thumbnails. Both reuse the palette, Cinzel display face, Oxblood accent tag,
and the brushstroke-seam composition.

### Open Graph images

Three dynamic routes render 1200×630 (`image/png`) brand-consistent previews
via `next/og`'s `ImageResponse`:

| Route | Used for | Accent |
|-------|----------|--------|
| `src/app/opengraph-image.tsx` | channel-level fallback for any route without its own | `?` |
| `src/app/episodes/[slug]/opengraph-image.tsx` | per-episode (headline = episode title) | `?` |
| `src/app/cases/[slug]/opengraph-image.tsx` | per-case (headline = case title) | `.` |

Shared size/contentType constants live in `src/lib/og/og-image.tsx`
(`OG_SIZE = { width: 1200, height: 630 }`, `OG_CONTENT_TYPE = 'image/png'`).

Composition: a Marble panel on the left holds the Oxblood Inter tag, the Cinzel
Ink headline, and an oversize Oxblood DropAccent glyph; the background is flat
Shadow. The brushstroke edge is approximated with a hand-tuned
`clip-path: polygon(...)` because **Satori** — the renderer `ImageResponse`
runs under the hood — supports neither SVG filters nor `mask-image`, so the
in-site mask-gradient brushstroke can't be used. At 1200×630 the polygon reads
as a brushstroke; it is the one place the seam is geometric.

### YouTube thumbnail composer

Dev-only route `/thumb-preview` renders the canonical 1280×720 brand
composition, driven entirely by query string
(`?title=...&series=...&tier=...&accent=?&photo=...`). The page lives under
`src/app/(internal)/thumb-preview/` and returns 404 in production
(`process.env.NODE_ENV !== 'development'` gate) — it is a capture tool, not a
product surface. Capture a screenshot at 1280×720 and upload to YouTube.

Default hero texture: `/hero/floatbg.png`. Allowed accent glyphs (validated
against `ALLOWED_GLYPHS` in `src/app/(internal)/thumb-preview/glyphs.ts`):
`?` `.` `!` `→` `✕` `✓` `—`. An unknown `?accent=` value falls back to `?`.

Example: `http://localhost:3000/thumb-preview?title=Ship%20it%20alone&series=Zero%20to%2010x&tier=FLAGSHIP&accent=?`

## Implementation references

- Token source — `src/app/globals.css` (`@theme inline` block)
- Surface primitives — `src/components/brand/{Marble,Parchment,Bone,Shadow}.tsx`
- Brushstroke seam — `src/components/brand/BrushstrokeSeam.tsx`
- Logo — `src/components/brand/Logo.tsx`
- Editorial card — `src/components/brand/EditorialCard.tsx`
- Drop accent — `src/components/brand/DropAccent.tsx`
- Button — `src/components/brand/Button.tsx`
- Section + divider — `src/components/brand/Section.tsx`, `src/components/brand/SectionDivider.tsx`
- Open Graph image module — `src/lib/og/og-image.tsx`
- Sentinels — `src/__tests__/brand/{forbidden-patterns,tokens,type-scale,fonts,spacing}.test.ts`

## Regeneration notes

- **Raster icons** (`public/apple-touch-icon.png`, `public/android-chrome-192.png`,
  `public/android-chrome-512.png`) are rendered once from `public/favicon.svg`
  at the target sizes. To regenerate after a color or mark change, export the
  SVG at each size with any vector→raster tool (Figma, Sketch, or
  `rsvg-convert`). There is no build-step automation; the icons change at most
  once per brand iteration.
- **Fonts** in `public/fonts/` are checked-in copies from the Google Fonts
  release (Cinzel: SIL OFL, Inter: SIL OFL). To update, download fresh from
  Google Fonts and replace the `.ttf` files. They are used only by `next/og`;
  the site loads its fonts through `next/font/google`.
