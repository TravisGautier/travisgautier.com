# Phase 1: Foundation Tokens

**Total Size: M + M + S**
**Prerequisites: None — this is the foundation. Sections 1.1 / 1.2 / 1.3 are parallel-able.**
**New Types: None**
**New Files: `docs/design-system.md`**

Phase 1 swaps the placeholder palette for the real brand tokens, locks the
spacing + radius scale on an 8px grid with restrained corners, and produces
canonical brand documentation that downstream phases reference. Dark mode is
deliberately removed: the brand is one mode (Marble), one identity, by design.

---

## Feature 1.1: Palette swap + contrast pairs + dark-mode removal

**Complexity: M** — Replace the existing `@theme inline` block with the brand
palette, declare explicit contrast-pair tokens, and remove the
`prefers-color-scheme: dark` override entirely.

### Problem

`src/app/globals.css` currently declares an `ink/parchment/ember/steel/mist/signal`
palette plus a dark-mode media block — leftovers from `website-foundation-1.3`
when no brand spec existed. The real brand is anchored on materials (Marble,
Parchment, Ink, Oxblood, Verdigris, Bone, Shadow) and is light-only. Every
downstream phase depends on these tokens being canonical.

### Implementation

**MODIFY** `src/app/globals.css` — replace the `@theme inline` block:

```css
@import "tailwindcss";

@theme inline {
  /* Material palette — every color is the color of a real ancient object */
  --color-marble: #F7F4EC;       /* bright warm white with grey-tan veining */
  --color-parchment: #F0E6D2;    /* secondary warm — used where marble is impractical */
  --color-ink: #1C1814;          /* headlines, body, button fills — warm near-black, never pure */
  --color-oxblood: #6B2020;      /* the one saturated accent — headlines, logo, series tags */
  --color-verdigris: #2F5D50;    /* aged-bronze patina green — completion / success only */
  --color-bone: #E8DCC4;         /* secondary parchment for layered surfaces */
  --color-shadow: #2A2520;       /* warm dark grey for vignettes, edges, code surfaces */

  /* Semantic surface aliases */
  --color-background: var(--color-marble);
  --color-foreground: var(--color-ink);
  --color-muted: color-mix(in oklab, var(--color-ink) 65%, transparent);
  --color-accent: var(--color-oxblood);
  --color-success: var(--color-verdigris);
  --color-link: var(--color-oxblood);

  /* Explicit contrast pairs (Three Hierarchy Levels) */
  --pair-text-on-marble: var(--color-ink);
  --pair-text-on-bone: var(--color-ink);
  --pair-text-on-parchment: var(--color-ink);
  --pair-text-on-shadow: var(--color-parchment);

  --pair-accent-on-marble: var(--color-oxblood);
  --pair-accent-on-bone: var(--color-oxblood);
  --pair-accent-on-shadow: var(--color-parchment);

  /* Dark CTA — the rare Ink + Oxblood combination, reserved for primary button hover */
  --pair-dark-cta-fg: var(--color-marble);
  --pair-dark-cta-bg: var(--color-ink);
  --pair-dark-cta-accent: var(--color-oxblood);
}
```

Delete the existing `@media (prefers-color-scheme: dark) { ... }` block entirely.
The brand is one mode.

Update the `body` block to reference `var(--color-foreground)` and the new body
font alias (which Phase 2.1 will repoint to Inter, but for now points at the
old `--font-geist-sans` variable so the build still passes between phases):

```css
body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-body), system-ui, sans-serif;
}
```

Remove `font-feature-settings: "ss01", "cv11"` — those are Geist-specific
stylistic sets and won't apply to Inter.

### Design Decisions

- **Hex values from the brand spec are canonical.** Marble is `#F7F4EC` (a
  notch warmer than the spec's prose description "bright warm white" reads
  in print). If the user redacts, swap to `#F5F2EA` or `#FAF7EE` — they're
  all the same material under different studio lights. The hex shipped here
  is the visual midpoint.
- **No pure black, no pure white.** Per spec. Ink is `#1C1814`, never `#000`.
  Marble is `#F7F4EC`, never `#FFF`. The forbidden-pattern sentinel (Phase 3.3)
  enforces this.
