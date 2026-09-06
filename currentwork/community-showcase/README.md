# community-showcase — Implementation Plan

**Alias:** `cs` — invoke as `/pipeline cs <section>` or `/discovery cs <section>`. Section IDs in YAML + commits still use the canonical slug `community-showcase`.

## Context

`/showcase` is the channel's "Built with Travis Gautier" gallery: a public, SEO-
indexed surface where community projects built with the Travis Gautier methodology
get their own page. It's the brand's social-proof layer, pointing viewers at
real work shipped by people outside the core team. This job is #5 in
`docs/future-jobs.md` and implements the "Built with Travis Gautier community
showcase" bullet from Phase 3 of `docs/website-implementation-plan.md`.

The scope is a new `Showcase` content type + loader + two pages (`/showcase`
index and `/showcase/[slug]` detail) + SEO polish. Submission is **fully
editorial** — maintainers and future agents hand-author MDX files under
`src/content/showcase/`. There is no public form, no GitHub PR intake bot, and
no moderation queue. That decision cuts the whole "submission flow" feature
and makes this job structurally identical to how `website-foundation` handles
`/episodes` and `/cases`.

This job depends entirely on `website-foundation` (alias `wf`) having shipped:
the MDX pipeline, the brand design tokens, the site shell, the `<Container>`
primitive, the `<LllCrosslinks>` component, the content loader pattern, the
Zod validator conventions, and the dynamic sitemap all come from that job. No
new npm packages are needed.

Out of scope (explicit non-goals): user accounts for submitters, comments /
upvotes / reactions, tagging / filtering / faceted search, public submission
forms, moderation queues, a related-entries engine (related episodes/cases are
hand-linked via frontmatter), video embeds, showcase-specific email capture.

## What Already Exists

### Already in the repo today (2026-04-11)
- **Next.js 16 App Router scaffold** — React 19.2.4, Tailwind 4, strict TS, `@/` → `src/`. (`package.json`, `tsconfig.json`, `next.config.ts`)
- **Content schemas** — `src/content/schemas/{content-tier,content-pillar,episode,source-material,index}.ts`. No `Showcase` type yet.
- **Test infra** — Vitest 2.1.8 + jsdom, `@testing-library/jest-dom/vitest` loaded via `src/__tests__/setup.ts`, MSW 2.7 installed, coverage thresholds 70/80/80/80 (`vitest.config.ts`)
- **Source docs** — `docs/website-implementation-plan.md`, `docs/brand-identity.md`, `docs/future-jobs.md`, `AGENTS.md` (Next.js 16 local-docs reminder)

### Delivered by `website-foundation` (prerequisite — NOT YET SHIPPED when this plan is written)
This job reuses these `wf` outputs and cannot start its TDD cycles until they exist.

- **MDX pipeline** (`next.config.ts` wrapped with `createMDX`, root `mdx-components.tsx`, `pageExtensions` extended — from wf 2.1). `.mdx` files under `src/content/` are imported as modules with a typed `frontmatter` export.
- **Content loader utility** (`src/lib/content/loader.ts` from wf 2.2) — generic filesystem discovery + dynamic import + Zod validation. This job's `src/lib/content/showcase.ts` follows the exact same shape as `src/lib/content/episodes.ts` and `src/lib/content/cases.ts`.
- **Zod validators** (`src/content/schemas/validators.ts` from wf 1.2) — `EpisodeSchema`, `SourceMaterialSchema`, `CaseSchema`. `ShowcaseSchema` is added here following the same export style.
- **Brand design tokens** (`src/app/globals.css` from wf 1.3) — `--color-{ink,parchment,ember,steel,mist,signal}` + semantic aliases `--color-{background,foreground,muted,accent,link}`. Tailwind class surface: `bg-accent`, `text-muted`, `border-mist`, `text-link`, `bg-parchment`, `font-display`, etc.
- **Site shell** (`src/components/site/{Header,Footer}.tsx` + `src/app/layout.tsx` from wf 1.4) — mounted root layout with `metadataBase` set to `https://travisgautier.com`.
- **`<Container>` layout primitive** (`src/components/site/Container.tsx` from wf 1.4) — `mx-auto w-full max-w-5xl px-6 md:px-10`, accepts `className` + `as` prop.
- **`<LllCrosslinks>`** (`src/components/crosslinks/LllCrosslinks.tsx` from wf 4.2) — renders `lllEntryUrls` array as a styled crosslink block. Showcase detail pages embed it directly with the same prop shape Episode + Case use.
- **Dynamic sitemap** (`src/app/sitemap.ts` from wf 4.4) — this job modifies it to append `/showcase` + every showcase slug.
- **Pattern: `getAllX()` / `getXBySlug()`** (`src/lib/content/episodes.ts`, `src/lib/content/cases.ts` from wf 2.2) — this job adds `getAllShowcaseEntries()` + `getShowcaseEntryBySlug()` to the same directory.
- **Pattern: `generateStaticParams` + `dynamicParams = false`** (wf 3.3 + 3.5) — `/showcase/[slug]` follows the same shape so unknown slugs 404 at build time.
- **Pattern: JSON-LD via `dangerouslySetInnerHTML`** (wf 4.3) — detail page structured data follows the same inline script-tag approach.
- **Pattern: `<EmailCapture source="..." />`** (wf 4.1) — not required for showcase pages but available if Phase 2.2 wants a "Want to be featured?" CTA.
- **`public/llms.txt`** — already live from wf 4.4; modified here to reference `/showcase` in the sitemap section.
- **`next/image`** — bundled with Next.js 16, no install step. Hero images and gallery entries use it for responsive serving.

