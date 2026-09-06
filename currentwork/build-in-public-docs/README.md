# build-in-public-docs — Implementation Plan

**Alias:** `bpd` — invoke as `/pipeline bpd <section>` or `/discovery bpd <section>`. Section IDs in YAML + commits still use the canonical slug `build-in-public-docs`.

## Context

`/build-log` is the channel's "show the work" surface — a public, SEO-indexed
section of travisgautier.com that renders the agent-driven build process *of the
site itself* as published content. Viewers who watch a Travis Gautier episode about
the TDD pipeline can land on `/build-log/jobs/website-foundation` and read the
exact plan the agents are executing against, then visit `/build-log/status` to
see what beat is currently running. The methodology and the artifact are the
same thing. This job is #8 in `docs/future-jobs.md` and implements the "Full
documentation of site build process as Travis Gautier content" bullet from Phase 4
("The Meta Play") of `docs/website-implementation-plan.md`.

The scope is two new loaders (one for the `currentwork/` job tree, one for the
`pipeline/active/` YAML state) plus four routes (`/build-log` index,
`/build-log/jobs/[slug]` job README, `/build-log/jobs/[slug]/[phase]` phase
file, `/build-log/status` live status board), plus a runtime markdown
rendering component to render the existing `.md` files as styled HTML, plus
the usual SEO/sitemap/nav polish. The section is **fully public, indexable,
no email gate**, in keeping with the brand doc's "show the work" principle.
Source data is read from disk at build time — there is no database, no
real-time updates, no editing-from-the-site.

This job depends entirely on `website-foundation` (alias `wf`) having shipped:
the brand design tokens, the site shell, the `<Container>` primitive, the
validators module, the dynamic sitemap, the header nav, the `metadataBase`
configuration, the SEO + JSON-LD pattern, and the `generateStaticParams`
+ `dynamicParams = false` pattern all come from that job.

Out of scope (explicit non-goals): editing `currentwork/` or `pipeline/`
artifacts from the site, running pipeline operations from the site, real-time
updates, git-log integration, `pipeline/archive/` history view (the future-jobs
entry calls this "optional" — defer to a follow-up job), search across the
build-log (deferred to the dedicated `search` job), per-section drill-downs
into `pipeline/active/{section}/discovery.yaml` (those YAMLs are too noisy and
churn too fast to render as published content), parsing phase-file markdown
bodies into structured trees (only the README's feature table gets parsed
structurally — phase bodies pass through to the markdown renderer as opaque
strings).

## What Already Exists

### Already in the repo today (2026-04-11)
- **Next.js 16 App Router scaffold** — React 19.2.4, Tailwind 4, strict TS, `@/` → `src/`. (`package.json`, `tsconfig.json`, `next.config.ts`)
- **Standalone output configured** — `next.config.ts` sets `output: "standalone"` for self-hosted VPS deploy.
- **Content schemas** — `src/content/schemas/{content-tier,content-pillar,episode,source-material,index}.ts`. No `Job`/`JobPhase`/`SessionStatus`/`KnowledgeFile` types yet.
- **`currentwork/` tree** — already populated with 7 planned jobs (`website-foundation`, `community-showcase`, `testimonials-results`, `cohort-enrollment`, `email-funnel`, `free-tools`, `storefront-auth`) plus `TEMPLATE.md`. Each job dir has a `README.md` + 3–4 `phase-N-{slug}.md` files. The loader walks this tree directly — no MDX, no frontmatter.
- **`pipeline/active/` YAML state** — `session.yaml` (id, current_phase, current_section, current_agent, current_stage, context_window, completed_sections list, notes) and `knowledge.yaml` (project_context, conventions, patterns, open_questions). Both small (under 4KB), both updated by the TDD pipeline skills as work progresses.
- **Job alias convention** — aliases live at the top of each `currentwork/{slug}/README.md` as a `**Alias:** {short} — ...` line. They are NOT centralized in `CLAUDE.md`. The loader extracts them per-job from the README.
- **Test infra** — Vitest 2.1.8 + jsdom, `@testing-library/jest-dom/vitest` loaded via `src/__tests__/setup.ts`, MSW 2.7 installed, coverage thresholds 70/80/80/80 (`vitest.config.ts`).
- **Source docs** — `docs/website-implementation-plan.md`, `docs/brand-identity.md`, `docs/future-jobs.md`, `AGENTS.md` (Next.js 16 local-docs reminder).
- **`public/llms.txt`** — already populated (will be polished further by `wf` 4.4 first, then mention `/build-log` here in 3.1 — merged polish section).