- **Three explicit contrast pairs as tokens.** Per spec, the brand has
  exactly three contrast levels: text (max), accent (medium), dark CTA
  (rare). Encoding them as `--pair-*` tokens means components consume the
  semantic pair name (`var(--pair-accent-on-marble)`) instead of picking
  hexes ad-hoc — much harder to drift.
- **`color-mix` for `--color-muted`.** Brand muted text isn't a separate
  color — it's Ink at reduced opacity over the current surface. Using
  `color-mix(in oklab, ...)` keeps the warm anchor without introducing a
  steel-grey that fights the palette.
- **Dark mode removed, not gated.** A feature flag would imply we might
  bring it back. The brand spec is explicit: marble + ink is the
  maximum-contrast pair, the brand is one mode. Removing the override is a
  positioning decision.
- **`--color-link` = Oxblood.** No blue, anywhere. The brand spec calls
  this out as a positioning move ("Tech defaults to blue. Removing blue
  entirely is a brand decision").

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |

---

## Feature 1.2: Spacing + radius scale

**Complexity: M** — Define a restrained 8px-grid spacing scale and a radius
scale that tops out at 4px. The brand is carved, not pillowy.

### Problem

The current `globals.css` doesn't declare a spacing or radius scale —
components stack Tailwind utilities ad-hoc (`py-16`, `mt-6`, `rounded`,
`rounded-lg`). The brand spec calls for an editorial rhythm: tighter, more
deliberate, with restrained corners. Without a token scale, every component
picks differently and drift compounds.

### Implementation

**MODIFY** `src/app/globals.css` — append to the `@theme inline` block:

```css
@theme inline {
  /* ... palette tokens from 1.1 ... */

  /* Spacing — 8px grid, half-step at the small end for tight rhythm */
  --space-0: 0;
  --space-px: 1px;
  --space-1: 0.25rem;   /* 4px — half-step */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-7: 3rem;      /* 48px */
  --space-8: 4rem;      /* 64px */
  --space-9: 6rem;      /* 96px */
  --space-10: 8rem;     /* 128px */

  /* Vertical rhythm tokens for <Section> */
  --section-y-sm: var(--space-7);   /* 48px — tight section */
  --section-y-md: var(--space-8);   /* 64px — default */
  --section-y-lg: var(--space-9);   /* 96px — hero, between major content blocks */

  /* Radius — restrained. Brand is carved stone, not rounded plastic. */
  --radius-sharp: 0;
  --radius-soft: 2px;
  --radius-card: 4px;

  /* 1px edge — the brand's depth signal (no UI shadows) */
  --edge-color: var(--color-ink);
  --edge-color-subtle: color-mix(in oklab, var(--color-ink) 20%, transparent);
}
```

The scale skips `space-1.5` and other half-steps above 8px — that's
deliberate restraint. Tailwind 4 reads these tokens via the `@theme` block;
components use `p-(--space-5)`, `gap-(--space-3)`, etc.

### Design Decisions

- **8px grid, half-step only at the very small end.** Most editorial layouts
  work on an 8px rhythm. Allowing `4px` covers the inline gaps (badge padding,
  icon-text spacing) without opening the door to arbitrary `5px`, `7px`,
  `11px` values that would fragment the system.
- **No radius > 4px.** Per spec ("the brand is carved, not pillowy"). The
  forbidden-pattern sentinel (Phase 3.3) doesn't enforce this — Tailwind
  utility classes like `rounded-lg` are visually unmistakeable on review —
  but the tokens make the brand-correct choice the obvious one.
- **`--edge-color` for 1px borders.** The brand uses 1px Ink edges to
  signal depth instead of UI-style drop shadows. Single token = single
  point of change.
- **No `box-shadow` tokens.** Adding them would invite their use; per spec,
  UI shadows are forbidden. Material shadows (the painted seam, vignettes)
  are component-specific and live in their own files.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |

---

## Feature 1.3: Brand doc rewrite + design-system doc

**Complexity: S** — Update the existing brand-identity doc to point at the
editorial direction, and add a new `docs/design-system.md` capturing
the canonical token list, contrast pairs, and the forbidden-patterns list.

### Problem

`docs/brand-identity.md` currently describes the old "boutique
consultancy, muted confident colors, narrative quality" direction. That guidance
is now stale. New contributors (human or agent) reading the existing doc would
ship the wrong brand. A complete brand reset needs canonical documentation in
the repo so the prep doc (currently only in chat) is durable.

### Implementation

**MODIFY** `docs/brand-identity.md` — rewrite the **Visual Identity
Direction** section to read:

```markdown
## Visual Identity Direction

Boutique editorial brand that happens to teach AI development — built to look
like nothing else in the space. Every channel teaching AI/coding in 2026
defaults to neon gradients, dark mode with RGB accents, hype-arrow thumbnails,
shocked-face hosts, gamer aesthetics. Travis Gautier occupies the opposite corner:
classical, restrained, material, editorial.

The aesthetic exists because the content claims a position:
- **Ancient principles, modern tools.** Software is craft, the same way carpentry,
  masonry, and writing were craft.
- **Considered, not hype.** Every editorial choice telegraphs that the channel
  takes time to think rather than reacting to trends.
- **For the serious.** The aesthetic intentionally filters its audience.

Implementation details — tokens, contrast pairs, forbidden patterns — live in
`docs/design-system.md`.
```

Leave the rest of the doc (voice, mission, philosophy, audience) alone — that
content is still valid; only the visual direction inverted.

**NEW** `docs/design-system.md` with the following structure:

```markdown
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
| Logo SVG | `public/logo.svg` |
| Favicon | `public/favicon.svg` |
| Apple touch icon | `public/apple-touch-icon.png` |
| Android Chrome 192 | `public/android-chrome-192.png` |
| Android Chrome 512 | `public/android-chrome-512.png` |
| Fonts (for `next/og`) | `public/fonts/{Cinzel-Black,Inter-Regular,Inter-SemiBold,Inter-Bold}.ttf` |

## Implementation references

- Token source — `src/app/globals.css` (`@theme inline` block)
- Surface primitives — `src/components/brand/{Marble,Parchment,Bone,Shadow}.tsx`
- Brushstroke seam — `src/components/brand/BrushstrokeSeam.tsx`
- Logo — `src/components/brand/Logo.tsx`
- Editorial card — `src/components/brand/EditorialCard.tsx`
- Drop accent — `src/components/brand/DropAccent.tsx`
- Sentinels — `src/__tests__/brand/{forbidden-patterns,contrast,legibility}.test.ts`
```

Phase 8.4 finalizes this doc with the actual final font file paths, real
opengraph-image route paths, and any token tweaks that landed during
implementation.

### Design Decisions

- **Split the brand-identity doc from the design system.** The identity doc
  (voice, mission, audience) reads well in narrative. The design system reads
  well as reference. Conflating them produces a doc nobody reads end-to-end.
- **Keep the brand-identity doc — don't replace it.** The voice and mission
  sections are still correct. Only visual direction inverted.
- **Document forbidden patterns in prose, not just in the sentinel.** The
  sentinel (Phase 3.3) is the regression guard, but a contributor reading
  source code first needs to know the rules — the doc explains why pure red
  is out and Oxblood is in, the sentinel just fails if they ignore.
- **Reference the sentinel + token files by path.** A contributor searching
  for "where's the palette defined" finds it via the design-system doc, not
  by grepping. Anchor paths once, here.

### Files

| Action | File |
|--------|------|
| MODIFY | `docs/brand-identity.md` |
| NEW    | `docs/design-system.md` |

---

## Phase 1 Exit Criteria

- `globals.css` declares the seven-color palette, semantic aliases, three
  contrast pairs, the 8px spacing scale, vertical-rhythm tokens, and the
  restrained radius scale.
- The `prefers-color-scheme: dark` block is gone from `globals.css`.
- `body` references `var(--color-background)` and `var(--color-foreground)`.
- `docs/brand-identity.md` reflects the editorial direction.
- `docs/design-system.md` exists with palette / contrast / typography
  / material / composition / asset paths sections.
- `npm run lint` clean. `npm run build` clean. `npm test` green (no new tests
  in this phase, but the existing smoke test must still pass).
- Visual dev-server check at `/` shows the site rendering on marble (background
  changed) even though no component classes have been updated yet — that's
  expected and intentional, downstream phases pick up the new tokens.
