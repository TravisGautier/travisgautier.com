# testimonials-results — Implementation Plan

**Alias:** `tr` — invoke as `/pipeline tr <section>` or `/discovery tr <section>`. Section IDs in YAML + commits still use the canonical slug `testimonials-results`.

## Context

`/results` is the channel's public social-proof surface: a results wall populated by verified client quotes, optional outcome metrics, and a counts-only aggregate strip. It's the page the homepage and `/about` link into when a viewer asks "does this methodology actually ship anything?" This job is #6 in `docs/future-jobs.md` and implements the "Results wall / testimonials" bullet under Phase 3 (Community & Social Proof) of `docs/website-implementation-plan.md`.

The scope is a new `Testimonial` content type + loader + a single `/results` page + two reusable components (`<Testimonial>`, `<ResultsWall>`) + a small `<TestimonialMetrics>` strip, plus integration embeds on the homepage and `/about`. Submission is **fully editorial** — maintainers and future agents hand-author MDX files under `src/content/testimonials/`. There is no public form, no video embeds, no star-rating aggregation. That decision keeps this job at M/L size by cutting every surface except the single results wall and the two high-traffic embed points.

This job depends entirely on `website-foundation` (alias `wf`) having shipped: the MDX pipeline, the brand design tokens, the site shell, the `<Container>` primitive, the content loader utility, the Zod validators module, the homepage scaffold, and the `/about` page all come from that job. No new npm packages are needed.

