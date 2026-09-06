# website-foundation — Implementation Plan

**Alias:** `wf` — invoke as `/pipeline wf <section>`. Section IDs in YAML + commits use the canonical slug `website-foundation`.

## Context

travisgautier.com is the brand site for the Travis Gautier YouTube channel — the place
viewers land after watching an episode and the asset that converts them into
subscribers and email signups. As of 2026-04-11 the repo is a fresh Next.js 16
App Router scaffold with a placeholder homepage and `public/llms.txt`. Nothing
else is live, and `pipeline/active/session.yaml` explicitly names
`docs/website-implementation-plan.md` as the seed for the first
`currentwork/` job.

This job delivers the **public content site MVP** — the scope of Phase 0 and
Phase 1 from the implementation-plan doc, plus the `/about` page and the
SEO/accessibility polish needed for a production launch. The storefront,
authentication, free interactive tools, community showcase, testimonials, and
cohort enrollment are each deferred to their own future `/jobbuild` runs (see
the plan file at `/home/travis/.claude/plans/ancient-squishing-rocket.md` for
the full ten-job landscape).

The end-state of this job: `npm run build` produces a content-driven marketing
site with a branded homepage, a fully-working `/episodes` and `/cases` tree
loaded from MDX content files, an `/about` page, email capture wired to Resend,
LLL outbound crosslinks, and clean SEO/robots/sitemap/llms.txt coverage —
shippable to the VPS in standalone mode.

## What Already Exists

- **Next.js 16 App Router scaffold** — React 19.2.4, Tailwind 4, strict TS, `@/` → `src/`. (`package.json`, `tsconfig.json`, `next.config.ts`)
- **Standalone output configured** — `next.config.ts` sets `output: "standalone"` for self-hosted VPS deploy. (`next.config.ts:3`)
- **Content schemas (partial)** — four typed modules already in place:
  - `src/content/schemas/content-tier.ts` — `ContentTier` enum + `CONTENT_TIER_LABELS`
  - `src/content/schemas/content-pillar.ts` — `ContentPillar` enum + `CONTENT_PILLAR_QUESTIONS`
  - `src/content/schemas/episode.ts` — `Episode` interface
  - `src/content/schemas/source-material.ts` — `SourceMaterial` interface + `SOURCE_MATERIAL_KINDS`
  - `src/content/schemas/index.ts` — barrel re-export
- **Placeholder homepage** — `src/app/page.tsx` renders `<h1>travisgautier</h1>`. Root layout at `src/app/layout.tsx` wires Geist sans/mono fonts.
- **llms.txt** — `public/llms.txt` is populated and points crawlers at the Large Language Library sister project.
- **Test infra** — Vitest 2.1.8 + jsdom, `src/__tests__/setup.ts` loads `@testing-library/jest-dom/vitest`, MSW 2.7 installed, coverage thresholds 70/80/80/80 (`vitest.config.ts`). Only `smoke.test.ts` exists today.
- **Source doc** — `docs/website-implementation-plan.md` (site map, page specs, phased rollout).
- **Brand doc** — `docs/brand-identity.md` (voice, tone, visual direction — "boutique consultancy, muted confident colors, strong typography, narrative quality").
- **Next.js 16 MDX guide** — `node_modules/next/dist/docs/01-app/02-guides/mdx.md` (local docs required reading per `AGENTS.md`).

## Feature Overview (11 Features, 4 Phases)

| #   | Feature                                                                           | Phase                   | Size | Status  |
|-----|-----------------------------------------------------------------------------------|-------------------------|------|---------|
| 1.1 | `Case` content schema + barrel update                                             | 1 - Foundation          | S    | Shipped |
| 1.2 | Zod runtime validators for Episode / SourceMaterial / Case                        | 1 - Foundation          | M    | Shipped |
| 1.3 | Brand design system (Tailwind theme tokens, typography, palette, dark mode)       | 1 - Foundation          | M    | Shipped |
| 1.4 | Site shell (Header, Nav, Footer, layout primitives, error + not-found boundaries) | 1 - Foundation          | M    | Shipped |
| 2.1 | MDX pipeline + content loaders (wiring, discovery, import, Zod validation)        | 2 - Content Loader      | L    | Shipped |
| 2.2 | Seed content: 1 episode MDX + Party Masters placeholder case                      | 2 - Content Loader      | M    | Shipped |
| 3.1 | `/` homepage rebuild (brand, latest episode, section entries, LLL callout, CTA)   | 3 - Pages               | M    | Planned |
| 3.2 | `/episodes` index + `/episodes/[slug]` detail                                     | 3 - Pages               | L    | Planned |
| 3.3 | `/cases` index + `/cases/[slug]` detail                                           | 3 - Pages               | L    | Planned |
| 3.4 | `/about` page (brand story + LLL relationship)                                    | 3 - Pages               | S    | Planned |
| 4.1 | Capture + SEO + polish (email, crosslinks, metadata, sitemap, robots, a11y)       | 4 - Capture + SEO       | L    | Shipped |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