### Delivered by `website-foundation` (prerequisite — NOT YET SHIPPED when this plan is written)
This job reuses these `wf` outputs and cannot start its TDD cycles until they exist.

- **Brand design tokens** (`src/app/globals.css` from wf 1.3) — `--color-{ink,parchment,ember,steel,mist,signal}` + semantic aliases `--color-{background,foreground,muted,accent,link}`. Tailwind class surface: `bg-accent`, `text-muted`, `border-mist`, `text-link`, `bg-parchment`, `font-display`.
- **Site shell** (`src/components/site/{Header,Footer}.tsx` + `src/app/layout.tsx` from wf 1.4) — mounted root layout with `metadataBase` set to `https://travisgautier.com`.
- **`<Container>` layout primitive** (`src/components/site/Container.tsx` from wf 1.4) — `mx-auto w-full max-w-5xl px-6 md:px-10`, accepts `className` + `as` prop. Used as the page wrapper on every build-log route.
- **Zod validators module** (`src/content/schemas/validators.ts` from wf 1.2) — `EpisodeSchema`, `SourceMaterialSchema`, `CaseSchema`. `JobSchema`, `SessionStatusSchema`, `KnowledgeFileSchema` are added here following the same export style.
- **Dynamic sitemap** (`src/app/sitemap.ts` from wf 4.4) — Phase 3.1 of this job (merged polish) appends `/build-log` + `/build-log/status` + every job and phase URL.
- **Header nav** (`src/components/site/Header.tsx` from wf 1.4) — Phase 3.1 adds a "Build log" link with active-state highlighting on `/build-log`.
- **Homepage** (`src/app/page.tsx` from wf 3.1) — Phase 3.1 inserts a small "Inside the build" callout linking to `/build-log`.
- **Pattern: `getAllX()` / `getXBySlug()`** (`src/lib/content/episodes.ts`, `src/lib/content/cases.ts` from wf 2.2) — this job applies the same shape to `getAllJobs()` / `getJobBySlug()` despite reading a different filesystem location (`currentwork/` instead of `src/content/`).
- **Pattern: module-level cache + `Object.freeze`** (wf 2.2) — both build-log loaders cache their parsed result and freeze the returned arrays to prevent caller mutation.
- **Pattern: `generateStaticParams` + `dynamicParams = false`** (wf 3.3, 3.5) — `/build-log/jobs/[slug]` and `/build-log/jobs/[slug]/[phase]` follow the same shape so unknown slugs and phases 404 at build time.
- **Pattern: `generateMetadata` + JSON-LD via `dangerouslySetInnerHTML`** (wf 4.3) — every build-log page gets per-route metadata; job and phase pages embed `TechArticle` JSON-LD.
- **`public/llms.txt`** — polished by wf 4.4; this job's 3.1 adds `/build-log` to the sitemap section.
- **Permissive `robots.ts`** (wf 4.4) — already allows the build-log section by default; no robots changes needed in this job.

## Feature Overview (6 Features, 3 Phases — post-condense from 9)