## Feature Overview (5 Features, 3 Phases)

| #   | Feature                                                                                                                         | Phase           | Size | Status  |
|-----|---------------------------------------------------------------------------------------------------------------------------------|-----------------|------|---------|
| 1.1 | `Showcase` + `Builder` schema + `ShowcaseSchema` Zod validator                                                                  | 1 - Foundation  | M    | Planned |
| 1.2 | Content loader (`getAllShowcaseEntries`, `getShowcaseEntryBySlug`) + seed MDX entry + hero image + `docs/showcase-authoring.md` | 1 - Foundation  | M    | Planned |
| 2.1 | `<ShowcaseCard>` component (`variant="hero"`/`"standard"`) + `/showcase` index page (featured hero grid + full list)            | 2 - Pages       | M    | Planned |
| 2.2 | `/showcase/[slug]` detail page — hero, builder, stack, links, MDX body, gallery, crosslinks                                     | 2 - Pages       | L    | Planned |
| 3.1 | Per-page metadata + OpenGraph + Twitter card + `CreativeWork` JSON-LD + sitemap + header nav + `llms.txt` + a11y/perf sweep    | 3 - Polish      | L    | Planned |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

Total rough job size: **L** — comparable to `free-tools` (L), smaller than the
full `website-foundation` (L/XL). The L comes from Feature 2.2 (detail page)
which has the most moving parts (hero image, builder block, links row, stack
pills, gallery, MDX body, LLL crosslinks) sharing one route file.

**Note on consolidation:** This plan was condensed from an original 8-section
decomposition. Old 1.2 + 1.3 → new 1.2 (loader + seed are inseparable — 1.2's
empty-directory guard requires real seed to pass). Old 2.1 + 2.2 → new 2.1
(card has no consumer other than the index page). Old 3.1 + 3.2 → new 3.1
(metadata, sitemap, nav, and Lighthouse all form one shipping-posture pass).
Old 2.3 became new 2.2.

## Dependency Graph

```
Phase 1: Foundation
│
│   1.1 → 1.2                ← strictly sequential
│                              (schema → loader+seed+guide bundled)
│
v
Phase 2: Pages
│
│   2.1 → 2.2                ← sequential
│         (card+index)         (detail page is independent of card)
│
v
Phase 3: Polish
│
    3.1                      ← single bundled polish pass
```

Hard dependencies:
- **1.1 → 1.2** — Loader imports `Showcase` type and `ShowcaseSchema` validator. Seed content is round-tripped through the loader in 1.2's integration tests to prove the pipe works end-to-end.
- **Phase 1 → Phase 2** — Every page in Phase 2 calls `getAllShowcaseEntries()` or `getShowcaseEntryBySlug()`. Without the loader, the pages have nothing to render.
- **2.1 → 2.2** — Soft sequencing only. The detail page (2.2) does not embed `<ShowcaseCard>`; it uses its own subcomponents (`ShowcaseBuilder`, `ShowcaseStack`, `ShowcaseLinks`, `ShowcaseGallery`). 2.2 can ship in parallel with 2.1 in principle, but the README treats them sequentially so test-suite weight lands incrementally.
- **Phase 2 → 3.1** — Sitemap integration needs the detail route to exist so the route can be listed. Nav link works from the moment `/showcase` exists. Per-page metadata is a widening of Phase 2's static `metadata` consts. All polish work bundles into one section in the condensed plan.

## New Content Types Required

| Type       | Phase | Purpose                                                                                         |
|------------|-------|-------------------------------------------------------------------------------------------------|
| `Showcase` | 1     | Community project record — title, summary, builder, stack, hero image, links, LLL crosslinks   |
| `Builder`  | 1     | Sub-type on `Showcase` — name, handle, handleUrl, company, avatarUrl (all optional except name) |