Out of scope (explicit non-goals): public submission form, star-rating aggregation, video testimonials (schema leaves room via an unused `videoUrl?` field but no v1 UI renders it), per-testimonial detail routes, `/products` embed (storefront doesn't exist yet — that's `storefront-auth`'s job), moderation queues, testimonial-specific email capture.

## What Already Exists

### Already in the repo today (2026-04-11)
- **Next.js 16 App Router scaffold** — React 19.2.4, Tailwind 4, strict TS, `@/` → `src/`. (`package.json`, `tsconfig.json`, `next.config.ts`)
- **Content schemas** — `src/content/schemas/{content-tier,content-pillar,episode,source-material,index}.ts`. No `Testimonial` type yet.
- **Test infra** — Vitest 2.1.8 + jsdom, `@testing-library/jest-dom/vitest` loaded via `src/__tests__/setup.ts`, MSW 2.7 installed, coverage thresholds 70/80/80/80 (`vitest.config.ts`).
- **Source docs** — `docs/website-implementation-plan.md`, `docs/brand-identity.md`, `docs/future-jobs.md`, `AGENTS.md` (Next.js 16 local-docs reminder).

### Delivered by `website-foundation` (prerequisite — NOT YET SHIPPED when this plan is written)
This job reuses these `wf` outputs and cannot start its TDD cycles until they exist.

- **MDX pipeline** (`next.config.ts` wrapped with `createMDX`, root `mdx-components.tsx`, `pageExtensions` extended — from wf 2.1). `.mdx` files under `src/content/` are imported as modules with a typed `frontmatter` export.
- **Content loader utility** (`src/lib/content/loader.ts` from wf 2.2) — generic filesystem discovery + dynamic import + Zod validation. This job's `src/lib/content/testimonials.ts` follows the same shape as `src/lib/content/episodes.ts` and `src/lib/content/cases.ts`.
- **Zod validators module** (`src/content/schemas/validators.ts` from wf 1.2) — `EpisodeSchema`, `SourceMaterialSchema`, `CaseSchema`. `TestimonialSchema` is added here following the same export style.
- **Brand design tokens** (`src/app/globals.css` from wf 1.3) — `--color-{ink,parchment,ember,steel,mist,signal}` + semantic aliases. Tailwind class surface: `bg-accent`, `text-muted`, `border-mist`, `text-link`, `bg-parchment`, `font-display`, etc.
- **Site shell** (`src/components/site/{Header,Footer}.tsx` + `src/app/layout.tsx` from wf 1.4) — mounted root layout with `metadataBase` set to `https://travisgautier.com`.
- **`<Container>` layout primitive** (`src/components/site/Container.tsx` from wf 1.4) — `mx-auto w-full max-w-5xl px-6 md:px-10`.
- **Homepage** (`src/app/page.tsx` from wf 3.1) — Phase 3.1 of this job modifies it to embed a compact testimonial strip.
- **`/about` page** (`src/app/about/page.tsx` from wf 3.6) — Phase 3.1 modifies it to embed a full results wall section.
- **Dynamic sitemap** (`src/app/sitemap.ts` from wf 4.4) — Phase 3.1 modifies it to append `/results`.
- **Pattern: `getAllX()` / `getXBySlug()`** (`src/lib/content/episodes.ts`, `src/lib/content/cases.ts` from wf 2.2) — this job adds `getAllTestimonials()` + `getTestimonialBySlug()` + `getTestimonialCounts()` to the same directory.
- **Pattern: JSON-LD via `dangerouslySetInnerHTML`** (wf 4.3) — the `/results` page structured data follows the same inline script-tag approach.
- **`public/llms.txt`** — already live from wf 4.4; Phase 3.1 adds a `/results` mention in the sitemap reference.
- **Pattern: `Object.freeze` on cached content arrays** (wf 2.2) — testimonials loader freezes its return array.

## Feature Overview (5 Features, 3 Phases)

| #   | Feature                                                                                                                                  | Phase                       | Size | Status  |
|-----|------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|------|---------|
| 1.1 | `Testimonial` + `TestimonialAuthor` schema + `TestimonialSchema` Zod validator                                                           | 1 - Foundation              | M    | Planned |
| 1.2 | Testimonial loader (`getAllTestimonials`, `getTestimonialBySlug`, `getTestimonialCounts`) + 3 seed MDX files + `docs/testimonial-authoring.md` | 1 - Foundation              | M    | Planned |
| 2.1 | `<Testimonial>` (compact + full) + `<ResultsWall>` + `<TestimonialMetrics>` components                                                   | 2 - Page + Components       | L    | Planned |
| 2.2 | `/results` page — metrics strip + results wall + footer CTA                                                                              | 2 - Page + Components       | M    | Planned |
| 3.1 | Homepage + `/about` embeds + `/results` SEO/JSON-LD + sitemap + header nav + llms.txt + a11y/Lighthouse sweep                            | 3 - Integration + Polish    | L    | Planned |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

Total rough job size: **M/L** — structurally similar to `community-showcase` (L) but smaller because there's no `/results/[slug]` detail route, no hero image per item, no gallery, and the content model has ~8 fields instead of ~14. Matches the "M" estimate in `docs/future-jobs.md` entry #6.

## Dependency Graph

```
Phase 1: Foundation
│
│   1.1 → 1.2                 ← strictly sequential
│                               (schema → loader + seed content + authoring guide)
│
v
Phase 2: Page + Components
│
│   2.1 → 2.2                 ← strictly sequential
│                               (card + wall + metrics → page)
│
v
Phase 3: Integration + Polish
│
    3.1                       ← single section after Phase 2 ships
                                (embeds + SEO + sitemap + nav + a11y sweep)
```

Hard dependencies:
- **1.1 → 1.2** — The loader imports `Testimonial` type and `TestimonialSchema` validator, and the seed content is round-tripped through the loader in 1.2 integration tests.
- **Phase 1 → Phase 2** — Every component and page in Phase 2 consumes the loader or the `Testimonial` type.
- **2.1 → 2.2** — The `/results` page embeds `<ResultsWall>` and `<TestimonialMetrics>`. Without them, the page has nothing to render.
- **Phase 2 → 3.1** — Homepage + `/about` embeds consume `<ResultsWall>` + the loader, and the SEO/sitemap/nav polish points at the `/results` route built in 2.2.

## New Content Types Required

| Type                 | Phase | Purpose                                                                                      |
|----------------------|-------|----------------------------------------------------------------------------------------------|
| `Testimonial`        | 1     | Client quote record — quote, author, optional metric, verified/featured flags, date          |
| `TestimonialAuthor`  | 1     | Sub-type on `Testimonial` — name (required), title, company, avatarUrl (all optional)        |

Both types live in `src/content/schemas/testimonial.ts`. `TestimonialAuthor` is exported but not re-exported as a top-level type elsewhere — it only appears nested on `Testimonial`. `TestimonialSchema` and `TestimonialAuthorSchema` are added to `src/content/schemas/validators.ts` alongside the existing `EpisodeSchema` and `CaseSchema` per the `wf` 1.2 convention.

## Critical Files Reference

| File                                                          | Role                                                                           |
|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| `src/content/schemas/testimonial.ts`                          | NEW — `Testimonial`, `TestimonialAuthor` interfaces                            |
| `src/content/schemas/index.ts`                                | MODIFY — `export * from './testimonial'`                                        |
| `src/content/schemas/validators.ts`                           | MODIFY — add `TestimonialSchema` + `TestimonialAuthorSchema` (from wf 1.2)     |
| `src/content/schemas/__tests__/validators.test.ts`            | MODIFY — add `TestimonialSchema` test cases                                    |
| `src/content/testimonials/jane-park-agency.mdx`               | NEW — seed entry 1 (featured + verified + metric + MDX body)                   |
| `src/content/testimonials/marcus-ops-team.mdx`                | NEW — seed entry 2 (verified + metric, no MDX body)                            |
| `src/content/testimonials/rivera-studio.mdx`                  | NEW — seed entry 3 (unverified, no metric, no MDX body)                        |
| `src/lib/content/testimonials.ts`                             | NEW — `getAllTestimonials`, `getTestimonialBySlug`, `getTestimonialCounts`     |
| `src/lib/content/__tests__/testimonials.test.ts`              | NEW                                                                            |
| `src/lib/content/__tests__/testimonials.integration.test.ts`  | NEW — real-filesystem round-trip (may fold into `testimonials.test.ts`)        |
| `src/lib/content/loader.ts`                                   | REFERENCE (wf 2.2) — generic filesystem-discovery + Zod-validation utility     |
| `src/lib/content/episodes.ts`                                 | REFERENCE (wf 2.2) — pattern for `getAllX` / `getXBySlug` + cache              |
| `src/lib/content/cases.ts`                                    | REFERENCE (wf 2.2) — same                                                      |
| `docs/testimonial-authoring.md`                               | NEW — internal authoring guide (frontmatter shape, metric conventions)         |
| `src/components/testimonials/Testimonial.tsx`                 | NEW — compact + full variants                                                  |
| `src/components/testimonials/ResultsWall.tsx`                 | NEW — responsive grid, featured promotion, optional `limit`                    |
| `src/components/testimonials/TestimonialMetrics.tsx`          | NEW — counts-only stats strip                                                  |
| `src/components/testimonials/__tests__/Testimonial.test.tsx`  | NEW                                                                            |
| `src/components/testimonials/__tests__/ResultsWall.test.tsx`  | NEW                                                                            |
| `src/components/testimonials/__tests__/TestimonialMetrics.test.tsx` | NEW                                                                      |
| `src/app/results/page.tsx`                                    | NEW — single page, RSC, reads loader + counts                                  |
| `src/app/results/__tests__/page.test.tsx`                     | NEW                                                                            |
| `src/app/page.tsx`                                            | MODIFY (3.1) — embed compact strip below latest episode                        |
| `src/app/about/page.tsx`                                      | MODIFY (3.1) — embed full wall section above LLL callout                       |
| `src/app/sitemap.ts`                                          | MODIFY (3.2) — append `/results`                                               |
| `src/components/site/Header.tsx`                              | MODIFY (3.2) — add "Results" nav link + active-state on `/results`             |
| `public/llms.txt`                                             | MODIFY (3.2) — mention `/results` in the sitemap reference                     |
| `src/components/site/Container.tsx`                           | REFERENCE (wf 1.4) — layout wrapper on `/results`                              |
| `src/app/globals.css`                                         | REFERENCE — brand tokens from wf 1.3                                           |

## Verification Plan

| Phase | Verification |
|-------|--------------|
| 1     | `npm run lint` clean. `npm test` — `TestimonialSchema` accepts a valid fixture, rejects bad slug, bad ISO date, too-short/too-long quote, missing author name, invalid avatar URL, non-boolean verified/featured, non-array `lllEntryUrls`. `getAllTestimonials()` returns the seed entries sorted featured-first then date-desc with slug tie-break. `getTestimonialBySlug('jane-park-agency')` returns the featured seed; `getTestimonialBySlug('bogus')` returns `undefined`. `getTestimonialCounts()` against the seed returns `{ total: 3, verified: 2, featured: 1 }`. Empty-directory guard throws with a message containing `src/content/testimonials`. Returned arrays are `Object.isFrozen === true`. `npm run build` clean. |
| 2     | `<Testimonial variant="compact">` renders quote + author name + title/company and omits metric/verified chip/MDX body, verified against RTL queries. `<Testimonial variant="full">` includes metric (when present), verified chip (when `verified: true`), and MDX body (when present). Missing-avatar fallback renders initials in a brand-colored circle. `<ResultsWall>` renders the correct number of cards with and without `limit`; featured entries get `md:col-span-2`. `<TestimonialMetrics>` renders the three counts. `/results` renders under `npm run dev` showing the metrics strip, the full results wall, and the footer CTA. `npm run build` clean. |
| 3     | Homepage (`/`) shows a 3-card compact testimonial strip below the latest-episode section. `/about` shows a 4-card full wall section above the LLL callout. `view-source:` on `/results` shows unique `<title>`, `<meta description>`, OG image + Twitter card tags, and an inline `<script type="application/ld+json">` block whose payload is a valid `CollectionPage` containing `Review` items (validates at https://validator.schema.org). `/sitemap.xml` lists `/results`. Header nav shows a "Results" link with active-state highlighting when the path starts with `/results`. `public/llms.txt` mentions `/results`. Lighthouse local run on `/` and `/results`: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90. Keyboard-only walkthrough: tab from header → "Results" → through the wall → out through the footer without getting stuck. |
| All   | `npm run lint` clean. `npm test` green + coverage still ≥ thresholds (70 branches / 80 functions / 80 lines / 80 statements). `npm run build` clean. Manual smoke (against `npm run start`): `/`, `/results`, `/about`, `/sitemap.xml`, `/llms.txt`. Header nav supports `/ → /results → /about → /` loop with active-state highlighting correct at each step. |

## Phase Documentation

- [Phase 1: Foundation](./phase-1-foundation.md) — `Testimonial`/`TestimonialAuthor` schema, content loader + counts, seed content + authoring guide
- [Phase 2: Page + Components](./phase-2-page-and-components.md) — `<Testimonial>`, `<ResultsWall>`, `<TestimonialMetrics>`, `/results`
- [Phase 3: Integration + Polish](./phase-3-integration-polish.md) — homepage + `/about` embeds, SEO + JSON-LD + sitemap + nav + llms.txt + a11y sweep

## Dependencies to Add

**None.** Every dependency this job needs (`zod`, `@next/mdx`, React 19, Tailwind 4, Vitest, MSW, `@testing-library/*`) is already installed by the scaffold or by `website-foundation`.

## Open Items (Resolve During Implementation)

- **Avatar fallback** — when a testimonial has no `author.avatarUrl`, Phase 2.1 renders initials in a brand-colored circle. Decide initial count (1 vs 2) and font sizing during `/green 2.1`; default is 2-character initials for names with a space and single-character for single names.
- **Featured promotion on `/results`** — Phase 2.1 defaults to giving featured entries a `md:col-span-2` in the wall. Toggle this in the page if the visual hierarchy looks wrong during the a11y sweep.
- **Metrics strip minimum** — Phase 2.1 ships static label strings ("verified clients", "total quotes", "featured"). If the numbers feel anemic at launch with only the 3 seed entries, the strip can be hidden behind a `total >= 5` guard added in the page component — a one-line change. Default: show always.
- **Homepage strip placement** — Phase 3.1 inserts below the latest-episode section. If `wf` 3.1 ships with a different homepage layout, the insertion point is a sibling of whatever anchors the top-of-fold content. Decide exact placement during `/green 3.1` after reading the final homepage component.
- **Seed copy** — 3 seed testimonials ship with plausible placeholder copy (Jane Park / Parker Studio, Marcus / ops team, Rivera Studio). Real client quotes replace them during normal content authoring, not during this job.
- **Anchor deep-links** — each testimonial card wrapper on `/results` gets an `id="{slug}"` so future pages can deep-link to a specific quote (`/results#jane-park-agency`). Not advertised in v1 but costs nothing to ship and unblocks integrations from `storefront-auth` or `community-showcase` later.
- **Empty-directory handling** — Phase 1.2 treats a 1- or 2-entry directory as normal and silent. A literal zero-entry state is a hard `throw` at module load, per the `community-showcase` 1.2 pattern, preventing an empty `/results` page from shipping accidentally.

## Section IDs for TDD Workflow

Each feature maps to one section ID used by `/discovery`, `/red`, `/green`, `/refactor`. Section IDs use the canonical slug `testimonials-results`, not the alias `tr`.

| Section ID                     | Feature                                                                                       |
|--------------------------------|-----------------------------------------------------------------------------------------------|
| `testimonials-results-1.1`     | Testimonial schema + Zod validator                                                            |
| `testimonials-results-1.2`     | Testimonial loader + seed content + authoring guide                                           |
| `testimonials-results-2.1`     | Testimonial card + wall + metrics components                                                  |
| `testimonials-results-2.2`     | `/results` page                                                                               |
| `testimonials-results-3.1`     | Homepage + `/about` embeds + SEO + JSON-LD + sitemap + nav + llms.txt + a11y sweep            |

These IDs are consumed by `pipeline/active/session.yaml` and used as directory names under `pipeline/active/`.