| #   | Feature                                                                                                                | Phase             | Size | Status  |
|-----|------------------------------------------------------------------------------------------------------------------------|-------------------|------|---------|
| 1.1 | Schemas + Job-Tree Loader — `Job`/`JobPhase`/`JobFeature`/`SessionStatus`/`KnowledgeFile` schemas + Zod validators + `getAllJobs`/`getJobBySlug`/`getJobPhase` + README/phase parsers (merged from old 1.1 + 1.2) | 1 - Foundation    | L    | Planned |
| 1.2 | Pipeline state loader — `getSessionStatus`, `getKnowledgeFile`, `getJobsRollup` (reads YAMLs, joins against completed_sections) | 1 - Foundation    | M    | Planned |
| 2.1 | `<MarkdownDocument>` component — react-markdown + remark-gfm + rehype-{slug,autolink,highlight}                        | 2 - Pages         | S    | Planned |
| 2.2 | `/build-log` index + `/build-log/jobs/[slug]` + `/build-log/jobs/[slug]/[phase]` — one content type, three routes, four components (`JobCard`, `StatusBadge`, `PhaseNav`, plus index/job/phase pages) (merged from old 2.2 + 2.3) | 2 - Pages         | L    | Complete |
| 2.3 | `/build-log/status` status board — session + knowledge + jobs rollup + `<JobsRollupTable>`                             | 2 - Pages         | M    | Complete |
| 3.1 | SEO + Sitemap + Nav + a11y Polish — per-page `generateMetadata` + OpenGraph + Twitter + `TechArticle`/`CollectionPage` JSON-LD + sitemap append + Header nav link + `llms.txt` mention + homepage callout + Lighthouse sweep (merged from old 3.1 + 3.2) | 3 - Polish        | L    | Complete |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

Total rough job size: **M/L** — comparable to `testimonials-results` (M/L). Slightly heavier than the `docs/future-jobs.md` "M" estimate because the loaders parse non-trivial markdown structure (the README feature table) and ship a runtime markdown rendering pipeline that the rest of the site doesn't yet have.

**Condense history:** Originally planned as 9 sections; condensed to 6 on 2026-04-12 via three merges — 1.1+1.2 (inseparable pair: schemas + their consumer), 2.2+2.3 (same-entity views: jobs index + jobs detail), 3.1+3.2 (small finishing touches). No deliverables dropped.

## Dependency Graph (post-condense)

```
Phase 1: Foundation (schemas + loaders)
│
│   1.1 → 1.2              ← strictly sequential
│                            (schemas + job-tree loader bundled in 1.1
│                            because the loader can't be tested without
│                            the schemas; 1.2 joins the job index against
│                            session.yaml.completed_sections)
│
v
Phase 2: Pages (markdown component + routes)
│
│   2.1 ─┬→ 2.2             ← <MarkdownDocument> blocks every page;
│        └→ 2.3                2.2 (index+jobs+phases) and 2.3 (status)
│                              are parallel after 2.1
│
v
Phase 3: Polish (SEO + sitemap + nav + a11y)
│
    3.1                      ← single consolidated polish section
                              (metadata + sitemap + nav + llms + homepage
                              + a11y sweep), depends on Phase 2 complete
```

Hard dependencies:
- **1.1 self-contained** — schemas + job-tree loader consolidated into one feature because the loader (`getAllJobs`/`getJobBySlug`/`getJobPhase`) imports `Job` / `JobSchema` and can't be meaningfully tested without them.
- **1.1 → 1.2** — `getSessionStatus` imports `SessionStatusSchema` (from 1.1); `getKnowledgeFile` imports `KnowledgeFileSchema` (from 1.1); `getJobsRollup` joins `getAllJobs` (from 1.1) against the `completed_sections` list from `session.yaml`. Without 1.1 there's no schemas and no job list to join against.
- **Phase 1 → Phase 2** — every page in Phase 2 calls one or more loader functions. Without the loaders, the pages have no data.
- **2.1 → 2.2, 2.3** — `<MarkdownDocument>` is mounted by every build-log page (the index renders job summary excerpts; jobs/phases render full markdown bodies; the status board renders the `knowledge.yaml.notes` block via the same component). Building pages before the renderer means duplicating the react-markdown wiring.
- **2.2 and 2.3 are parallel** — 2.2 (index + job + phase pages) consumes `getAllJobs`/`getJobBySlug`/`getJobPhase`; 2.3 (status board) consumes `getSessionStatus`/`getKnowledgeFile`/`getJobsRollup`. Different route files, different loader entry points.
- **Phase 2 → 3.1** — polish needs every route to exist first. Per-page metadata widens Phase 2's static `metadata` consts; sitemap append needs every route to be enumerable; nav link needs `/build-log` to exist so the active state has a target; homepage callout needs `/build-log` to link to. 3.1 is the single consolidated polish pass.

