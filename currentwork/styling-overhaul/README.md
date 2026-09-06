# styling-overhaul — Implementation Plan

**Alias:** `so` — invoke as `/pipeline so <section>`. Section IDs in YAML + commits use the canonical slug `styling-overhaul`.

## Context

travisgautier.com currently ships with a placeholder "boutique consultancy" palette
(ink / parchment / ember / steel / mist / signal) and the default Geist type
stack — leftovers from `website-foundation-1.3` when no real brand spec
existed. The user has since produced a complete editorial brand identity:
**Marble / Parchment / Ink / Oxblood / Verdigris / Bone / Shadow** palette,
**Cinzel + Inter + JetBrains Mono** type stack, the **brushstroke-seam**
composition, and a strict no-gradient / no-saturated-primary / no-UI-shadow
discipline. The thesis: a boutique editorial brand that happens to teach AI
development, deliberately occupying the corner opposite every other
AI/coding channel in 2026 (neon, gamer, hype-arrow). This job resets the site
against that identity.

The end-state: `npm run build` produces a one-mode (light) marble-and-ink
site with Cinzel display + Inter body, an editorial card system, a homepage
hero composed under a full-bleed illuminated-manuscript photograph, a
dynamic `opengraph-image`
pipeline that ships the brand to social-share previews, a dev-only
`/thumb-preview` route for capturing 1280×720 YouTube thumbnails, contrast +
forbidden-pattern sentinels locking the system against future drift, and
the existing brand-identity doc rewritten + a new design-system doc shipped
alongside.

The job follows the partymasters `so` precedent (32 phases / 278 sections)
but is scaled down: travisgautier is one brand, one mode, one storefront — not a
14-theme multi-tenant SaaS. The structure here is **9 phases, 32 sections**.

## What Already Exists

- **Tokens (placeholder)** — `src/app/globals.css` declares an `@theme inline`
  block with ink/parchment/ember/steel/mist/signal hexes plus a
  `prefers-color-scheme: dark` override. To be wholesale replaced.
- **Type stack (placeholder)** — `src/app/layout.tsx` loads `Geist` and
  `Geist_Mono` via `next/font/google`, exposed as `--font-geist-sans` /
  `--font-geist-mono`. To be swapped.
- **Site shell** — `src/components/site/Header.tsx`, `Footer.tsx`,
  `Container.tsx`, `NavLink.tsx`. Functional, styled minimally. To be reskinned.
- **Component inventory** — `src/components/capture/EmailCapture.tsx`,
  `build-log/JobCard.tsx`, `build-log/StatusBadge.tsx`,
  `build-log/JobsRollupTable.tsx`, `build-log/PhaseNav.tsx`,
  `build-log/MarkdownDocument.tsx`, `products/ProductCard.tsx`,
  `products/BuyButton.tsx`, `cohorts/CohortCard.tsx`,
  `cohorts/CohortDetailHero.tsx`, `cohorts/CohortStatusBadge.tsx`,
  `auth/SignInForm.tsx`, `account/PurchaseList.tsx`,
  `account/SignOutButton.tsx`, `crosslinks/LllCrosslinks.tsx`. All
  functional, all in the placeholder palette.
- **Routes** — `/`, `/about`, `/episodes`, `/episodes/[slug]`, `/cases`,
  `/cases/[slug]`, `/build-log`, `/build-log/jobs/[slug]`,
  `/build-log/jobs/[slug]/[phase]`, `/build-log/status`, `/products`,
  `/products/[slug]`, `/products/account`,
  `/products/account/purchases/[id]`, `/cohorts`, `/cohorts/[slug]`,
  `/login`, `/login/verify`. All render in the current palette and need
  reskin.
- **Build-log prose** — `.build-log-prose` component layer in `globals.css`
  styles MDX rendered for the build log. Heading/code/table/blockquote
  treatment exists; will be retrofitted to the brand stack.
- **Brand identity doc (placeholder)** —
  `docs/brand-identity.md` describes the old "boutique
  consultancy, muted confident colors" direction. Will be rewritten to the
  editorial direction in so-1.3 and a new `docs/design-system.md`
  added alongside.
- **Tailwind 4 setup** — `@import "tailwindcss"` + inline `@theme` in
  `globals.css`, `@tailwindcss/postcss` in `postcss.config.mjs`. Stable; we
  swap token values inside the existing structure, not the structure itself.