## Dependency Graph

```
Phase 1: Foundation (schemas, design, shell, validators)
│
│   1.1 ─┬─→ 1.2
│   1.3 ─┤            ← 1.1, 1.3, 1.4 parallel; 1.2 depends on 1.1
│   1.4 ─┘
│
v
Phase 2: Content Loader (MDX pipeline, loaders, seed data)
│
│   2.1 → 2.2   ← sequential (loader must exist before seed content is verified)
│
v
Phase 3: Pages (homepage + every public route)
│
│   3.1, 3.2, 3.3, 3.4   ← all parallel-able after phase 2
│
v
Phase 4: Capture + SEO + Polish
│
    4.1   ← single section covers email, crosslinks, SEO, sitemap, a11y
```

Hard dependencies only cross phase boundaries. Within a phase, most features
can run in parallel TDD cycles — Phase 2 is the one exception because the MDX
pipeline has to exist before the loader is written, and the loader has to exist
before seed content is verified end-to-end.

## New Content Types Required

| Type   | Phase | Purpose                                                                                                 |
|--------|-------|---------------------------------------------------------------------------------------------------------|
| `Case` | 1     | Case study content record — client context, research findings, discovery, decisions, deliverables, outcome, LLL crosslink URLs |

Zod schemas for `Episode`, `SourceMaterial`, and the new `Case` live at
`src/content/schemas/validators.ts` (new) — validators, not new types, so they
don't appear in the table above but are delivered in Feature 1.2.

## Critical Files Reference

| File                                                     | Role                                                                  |
|----------------------------------------------------------|-----------------------------------------------------------------------|
| `next.config.ts`                                         | MODIFY — wrap with `createMDX()`, extend `pageExtensions`             |
| `mdx-components.tsx`                                     | NEW (project root) — required by `@next/mdx` for App Router           |
| `src/content/schemas/case.ts`                            | NEW — `Case` interface + `CASE_STATUSES` enum                         |
| `src/content/schemas/index.ts`                           | MODIFY — add `export * from './case'` and `export * from './validators'` |
| `src/content/schemas/validators.ts`                      | NEW — Zod schemas for Episode, SourceMaterial, Case                   |
| `src/content/schemas/episode.ts`                         | REFERENCE — existing `Episode` interface (no modifications expected)  |
| `src/content/schemas/source-material.ts`                 | REFERENCE — existing `SourceMaterial` interface                       |
| `src/content/schemas/content-tier.ts`                    | REFERENCE — existing `ContentTier` enum                               |
| `src/content/schemas/content-pillar.ts`                  | REFERENCE — existing `ContentPillar` enum                             |
| `src/app/layout.tsx`                                     | MODIFY — mount site shell, load brand fonts, set metadata base        |
| `src/app/globals.css`                                    | MODIFY — replace placeholder tokens with brand design tokens          |
| `src/app/page.tsx`                                       | MODIFY — real homepage                                                |
| `src/app/episodes/page.tsx`                              | NEW — episodes index                                                  |
| `src/app/episodes/[slug]/page.tsx`                       | NEW — episode detail + `generateStaticParams`                         |
| `src/app/cases/page.tsx`                                 | NEW — cases index                                                     |
| `src/app/cases/[slug]/page.tsx`                          | NEW — case detail + `generateStaticParams`                            |
| `src/app/about/page.tsx`                                 | NEW — about page                                                      |
| `src/app/sitemap.ts`                                     | NEW — dynamic sitemap pulling episodes + cases from the loader        |
| `src/app/robots.ts`                                      | NEW — permissive robots (crawling welcome per llms.txt)               |
| `src/lib/content/loader.ts`                              | NEW — filesystem discovery + dynamic import + Zod validation          |
| `src/lib/content/episodes.ts`                            | NEW — `getAllEpisodes()`, `getEpisodeBySlug()`                        |
| `src/lib/content/cases.ts`                               | NEW — `getAllCases()`, `getCaseBySlug()`                              |
| `src/components/site/Header.tsx`                         | NEW — brand header + nav                                              |
| `src/components/site/Footer.tsx`                         | NEW — footer with LLL sister-project callout                          |
| `src/components/capture/EmailCapture.tsx`                | NEW — capture form (client component, submits via server action)      |
| `src/components/capture/actions.ts`                      | NEW — `"use server"` action that posts to Resend                      |
| `src/components/crosslinks/LllCrosslinks.tsx`            | NEW — renders `lllEntryUrls` with branded styling                     |
| `src/content/episodes/pilot-party-masters-discovery.mdx` | NEW — seed episode                                                    |
| `src/content/cases/party-masters.mdx`                    | NEW — placeholder case                                                |
| `public/llms.txt`                                        | MODIFY — polish + include sitemap reference                           |