## New Content Types Required

| Type             | Phase | Purpose                                                                                              |
|------------------|-------|------------------------------------------------------------------------------------------------------|
| `Job`            | 1     | One implementation plan tree under `currentwork/{slug}/` — slug, alias, title, context, features, phase filenames |
| `JobFeature`     | 1     | Row from a job README's Feature Overview table — id, name, phase, size, status (parsed from markdown)  |
| `JobPhase`       | 1     | One `phase-N-{slug}.md` file — phase number, slug, title, raw markdown body, parsed metadata header   |
| `SessionStatus`  | 1     | Typed shape of `pipeline/active/session.yaml` — current_section, current_agent, completed_sections    |
| `KnowledgeFile`  | 1     | Typed shape of `pipeline/active/knowledge.yaml` — project_context, conventions, patterns, open_questions |
| `JobRollupEntry` | 1     | Computed per-job rollup row — slug, total features, completed features, percent_complete             |

All types live in `src/content/schemas/build-log.ts`. `JobFeature`, `JobPhase`, and `JobRollupEntry` are exported but not re-exported as top-level types elsewhere — they only appear nested on `Job` / the rollup return shape. `JobSchema`, `SessionStatusSchema`, `KnowledgeFileSchema` are added to `src/content/schemas/validators.ts` alongside the existing `EpisodeSchema` / `CaseSchema` per the `wf` 1.2 convention.

## Critical Files Reference