- **No animation / UI libraries** — no Radix, no Headless UI, no Framer
  Motion. The brand discipline (no gradients, no UI shadows, minimal motion)
  means we don't add any in this job either.

## Feature Overview (32 Features, 9 Phases)

| #   | Feature                                                                                  | Phase                          | Size | Status  |
|-----|------------------------------------------------------------------------------------------|--------------------------------|------|---------|
| 1.1 | Palette swap + contrast pairs + dark-mode removal                                        | 1 - Foundation Tokens          | M    | Complete |
| 1.2 | Spacing + radius scale (8px grid, restrained corners)                                    | 1 - Foundation Tokens          | M    | Complete |
| 1.3 | Brand doc rewrite + new `docs/design-system.md`                                | 1 - Foundation Tokens          | S    | Complete |
| 2.1 | Font loading swap (Cinzel + Inter + JetBrains Mono)                                      | 2 - Typography                 | M    | Complete |
| 2.2 | Type scale + display-rule utilities                                                      | 2 - Typography                 | S    | Complete |
| 2.3 | `<DropAccent>` oversized-punctuation primitive                                           | 2 - Typography                 | S    | Complete |
| 2.4 | `.build-log-prose` retrofit (Cinzel headings, Oxblood drop cap, Shadow code surfaces)    | 2 - Typography                 | M    | Complete |
| 3.1 | Surface primitives (`<Marble>`, `<Parchment>`, `<Bone>`, `<Shadow>`)                     | 3 - Material Language          | M    | Complete |
| 3.2 | `<BrushstrokeSeam>` SVG mask + texture overlay                                           | 3 - Material Language          | L    | Complete |
| 3.3 | Forbidden-pattern sentinel (no gradients / UI shadows / pure primaries)                  | 3 - Material Language          | M    | Complete |
| 4.1 | `<Logo>` lockup with `{10x}` curly-brace mark + `public/logo.svg`                        | 4 - Logo + Chrome              | M    | Complete |
| 4.2 | Header restyle (Marble surface, Oxblood active state, all-caps Inter nav)                | 4 - Logo + Chrome              | M    | Complete |
| 4.3 | Footer restyle (Parchment surface, Verdigris LLL link)                                   | 4 - Logo + Chrome              | S    | Complete |
| 4.4 | Layout primitives — `<Container>` widths, `<Section>`, `<SectionDivider>`                | 4 - Logo + Chrome              | M    | Complete |
| 5.1 | `<Button>` primitive (Ink fill / variants / sharp corners / no shadow)                   | 5 - Component Primitives       | M    | Complete |
| 5.2 | `<StatusBadge>` variant restyle (Oxblood / Verdigris / Ink / Bone)                       | 5 - Component Primitives       | S    | Complete |
| 5.3 | `EmailCapture` reskin (Bone input, Ink button, Verdigris success)                        | 5 - Component Primitives       | M    | Complete |
| 5.4 | Auth + storefront button consistency (`SignInForm`, `SignOutButton`, `BuyButton`)        | 5 - Component Primitives       | S    | Complete |
| 6.1 | `<EditorialCard>` primitive enforcing three-level hierarchy                              | 6 - Card Primitives            | L    | Complete |
| 6.2 | `JobCard` refactored onto `<EditorialCard>`                                              | 6 - Card Primitives            | S    | Complete |
| 6.3 | `ProductCard` refactored onto `<EditorialCard>` (price in monospace)                     | 6 - Card Primitives            | S    | Complete |
| 6.4 | `CohortCard` + `CohortDetailHero` + `CohortStatusBadge` reskin                           | 6 - Card Primitives            | M    | Complete |
| 7.1 | `/` homepage hero — full-bleed illuminated-manuscript photograph                         | 7 - Page Surfaces              | L    | Complete |
| 7.2 | `/episodes` + `/episodes/[slug]` editorial manuscript treatment                          | 7 - Page Surfaces              | M    | Complete |
| 7.3 | `/cases` + `/cases/[slug]` editorial + spec-sheet sidebar                                | 7 - Page Surfaces              | M    | Complete |
| 7.4 | `/build-log/*` Bone surfaces, Parchment inner panels                                     | 7 - Page Surfaces              | L    | Complete |
| 7.5 | Storefront — `/products`, `/cohorts`, `/products/account` editorial reskin               | 7 - Page Surfaces              | M    | Complete |
| 7.6 | `/about`, `/login`, `/login/verify`, `not-found`, `error` quiet marble                   | 7 - Page Surfaces              | M    | Complete |
| 8.1 | Logo SVG suite + favicon set                                                             | 8 - Asset Pipeline             | M    | Complete |
| 8.2 | Dynamic `opengraph-image.tsx` root + per-route (episodes, cases)                         | 8 - Asset Pipeline             | L    | Complete |
| 8.3 | Dev-only `/thumb-preview` route for YouTube thumbnail capture                            | 8 - Asset Pipeline             | L    | Complete |
| 8.4 | `docs/design-system.md` finalize (tokens, fonts, asset paths, forbidden list)  | 8 - Asset Pipeline             | S    | Complete |
| 9.1 | Mobile-first legibility tests (320×180 og, 1280×720 thumb, 360×640 viewport)             | 9 - A11y + Polish              | M    | Complete |
| 9.2 | WCAG contrast guard sentinel                                                             | 9 - A11y + Polish              | M    | Planned |
| 9.3 | Reduce-motion / forced-colors / 200% zoom behavior                                       | 9 - A11y + Polish              | M    | Planned |
| 9.4 | Final sweep — lint / build / test / Lighthouse / manual page walk                        | 9 - A11y + Polish              | S    | Planned |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