Both types live in `src/content/schemas/showcase.ts`. `Builder` is exported
but not re-exported as a top-level type elsewhere — it only appears nested on
`Showcase`. `ShowcaseSchema` is added to `src/content/schemas/validators.ts`
alongside the existing `EpisodeSchema` and `CaseSchema` per the `wf` 1.2
convention.

## Critical Files Reference

| File                                                       | Role                                                                         |
|------------------------------------------------------------|------------------------------------------------------------------------------|
| `src/content/schemas/showcase.ts`                          | NEW — `Showcase`, `Builder` interfaces + inline TS types                     |
| `src/content/schemas/index.ts`                             | MODIFY — `export * from './showcase'`                                         |
| `src/content/schemas/validators.ts`                        | MODIFY — add `ShowcaseSchema` (from wf 1.2 pattern)                          |
| `src/content/schemas/__tests__/validators.test.ts`         | MODIFY — add ShowcaseSchema test cases                                       |
| `src/content/showcase/party-masters-team.mdx`              | NEW — seed entry (placeholder copy)                                          |
| `public/showcase/party-masters-team/hero.jpg`              | NEW — placeholder hero asset (checked in as 1600×900 stub)                   |
| `src/lib/content/showcase.ts`                              | NEW — `getAllShowcaseEntries()` + `getShowcaseEntryBySlug()`                 |
| `src/lib/content/__tests__/showcase.test.ts`               | NEW                                                                          |
| `src/lib/content/loader.ts`                                | REFERENCE (wf 2.2) — generic filesystem-discovery + Zod-validation utility   |
| `src/lib/content/episodes.ts`                              | REFERENCE (wf 2.2) — pattern for `getAllX` / `getXBySlug`                    |
| `src/lib/content/cases.ts`                                 | REFERENCE (wf 2.2) — same                                                    |
| `docs/showcase-authoring.md`                               | NEW — internal authoring guide (frontmatter shape, image conventions)        |
| `src/components/showcase/ShowcaseCard.tsx`                 | NEW — hero + standard variants                                               |
| `src/components/showcase/ShowcaseBuilder.tsx`              | NEW — builder block subcomponent                                             |
| `src/components/showcase/ShowcaseStack.tsx`                | NEW — stack pill list                                                        |
| `src/components/showcase/ShowcaseLinks.tsx`                | NEW — live/repo/related-episode/related-case link row                        |
| `src/components/showcase/ShowcaseGallery.tsx`              | NEW — secondary-screenshots gallery                                          |
| `src/components/showcase/__tests__/*.test.tsx`             | NEW — one per component                                                      |
| `src/app/showcase/page.tsx`                                | NEW — index page                                                             |
| `src/app/showcase/__tests__/page.test.tsx`                 | NEW                                                                          |
| `src/app/showcase/[slug]/page.tsx`                         | NEW — dynamic detail route, `generateStaticParams`, `generateMetadata`       |
| `src/app/showcase/[slug]/__tests__/page.test.tsx`          | NEW                                                                          |
| `src/components/crosslinks/LllCrosslinks.tsx`              | REFERENCE (wf 4.2) — embedded in detail page                                 |
| `src/components/site/Container.tsx`                        | REFERENCE (wf 1.4) — wrapper on both pages                                   |
| `src/components/site/Header.tsx`                           | MODIFY (3.2) — add `/showcase` nav link                                      |
| `src/app/sitemap.ts`                                       | MODIFY (3.2) — import `getAllShowcaseEntries()` and append routes            |
| `public/llms.txt`                                          | MODIFY (3.2) — mention `/showcase` in the sitemap reference                  |
| `src/app/globals.css`                                      | REFERENCE — brand tokens already defined by wf 1.3                           |

## Verification Plan