| File                                                              | Role                                                                               |
|-------------------------------------------------------------------|------------------------------------------------------------------------------------|
| `src/content/schemas/build-log.ts`                                | NEW — interfaces above                                                             |
| `src/content/schemas/index.ts`                                    | MODIFY — `export * from './build-log'`                                             |
| `src/content/schemas/validators.ts`                               | MODIFY — add `JobSchema`, `JobFeatureSchema`, `JobPhaseSchema`, `SessionStatusSchema`, `KnowledgeFileSchema` |
| `src/content/schemas/__tests__/validators.test.ts`                | MODIFY — add test cases for the new schemas                                        |
| `src/lib/build-log/jobs.ts`                                       | NEW — `getAllJobs`, `getJobBySlug`, `getJobPhase` + module-level cache             |
| `src/lib/build-log/parse-readme.ts`                               | NEW — internal helper: parses alias line, Context section, and Feature Overview table from a README markdown string |
| `src/lib/build-log/parse-phase.ts`                                | NEW — internal helper: parses the header block from a `phase-N-*.md` file (title, total size, prerequisites) |
| `src/lib/build-log/pipeline-state.ts`                             | NEW — `getSessionStatus`, `getKnowledgeFile`, `getJobsRollup`                      |
| `src/lib/build-log/__tests__/jobs.test.ts`                        | NEW — unit tests against fixtures + integration test against real `currentwork/`   |
| `src/lib/build-log/__tests__/parse-readme.test.ts`                | NEW                                                                                |
| `src/lib/build-log/__tests__/parse-phase.test.ts`                 | NEW                                                                                |
| `src/lib/build-log/__tests__/pipeline-state.test.ts`              | NEW                                                                                |
| `src/components/build-log/MarkdownDocument.tsx`                   | NEW — react-markdown wrapper with GFM + rehype plugins                             |
| `src/components/build-log/JobCard.tsx`                            | NEW — used on the index + status board                                             |
| `src/components/build-log/StatusBadge.tsx`                        | NEW — small status pill (`planned` / `in-progress` / `complete` / `unknown`)       |
| `src/components/build-log/JobsRollupTable.tsx`                    | NEW — at-a-glance percent-complete table on the status board                       |
| `src/components/build-log/PhaseNav.tsx`                           | NEW — sidebar/header nav for the job page listing its phases                       |
| `src/components/build-log/__tests__/*.test.tsx`                   | NEW — one per component                                                            |
| `src/app/build-log/page.tsx`                                      | NEW — index page                                                                   |
| `src/app/build-log/jobs/[slug]/page.tsx`                          | NEW — job README detail, `generateStaticParams`, `generateMetadata`                |
| `src/app/build-log/jobs/[slug]/[phase]/page.tsx`                  | NEW — phase file detail, `generateStaticParams`, `generateMetadata`                |
| `src/app/build-log/status/page.tsx`                               | NEW — live status board                                                            |
| `src/app/build-log/__tests__/page.test.tsx`                       | NEW                                                                                |
| `src/app/build-log/jobs/[slug]/__tests__/page.test.tsx`           | NEW                                                                                |
| `src/app/build-log/jobs/[slug]/[phase]/__tests__/page.test.tsx`   | NEW                                                                                |
| `src/app/build-log/status/__tests__/page.test.tsx`                | NEW                                                                                |
| `src/app/sitemap.ts`                                              | MODIFY (3.1) — append `/build-log`, `/build-log/status`, every job + phase URL    |
| `src/components/site/Header.tsx`                                  | MODIFY (3.1) — add "Build log" nav link with active-state on `/build-log`          |
| `src/app/page.tsx`                                                | MODIFY (3.1) — add a small "Inside the build" callout linking to `/build-log`      |
| `public/llms.txt`                                                 | MODIFY (3.1) — mention `/build-log` in the sitemap section                         |
| `src/lib/content/loader.ts`                                       | REFERENCE (wf 2.2) — content loader pattern this job mirrors                       |
| `src/lib/content/episodes.ts`                                     | REFERENCE (wf 2.2) — `getAllX` / `getXBySlug` pattern                              |
| `src/components/site/Container.tsx`                               | REFERENCE (wf 1.4) — wrapper on every build-log page                               |
| `src/app/globals.css`                                             | REFERENCE — brand tokens already defined by wf 1.3                                 |

## Verification Plan