## Dependency Graph

```
Phase 1: Foundation Tokens (1.1, 1.2, 1.3)
│   1.1, 1.2, 1.3 parallel — tokens are pure additive CSS, doc is independent
│
v
Phase 2: Typography (2.1 → 2.2 → 2.4 ; 2.3 parallel after 2.1)
│   2.1 must land before 2.2/2.3/2.4 (utilities depend on the new font vars)
│
v
Phase 3: Material Language (3.1, 3.2, 3.3 parallel)
│   surface + brushstroke + sentinel are independent
│
v
Phase 4: Logo + Chrome (4.1 → 4.2, 4.3, 4.4 parallel after 4.1)
│   Logo blocks Header+Footer consumption; layout primitives independent
│
v
Phase 5: Component Primitives (5.1 → 5.2, 5.3, 5.4 parallel after 5.1)
│   Button primitive feeds the others
│
v
Phase 6: Card Primitives (6.1 → 6.2, 6.3, 6.4 parallel after 6.1)
│   EditorialCard feeds the three card refactors
│
v
Phase 7: Page Surfaces (7.1 ... 7.6 all parallel)
│   each page is independent; depends on Phases 3–6 only
│
v
Phase 8: Asset Pipeline (8.1 → 8.2, 8.3 parallel after 8.1 ; 8.4 last)
│   logo SVG feeds og:image + thumb-preview ; design-system doc finalizes
│
v
Phase 9: A11y + Polish (9.1, 9.2, 9.3 parallel → 9.4)
    9.4 is the final sweep gate; the other three are independent tests
```

Phases 1–6 are the foundation chain. Phase 7 reskins every public page in
parallel after the primitive set is locked. Phase 8 ships the offsite brand
surfaces (logo, og:image, thumb-preview). Phase 9 is the regression-guard
+ polish pass.

## New Content Types Required

None. This job is chrome and assets. Content schemas (`Episode`,
`SourceMaterial`, `Case`, `ContentTier`, `ContentPillar`) are unchanged.

## Critical Files Reference