| Phase | Verification |
|-------|--------------|
| 1     | `npm run lint` clean. `npm test` — `ShowcaseSchema` accepts a valid fixture, rejects bad slug/missing hero/non-ISO date/non-array stack/missing builder name. `getAllShowcaseEntries()` returns the single seed entry with the correct shape (real-filesystem integration test). `getShowcaseEntryBySlug('party-masters-team')` returns it; `getShowcaseEntryBySlug('bogus')` returns `undefined`. Featured-first sort is deterministic against a fixture list. Empty-directory guard throws against a mocked-empty content dir. `public/showcase/party-masters-team/hero.jpg` resolvable on disk. `docs/showcase-authoring.md` committed. `npm run build` clean. |
| 2     | `/showcase` renders under `npm run dev` with the seed entry visible in the featured hero grid. `<ShowcaseCard variant="hero">` and `<ShowcaseCard variant="standard">` both render correctly in RTL component tests. `/showcase/party-masters-team` renders the hero image, builder block, stack pills, links row, MDX body, LLL crosslinks, and gallery (absent when `gallery` is undefined). `/showcase/bogus` returns a 404. `generateStaticParams` lists the seed slug. `npm run build` succeeds. |
| 3     | `view-source:` on `/showcase` and `/showcase/party-masters-team` shows unique `<title>`, `<meta description>`, OpenGraph `og:image`, Twitter card tags. Detail page contains an inline `<script type="application/ld+json">` block whose payload is a valid `CreativeWork` (validates at https://validator.schema.org). `/sitemap.xml` lists `/showcase` + every showcase detail route. Header nav shows a `/showcase` link with active-state highlighting when the path starts with `/showcase`. `public/llms.txt` mentions `/showcase`. Lighthouse local run on `/showcase` + `/showcase/party-masters-team`: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90. Keyboard-only walkthrough: tab from header into the index grid into a detail page and out through the LLL crosslinks without getting stuck. |
| All   | `npm run lint` clean. `npm test` green + coverage still ≥ thresholds (70/80/80/80). `npm run build` clean. Manual smoke (against `npm run start`): `/`, `/episodes`, `/cases`, `/showcase`, `/showcase/party-masters-team`, `/sitemap.xml`, `/llms.txt`. Header nav supports the full `/ → /showcase → detail → back` loop. |

## Phase Documentation

- [Phase 1: Foundation](./phase-1-foundation.md) — `Showcase`/`Builder` schema (1.1) + content loader bundled with seed content + authoring guide (1.2)
- [Phase 2: Pages](./phase-2-pages.md) — `<ShowcaseCard>` + `/showcase` index page (2.1) + `/showcase/[slug]` detail page (2.2)
- [Phase 3: Polish](./phase-3-polish.md) — per-page SEO/JSON-LD + sitemap + nav + `llms.txt` + a11y/perf sweep bundled (3.1)

## Dependencies to Add

**None.** Every dependency this job needs (`zod`, `@next/mdx`, `next/image`,
React 19, Tailwind 4, Vitest, MSW, `@testing-library/*`) is already installed
by the scaffold or by `website-foundation`.

## Open Items (Resolve During Implementation)

- **`publishedAt` tie-break** — If two entries share the same date, the loader
  needs a stable secondary sort. Default to `slug` alphabetical (Phase 1.2).
  Revisit only if entries need explicit ordering.
- **Featured entry dedup on the index** — Phase 2.2 decides whether featured
  entries also appear in the "all entries" list below, or only in the hero
  grid. Default: they appear in both (simpler, the "all" list lives up to its
  name). Toggle is a one-liner in the page component if this needs to change.
- **Hero image dimensions** — Phase 1.2 ships a 1600×900 placeholder. Real
  aspect ratio gets reviewed during the a11y/perf sweep in Phase 3.1 based on
  how `next/image` serves it in the card + detail layouts. Frontmatter leaves
  room for `heroImageAspect` if ratio flexibility becomes necessary; not in
  the v1 schema.
- **Related episode/case link rendering** — Phase 2.2 defaults to inline links
  ("Built during [Party Masters discovery](/cases/party-masters)") rather than
  structured badges. Revisit if the layout gets crowded.
- **Empty-index handling** — Phase 2.2 treats a one-entry or two-entry index
  as normal. A literal zero-entry state (no MDX files in `src/content/showcase/`
  at all) is treated as a hard build failure via a module-load assertion in
  the loader: `if (entries.length === 0) throw new Error(...)`. This prevents
  accidentally shipping an empty gallery page. Documented in Phase 1.2.
- **"Want to be featured?" CTA on the index** — out of scope for v1 (the
  channel uses its existing email-capture surfaces for this). If added later,
  it embeds `<EmailCapture source="showcase-featured-interest" />` in the
  index footer — no new capture plumbing required.

## Section IDs for TDD Workflow

Each feature maps to one section ID used by `/discovery`, `/red`, `/green`,
`/refactor`. Section IDs use the canonical slug `community-showcase`, not the
alias `cs`.

| Section ID                    | Feature                                                                                          |
|-------------------------------|--------------------------------------------------------------------------------------------------|
| `community-showcase-1.1`      | Showcase schema + Zod validator                                                                  |
| `community-showcase-1.2`      | Content loader + seed content + authoring guide                                                  |
| `community-showcase-2.1`      | `<ShowcaseCard>` component + `/showcase` index page                                              |
| `community-showcase-2.2`      | `/showcase/[slug]` detail page                                                                   |
| `community-showcase-3.1`      | Per-page metadata + OpenGraph + JSON-LD + sitemap + nav + `llms.txt` + a11y sweep                |

These IDs are consumed by `pipeline/active/session.yaml` and used as
directory names under `pipeline/active/`.