| Phase | Verification |
|-------|--------------|
| 1     | `npm run lint` clean. `npm test` — `JobSchema.parse(validFixture)` succeeds; rejects bad slug, missing title, malformed feature table row, non-array `phaseFiles`. `SessionStatusSchema.parse` accepts the real `pipeline/active/session.yaml` and a hand-built fixture. `KnowledgeFileSchema.parse` accepts the real `pipeline/active/knowledge.yaml`. `parseReadme` extracts the alias `cs` from `currentwork/community-showcase/README.md` and the alias `tr` from `testimonials-results/README.md`; returns the parsed Feature Overview table with the correct number of features per job. `getAllJobs()` returns 7+ entries from the real `currentwork/` tree (or whatever count is current at green time). `getJobBySlug('community-showcase')` returns a typed object with the parsed alias, parsed feature table, and discovered phase filenames. `getSessionStatus()` returns the parsed YAML. `getJobsRollup()` returns one row per job with `total`, `completed`, `percent_complete` computed correctly against fixture session state. Empty-`currentwork` guard returns `[]` (does NOT throw). Returned arrays are `Object.isFrozen`. `npm run build` clean. |
| 2     | `<MarkdownDocument>` renders a fixture markdown string containing a GFM table, an h2 with anchor link, and a fenced code block; GFM table renders as a real `<table>`, the h2 has an `id` and an autolink `<a>`, the code block has syntax-highlighted spans. `/build-log` index page renders under `npm run dev`, lists every `currentwork/*/` directory with status badge + alias + 1-line context excerpt + a "View" link to the job page. `/build-log/jobs/community-showcase` renders the README's full markdown body with a phase-nav strip listing all phases. `/build-log/jobs/community-showcase/phase-1-foundation` renders the phase doc body and back-link to the job page. `/build-log/jobs/bogus` and `/build-log/jobs/community-showcase/phase-99-bogus` 404 (`dynamicParams = false`). `/build-log/status` shows the parsed current section/agent/stage from `session.yaml`, the completed-sections list, the knowledge.yaml summary, and the jobs rollup table with percent-complete bars per job. `npm run build` clean — `generateStaticParams` enumerates every `(slug, phase)` tuple. |
| 3     | `view-source:` on `/build-log`, `/build-log/jobs/website-foundation`, `/build-log/jobs/website-foundation/phase-1-foundation`, `/build-log/status` shows unique `<title>`, `<meta description>`, OpenGraph + Twitter card tags. Job and phase pages contain an inline `<script type="application/ld+json">` block with a valid `TechArticle` payload (validates at https://validator.schema.org). `/sitemap.xml` lists `/build-log`, `/build-log/status`, every `/build-log/jobs/{slug}` URL, and every `/build-log/jobs/{slug}/{phase}` URL. Header nav shows a "Build log" link with active-state highlighting when the path starts with `/build-log`. `public/llms.txt` mentions `/build-log` in the sitemap section. `/` homepage shows the "Inside the build" callout above the footer. Lighthouse local run on `/build-log` and `/build-log/jobs/website-foundation/phase-1-foundation`: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90. Keyboard-only walkthrough: tab from header → "Build log" → into the index grid → into a job page → into a phase page → back out through the phase nav and the header without getting stuck. |
| All   | `npm run lint` clean. `npm test` green + coverage still ≥ thresholds (70 branches / 80 functions / 80 lines / 80 statements). `npm run build` clean. Manual smoke (against `npm run start`): `/`, `/build-log`, `/build-log/jobs/website-foundation`, `/build-log/jobs/website-foundation/phase-1-foundation`, `/build-log/status`, `/sitemap.xml`, `/llms.txt`. Header nav supports the full `/ → /build-log → job → phase → /build-log → /` loop with active-state highlighting correct at each step. |

## Phase Documentation

- [Phase 1: Foundation](./phase-1-foundation.md) — schemas, job-tree loader, pipeline-state loader
- [Phase 2: Pages](./phase-2-pages.md) — `<MarkdownDocument>` + four routes
- [Phase 3: Polish](./phase-3-polish.md) — SEO + sitemap + nav + llms.txt + homepage callout + a11y sweep

## Dependencies to Add

Installed in Phase 1.2 (post-condense; was 1.3) and Phase 2.1:

| Package                       | Why                                                          | Phase |
|-------------------------------|--------------------------------------------------------------|-------|
| `yaml`                        | Parse `pipeline/active/session.yaml` + `knowledge.yaml`      | 1.2   |
| `react-markdown`              | Runtime renderer for plain `.md` files                       | 2.1   |
| `remark-gfm`                  | GFM tables, strikethrough, task lists, autolinks             | 2.1   |
| `rehype-slug`                 | Adds `id` attributes to headings (anchor links)              | 2.1   |
| `rehype-autolink-headings`    | `#`-prefixed clickable anchors next to headings              | 2.1   |
| `rehype-highlight`            | Server-side syntax highlighting for fenced code blocks       | 2.1   |
| `highlight.js`                | Peer of `rehype-highlight` — language grammars               | 2.1   |

`zod` is already installed by `wf` 1.2. All packages above are pure-JS,
MIT-licensed, well-maintained, with no native build steps. Total install
footprint ≈ 600KB unminified.

## Open Items (Resolve During Implementation)

- **Code highlighting theme** — `rehype-highlight` doesn't ship CSS itself.
  Phase 2.1 imports a `highlight.js/styles/*.css` theme that matches the brand
  tokens — probably `github-dark.css` against the dark surfaces or `github.css`
  against the light surfaces. Final call during `/green 2.1` after the brand
  tokens land from `wf` 1.3.
- **Markdown caching strategy** — `getAllJobs()` IS cached at module-load
  (matches the `wf` content loader pattern). Individual phase bodies are NOT
  separately cached — they're loaded on demand inside the route's
  `generateStaticParams` iteration during `npm run build`, then served as
  static HTML. No runtime fetch.
- **Status board refresh signal** — there is none in v1. The page is statically
  rebuilt on every `npm run build`. If real-time freshness is desired later,
  an ISR + revalidate upgrade can be added without touching the loader contract.
- **Empty `currentwork/` guard** — `getAllJobs()` returns `[]` (does NOT throw)
  if `currentwork/` contains only `TEMPLATE.md` and no job dirs. The
  `community-showcase` 1.2 pattern of throwing on empty makes sense for content
  galleries but NOT for a build log — the absence of jobs IS information worth
  showing. The `/build-log` index page handles the empty array with an
  "Initializing..." empty state.
- **Phase header parsing strictness** — `parsePhase` parses the leading header
  block (`# Phase N: ...`, `**Total Size:** ...`, `**Prerequisites:** ...`)
  via regex. If a phase file omits the header block (e.g. a hand-edited
  in-progress file), the parser returns `undefined` for the missing fields and
  the page renders the body without the header strip rather than failing.
  Strict mode is rejected because the build log should be tolerant of in-progress
  artifacts.
- **Feature Overview table parsing strictness** — same logic. If a job README
  omits the table or formats it differently, `parseReadme` returns
  `features: []` and the page renders the README body without a structured
  feature index. The job rollup row for that job shows `unknown` rather than
  zero-percent.
- **`session.yaml` schema tolerance** — `SessionStatusSchema` makes most fields
  optional except `id` and `completed_sections`. The pipeline skills update
  these fields independently and a freshly-initialized session may have many
  empty strings. Strict required fields would break the build during normal
  initialization windows.
- **`completed_sections` shape** — `session.yaml.completed_sections` is
  currently an empty list. The shape going forward (per the partymasters
  port) is one entry per finished `/refactor` cycle, with at least a section
  ID (`{job-slug}-{phase}.{feature}`) and optionally a timestamp. The schema
  accepts both string-only and object entries to remain forward-compatible.
- **JSON-LD type for build-log pages** — Phase 3.1 uses `TechArticle` for job
  and phase pages and `CollectionPage` for the index and status board. These
  are the closest schema.org types for "developer-facing technical writing".

## Section IDs for TDD Workflow (post-condense — 6 sections)

Each feature maps to one section ID used by `/discovery`, `/red`, `/green`,
`/refactor`. Section IDs use the canonical slug `build-in-public-docs`, not
the alias `bpd`.

| Section ID                          | Feature                                                                                      |
|-------------------------------------|----------------------------------------------------------------------------------------------|
| `build-in-public-docs-1.1`          | Schemas + Job-Tree Loader (merged: schemas + validators + parse-readme + parse-phase + jobs) |
| `build-in-public-docs-1.2`          | Pipeline state loader + rollup                                                               |
| `build-in-public-docs-2.1`          | `<MarkdownDocument>` component                                                               |
| `build-in-public-docs-2.2`          | `/build-log` index + `/build-log/jobs/[slug]` + `/build-log/jobs/[slug]/[phase]` (merged)    |
| `build-in-public-docs-2.3`          | `/build-log/status` status board                                                             |
| `build-in-public-docs-3.1`          | SEO + sitemap + nav + llms.txt + homepage callout + a11y sweep (merged)                      |

These IDs are consumed by `pipeline/active/session.yaml` and used as directory
names under `pipeline/active/`.