| File | Role |
|------|------|
| `src/app/globals.css` | MODIFY — palette swap, spacing scale, type scale, prose retrofit, dark-mode removal |
| `src/app/layout.tsx` | MODIFY — replace `Geist`/`Geist_Mono` with `Cinzel`/`Inter`/`JetBrains_Mono` |
| `src/components/brand/Logo.tsx` | NEW — Cinzel "FABLED" + JetBrains `{10x}` lockup |
| `src/components/brand/Marble.tsx`, `Parchment.tsx`, `Bone.tsx`, `Shadow.tsx` | NEW — surface primitives |
| `src/components/brand/BrushstrokeSeam.tsx` | NEW — painted-edge SVG mask + texture overlay |
| `src/components/brand/HeroBackdrop.tsx` | NEW — mask-gradient cream overlay for the homepage hero photograph (sentinel-exempt mask, like BrushstrokeSeam) |
| `src/components/brand/DropAccent.tsx` | NEW — oversized Oxblood end-of-headline punctuation |
| `src/components/brand/Button.tsx` | NEW — Ink-fill primitive replacing ad-hoc button classes |
| `src/components/brand/EditorialCard.tsx` | NEW — three-level hierarchy card; base for JobCard / ProductCard / CohortCard |
| `src/components/brand/Section.tsx`, `SectionDivider.tsx` | NEW — vertical rhythm + brushstroke divider |
| `src/components/site/Header.tsx` | MODIFY — Marble surface, Oxblood active, all-caps Inter nav |
| `src/components/site/Footer.tsx` | MODIFY — Parchment surface, Verdigris LLL link |
| `src/components/site/Container.tsx` | MODIFY — tighter widths (prose vs layout) |
| `src/components/build-log/JobCard.tsx` | MODIFY — refactor onto `<EditorialCard>` |
| `src/components/build-log/StatusBadge.tsx` | MODIFY — Oxblood/Verdigris/Ink/Bone variants |
| `src/components/capture/EmailCapture.tsx` | MODIFY — Bone surface, Ink button, Verdigris success |
| `src/components/products/ProductCard.tsx` | MODIFY — refactor onto `<EditorialCard>` |
| `src/components/products/BuyButton.tsx` | MODIFY — adopt `<Button>` primitive |
| `src/components/cohorts/CohortCard.tsx`, `CohortDetailHero.tsx`, `CohortStatusBadge.tsx` | MODIFY — editorial reskin |
| `src/components/auth/SignInForm.tsx` | MODIFY — Button + form chrome consistent |
| `src/components/account/SignOutButton.tsx` | MODIFY — Button primitive |
| `src/app/page.tsx` | MODIFY — full-bleed illuminated-manuscript hero composition + below-fold restructure onto EditorialCard / SectionDivider / Bone |
| `src/app/episodes/page.tsx`, `episodes/[slug]/page.tsx` | MODIFY — EditorialCard grid + manuscript detail |
| `src/app/cases/page.tsx`, `cases/[slug]/page.tsx` | MODIFY — editorial + spec-sheet sidebar |
| `src/app/build-log/page.tsx`, `build-log/jobs/[slug]/page.tsx`, `build-log/jobs/[slug]/[phase]/page.tsx`, `build-log/status/page.tsx` | MODIFY — Bone + Parchment surfaces |
| `src/app/products/page.tsx`, `products/[slug]/page.tsx`, `products/account/page.tsx`, `products/account/purchases/[id]/page.tsx` | MODIFY — storefront reskin |
| `src/app/cohorts/page.tsx`, `cohorts/[slug]/page.tsx` | MODIFY — cohort reskin |
| `src/app/about/page.tsx`, `login/page.tsx`, `login/verify/page.tsx` | MODIFY — quiet marble |
| `src/app/not-found.tsx`, `error.tsx` | NEW or MODIFY — brand-consistent error pages |
| `src/app/opengraph-image.tsx` | NEW — root og:image, brushstroke-seam composition |
| `src/app/episodes/[slug]/opengraph-image.tsx` | NEW — per-episode og:image |
| `src/app/cases/[slug]/opengraph-image.tsx` | NEW — per-case og:image |
| `src/app/(internal)/thumb-preview/page.tsx` | NEW — dev-only 1280×720 YouTube thumbnail composer |
| `public/logo.svg`, `public/favicon.svg`, `public/apple-touch-icon.png`, `public/android-chrome-192.png`, `public/android-chrome-512.png` | NEW — logo + favicon suite |
| `public/fonts/Cinzel-Black.ttf`, `public/fonts/Inter-{Regular,SemiBold,Bold}.ttf` | NEW — local font files for `ImageResponse` (next/font can't pipe into `next/og`) |
| `docs/brand-identity.md` | MODIFY — rewrite for the editorial direction |
| `docs/design-system.md` | NEW — canonical tokens, fonts, contrast pairs, forbidden patterns |
| `src/__tests__/brand/forbidden-patterns.test.ts` | NEW — Vitest sentinel banning gradients / UI shadows / pure primaries |
| `src/__tests__/brand/contrast.test.ts` | NEW — WCAG contrast guard on the token table |
| `src/__tests__/brand/legibility.test.ts` | NEW — mobile-first legibility snapshots |

## Verification Plan

| Phase | Verification |
|-------|--------------|
| 1     | `npm run lint` clean. `npm run build` clean. `globals.css` shows the new palette + spacing scale + no dark-mode block. `docs/design-system.md` exists and links from `docs/brand-identity.md`. Visual dev-server check at `/` — pages render in marble + ink even though components haven't been reskinned yet (placeholder palette removed). |
| 2     | New fonts load in dev (network panel shows Cinzel / Inter / JetBrains Mono). `--font-display`, `--font-body`, `--font-mono` resolve to the new families. Type-scale utilities applied in a smoke test. `<DropAccent>` renders. `.build-log-prose` h2/h3/code/blockquote pick up Cinzel + Oxblood drop cap + Shadow code surfaces on `/build-log/jobs/website-foundation`. |
| 3     | `<Marble>` / `<Parchment>` / `<Bone>` / `<Shadow>` render with the right surface tokens. `<BrushstrokeSeam>` renders in a sandbox route with feathered edge. `npm test` — forbidden-pattern sentinel green (no gradients / UI shadows / pure primaries in `src/`). |
| 4     | `<Logo>` renders in Header at all sizes; `public/logo.svg` reachable. Header active-state visible (Oxblood on current route). Footer LLL link Verdigris-on-Bone. `<Section>` / `<SectionDivider>` render. Container widths feel editorial (max-w-prose for text-heavy pages). |
| 5     | `<Button>` variants render in a sandbox. `<StatusBadge>` variants restyled (visual check on `/build-log`). `EmailCapture` submits cleanly with the new look; success state shows Verdigris check. Auth + Buy buttons consistent. |
| 6     | `<EditorialCard>` enforces three-level hierarchy (accent tag → Cinzel headline → Inter subtitle). `JobCard`, `ProductCard`, `CohortCard` all refactor onto it without behavior regression. `CohortDetailHero` + `CohortStatusBadge` brand-consistent. |
| 7     | Every page in the route inventory renders against the new system. Homepage hero shows the full-bleed illuminated-manuscript photograph with the Cinzel headline + Inter subtitle + EmailCapture stack legible over a left-protective cream overlay. `/build-log` Bone surfaces with Parchment inner panels. `/about`, `/login`, `not-found`, `error` quiet marble (no brushstroke). |
| 8     | `og-image` API: visit `/opengraph-image`, `/episodes/<slug>/opengraph-image`, `/cases/<slug>/opengraph-image` — 1200×630 brand-consistent PNGs. `/thumb-preview?title=...&accent=?` renders 1280×720 thumbnail in dev only (404 in prod). `docs/design-system.md` fully populated with final values. |
| 9     | `npm test` — legibility + contrast + forbidden-pattern sentinels all green. Lighthouse a11y ≥ 95, perf ≥ 90 on `/`, `/episodes`, `/build-log`. Reduce-motion disables brushstroke texture. forced-colors mode legible. 320px reflow + 200% zoom both clean. |
| All   | `npm run lint` clean. `npx tsc --noEmit` clean. `npm test` green. `npm run build` clean (standalone output). Manual page walk: `/`, `/episodes`, `/episodes/<slug>`, `/cases`, `/cases/<slug>`, `/build-log`, `/build-log/jobs/website-foundation`, `/products`, `/products/<slug>`, `/cohorts`, `/cohorts/<slug>`, `/about`, `/login`, `/login/verify`, `/products/account`, `/sitemap.xml`, `/robots.txt`. |

## Phase Documentation

- [Phase 1: Foundation Tokens](./phase-1-foundation-tokens.md)
- [Phase 2: Typography](./phase-2-typography.md)
- [Phase 3: Material Language](./phase-3-material-language.md)
- [Phase 4: Logo + Chrome](./phase-4-logo-chrome.md)
- [Phase 5: Component Primitives](./phase-5-primitives.md)
- [Phase 6: Card Primitives](./phase-6-cards.md)
- [Phase 7: Page Surfaces](./phase-7-pages.md)
- [Phase 8: Asset Pipeline](./phase-8-asset-pipeline.md)
- [Phase 9: A11y + Polish](./phase-9-a11y-polish.md)

## Dependencies to Add

None. The brand stack uses `next/font/google` (Cinzel, Inter, JetBrains Mono
all available) and Tailwind 4 already in place. Local TTFs in `public/fonts/`
are required for `next/og`'s `ImageResponse` (Phase 8.2) — bytes only, not an
npm dependency.

`next/og` ships with Next.js 16 (no separate install).

## Open Items (Resolve During Implementation)

- **Photo / texture for hero** — RESOLVED. `public/hero/floatbg.png`
  (illuminated capital flanked by source-code fragments on aged paper)
  landed alongside the initial 7.1 hero spike and is the canonical hero
  background. See Phase 7.1 for the full-bleed composition that replaced
  the earlier brushstroke-seam draft.
- **Logo SVG master** — Phase 4.1 ships the lockup as inline JSX rendered to
  `public/logo.svg`. If the user has a hand-illustrated wordmark, swap it in;
  otherwise the type-set Cinzel + JetBrains version is canonical.
- **Verdigris allocation** — the brand spec reserves Verdigris for
  "completion / success states." Phase 5.2 uses it for the `complete` status
  badge; Phase 4.3 uses it for the LLL sister-project link. No other
  Verdigris usage in this job.
- **Section dividers cadence** — Phase 4.4 ships `<SectionDivider>` but only
  the homepage uses it (per locked decision). If a page surface in Phase 7
  reads "too long without breath," add a single divider during that section's
  implementation, not in the primitive's API.

## Section IDs for TDD Workflow

Each feature maps to one section ID used by `/discovery`, `/red`, `/green`, `/refactor`.

| Section ID | Feature |
|------------|---------|
| `styling-overhaul-1.1` | Palette swap + contrast pairs + dark-mode removal |
| `styling-overhaul-1.2` | Spacing + radius scale |
| `styling-overhaul-1.3` | Brand doc rewrite + design-system doc |
| `styling-overhaul-2.1` | Font loading swap |
| `styling-overhaul-2.2` | Type scale utilities |
| `styling-overhaul-2.3` | DropAccent primitive |
| `styling-overhaul-2.4` | build-log prose retrofit |
| `styling-overhaul-3.1` | Surface primitives |
| `styling-overhaul-3.2` | BrushstrokeSeam |
| `styling-overhaul-3.3` | Forbidden-pattern sentinel |
| `styling-overhaul-4.1` | Logo lockup + SVG |
| `styling-overhaul-4.2` | Header restyle |
| `styling-overhaul-4.3` | Footer restyle |
| `styling-overhaul-4.4` | Layout primitives |
| `styling-overhaul-5.1` | Button primitive |
| `styling-overhaul-5.2` | StatusBadge variants |
| `styling-overhaul-5.3` | EmailCapture reskin |
| `styling-overhaul-5.4` | Auth + storefront button consistency |
| `styling-overhaul-6.1` | EditorialCard primitive |
| `styling-overhaul-6.2` | JobCard refactor |
| `styling-overhaul-6.3` | ProductCard refactor |
| `styling-overhaul-6.4` | CohortCard + hero + status reskin |
| `styling-overhaul-7.1` | Homepage hero |
| `styling-overhaul-7.2` | Episodes index + detail |
| `styling-overhaul-7.3` | Cases index + detail |
| `styling-overhaul-7.4` | Build-log surfaces |
| `styling-overhaul-7.5` | Storefront reskin |
| `styling-overhaul-7.6` | About + auth + error |
| `styling-overhaul-8.1` | Logo SVG suite |
| `styling-overhaul-8.2` | Dynamic og:images |
| `styling-overhaul-8.3` | Thumb-preview route |
| `styling-overhaul-8.4` | Design-system doc finalize |
| `styling-overhaul-9.1` | Mobile-first legibility |
| `styling-overhaul-9.2` | WCAG contrast guard |
| `styling-overhaul-9.3` | Reduce-motion / forced-colors / zoom |
| `styling-overhaul-9.4` | Final sweep |

These IDs are consumed by `pipeline/active/session.yaml` and used as
directory names under `pipeline/active/`.