## Verification Plan

| Phase | Verification |
|-------|--------------|
| 1     | `npm run lint` clean. `npm test` — Zod validator unit tests green. `Case` type importable via `@/content/schemas`. Site shell renders on the placeholder `/` page. Design tokens applied in `globals.css` (dev server visual check). `npm run build` clean. |
| 2     | `@next/mdx` + `zod` installed, `mdx-components.tsx` in place, `next.config.ts` wrapped. Unit test calls `getAllEpisodes()` + `getAllCases()` against `src/content/` and receives Zod-validated, strictly-typed records. Seed content imports don't break `npm run build`. |
| 3     | Every new route renders under `npm run dev`, navigable from site shell. `generateStaticParams` lists known slugs, unknown slugs 404 (`dynamicParams = false`). Homepage displays latest episode from the loader. Case and episode detail pages render MDX bodies via `mdx-components.tsx`. |
| 4     | Capture form POSTs to Resend server action (live test with `RESEND_API_KEY` in `.env.local`). `/sitemap.xml` and `/robots.txt` load and list every episode + case. Per-page metadata visible in `view-source:`. Lighthouse a11y ≥ 95, performance ≥ 90. LLL crosslink component renders on episode and case detail pages. Coverage meets thresholds. |
| All   | `npm run lint` clean. `npm test` green. `npm run build` clean. Manual smoke: `/`, `/episodes`, `/episodes/pilot-party-masters-discovery`, `/cases`, `/cases/party-masters`, `/about`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`. |

## Phase Documentation

- [Phase 1: Foundation](./phase-1-foundation.md)
- [Phase 2: Content Loader](./phase-2-content-loader.md)
- [Phase 3: Pages](./phase-3-pages.md)
- [Phase 4: Capture + SEO](./phase-4-capture-seo.md)

## Dependencies to Add

Installed during Phase 2.1 (except `zod`, which Phase 1.2 depends on and should
be installed at the start of the job):

- `zod` — runtime validation at content boundary (Phase 1.2)
- `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx` — MDX pipeline (Phase 2.1)
- `resend` — email capture provider (Phase 4.1)

## Open Items (Resolve During Implementation)

- **Brand design tokens**: `docs/brand-identity.md` gives direction (boutique consultancy, muted confident colors, narrative quality) but no specific hex values or font stack. Phase 1.3 owns the call.
- **`RESEND_API_KEY`**: User must provision and add to `.env.local` before Phase 4.1 can be verified end-to-end. Plan notes where the key is referenced; implementation is functional without the key (form degrades to an error state).
- **Party Masters placeholder copy**: Phase 2.3 ships stub copy. Real case content is a separate concern and not part of this job.

## Section IDs for TDD Workflow

Each feature maps to one section ID used by `/discovery`, `/red`, `/green`, `/refactor`.

| Section ID                     | Feature                               |
|--------------------------------|---------------------------------------|
| `website-foundation-1.1`       | Case content schema                   |
| `website-foundation-1.2`       | Zod validators                        |
| `website-foundation-1.3`       | Brand design system                   |
| `website-foundation-1.4`       | Site shell                            |
| `website-foundation-2.1`       | MDX pipeline + content loaders        |
| `website-foundation-2.2`       | Seed content                          |
| `website-foundation-3.1`       | Homepage                              |
| `website-foundation-3.2`       | Episodes (index + detail)             |
| `website-foundation-3.3`       | Cases (index + detail)                |
| `website-foundation-3.4`       | About page                            |
| `website-foundation-4.1`       | Capture + SEO + polish                |

These IDs are consumed by `pipeline/active/session.yaml` and used as directory
names under `pipeline/active/`.
