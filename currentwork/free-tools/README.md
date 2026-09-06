# free-tools — Implementation Plan

**Alias:** `ft` — invoke as `/pipeline ft <section>` or `/discovery ft <section>`. Section IDs in YAML + commits still use the canonical slug `free-tools`.

## Context

`/tools` is the channel's SEO top-of-funnel. It attracts developers and
consultants searching for utilities like "AI ROI calculator" or "dev agency
pricing calculator", lands them on a deterministic, no-login widget, and
converts them into email subscribers via a non-blocking capture CTA that only
appears below a computed result. This job is #2 in `docs/future-jobs.md` and
Phase 2 of `docs/website-implementation-plan.md` under "Free
Interactive Tools".

The scope is a `/tools` index page plus four stateless calculator widgets,
each at its own route under `/tools/[slug]`. All four tools from the source
doc ship together:

1. **Project scoping estimator** — rough person-week range + suggested discovery/build/polish breakdown
2. **Pricing calculator** — recommended quote range from hourly rate, hours, complexity, margin
3. **ROI calculator for AI agent workflows** — annual savings + payback period from current human time + automation %
4. **Discovery phase timeline generator** — week-by-week discovery schedule from client size, complexity, stakeholder count

This job depends entirely on `website-foundation` (alias `wf`) having shipped:
brand design tokens, the `<Container>` primitive, the site shell, the
`<EmailCapture>` component, the dynamic sitemap, and `zod` all come from that
job. No new npm packages are needed for this job — React `useState` + Tailwind
+ Zod covers everything.

Out of scope (explicit non-goals): server-side result storage, user accounts,
URL result-sharing, localStorage persistence, payment integration,
AI-generated outputs, per-tool dynamic OG images, search over tools.

## What Already Exists

### Already in the repo today (2026-04-11)
- **Next.js 16 App Router scaffold** — React 19.2.4, Tailwind 4, strict TS, `@/` → `src/`. (`package.json`, `tsconfig.json`, `next.config.ts`)
- **Content schemas** — `src/content/schemas/{content-tier,content-pillar,episode,source-material,index}.ts`
- **Test infra** — Vitest 2.1.8 + jsdom, `@testing-library/jest-dom/vitest` loaded via `src/__tests__/setup.ts`, MSW 2.7 installed, coverage thresholds 70/80/80/80 (`vitest.config.ts`)
- **Source docs** — `docs/website-implementation-plan.md`, `docs/brand-identity.md`, `docs/future-jobs.md`

### Delivered by `website-foundation` (prerequisite — NOT YET SHIPPED when this plan is written)
This job reuses these `wf` outputs and cannot start until they exist.

- **Brand design tokens** (`src/app/globals.css` from wf 1.3) — `--color-{ink,parchment,ember,steel,mist,signal}` + semantic aliases `--color-{background,foreground,muted,accent,link}`. Tailwind class surface: `bg-accent`, `text-muted`, `border-mist`, `text-link`, `bg-parchment`, `font-display`, etc.
- **`<Container>` layout primitive** (`src/components/site/Container.tsx` from wf 1.4) — `mx-auto w-full max-w-5xl px-6 md:px-10`, accepts `className` + `as` prop (div/section/main/article).
- **Site shell** — `<Header>`, `<Footer>`, root layout at `src/app/layout.tsx` with `metadataBase` set to `https://travisgautier.com`.
- **`<EmailCapture source="..." />`** (`src/components/capture/EmailCapture.tsx` from wf 4.1) — client component, handles the Resend server action + typed idle/success/error states. This job embeds it directly; it is not forked.
- **Dynamic sitemap** (`src/app/sitemap.ts` from wf 4.4) — this job modifies it to append tool routes.
- **`zod`** installed as a wf 1.2 dependency.
- **Pattern: `getAllEpisodes()` / `getAllCases()` loaders** (`src/lib/content/loader.ts` from wf 2.2) — not directly reused, but the `getAllX` / `getXBySlug` naming convention is echoed as `getAllTools()` / `getToolBySlug()` over the static TypeScript registry.
- **Pattern: `generateStaticParams` + `dynamicParams = false`** — wf 3.3 and wf 3.5 establish this for `/episodes/[slug]` and `/cases/[slug]`; `/tools/[slug]` follows the same shape so unknown slugs 404 at build time.
- **Pattern: JSON-LD via `dangerouslySetInnerHTML`** — wf 4.3 sets the precedent for inline structured data on detail pages.

## Feature Overview (5 Features, 3 Phases)

| #   | Feature                                                                                                                         | Phase           | Size | Status  |
|-----|---------------------------------------------------------------------------------------------------------------------------------|-----------------|------|---------|
| 1.1 | Tool schema + empty registry + `<ToolShell>` layout component                                                                   | 1 - Foundation  | L    | Planned |
| 1.2 | `/tools` index page + `/tools/[slug]` dynamic route (`generateStaticParams`, 404 for unknown slugs)                             | 1 - Foundation  | M    | Planned |
| 2.1 | Scoping + Pricing calculators (pure calc modules + components + registry appends + `formatters.ts`)                             | 2 - Calculators | L    | Planned |
| 2.2 | ROI + Discovery Timeline calculators (pure calc modules + components + registry appends)                                        | 2 - Calculators | L    | Planned |
| 3.1 | Per-tool SEO + `SoftwareApplication` JSON-LD + `/tools` metadata + sitemap integration + site shell nav link + Lighthouse sweep | 3 - Polish      | L    | Planned |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

Total rough job size: **L** — comparable to `website-foundation` Phase 3 alone, smaller than the full `wf` job.

## Dependency Graph

```
Phase 1: Foundation
│
│   1.1 ─→ 1.2                ← schema + ToolShell, then index + dynamic route
│
v
Phase 2: Calculators (both sections parallel after Phase 1)
│
│   2.1   2.2                 ← each pair plugs into the registry independently
│
v
Phase 3: Polish
│
    3.1                       ← depends on all of Phase 2 for sitemap + JSON-LD coverage
```

Hard dependencies:
- **1.1 → 1.2** — both pages consume `<ToolShell>` + the `Tool` schema/registry (the index page indirectly via `<ToolCard>`, the dynamic route directly via each calculator component).
- **Phase 1 → Phase 2** — each calculator renders inside `<ToolShell>` and adds an entry to `registry.ts`.
- **Phase 2 → Phase 3.1** — sitemap integration, JSON-LD, and nav link depend on all four tools being in the registry so every route surfaces.
- **Phase 2 is parallel** — 2.1 (Scoping + Pricing) and 2.2 (ROI + Discovery Timeline) can run their TDD cycles concurrently. Each pair only touches its own component/calculation files + registry appends. `formatters.ts` ships with 2.1 and is imported by 2.2.

## New Content Types Required

| Type   | Phase | Purpose                                                                                     |
|--------|-------|---------------------------------------------------------------------------------------------|
| `Tool` | 1     | Calculator metadata record — slug, title, summary, category, tagline, component reference |

The `Tool` schema lives at `src/content/schemas/tool.ts` and is re-exported from `src/content/schemas/index.ts` alongside the existing `Episode` / `Case` / `SourceMaterial` types. The registry of concrete tool entries lives at `src/content/tools/registry.ts` — it imports each calculator component and assembles the typed array. No MDX, no filesystem content loading — tools are code, not prose.

## Critical Files Reference

| File                                                                | Role                                                                        |
|---------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `src/content/schemas/tool.ts`                                       | NEW — `Tool` interface + `ToolSchema` zod validator + `TOOL_CATEGORIES`     |
| `src/content/schemas/index.ts`                                      | MODIFY — `export * from './tool'`                                           |
| `src/content/tools/registry.ts`                                     | NEW — typed array + `getAllTools()` / `getToolBySlug()`                     |
| `src/content/tools/__tests__/registry.test.ts`                      | NEW — validates every registry entry against `ToolSchema`                   |
| `src/components/tools/ToolShell.tsx`                                | NEW — shared layout (title, summary, input column, result column, capture) |
| `src/components/tools/ToolCard.tsx`                                 | NEW — card used by `/tools` index                                           |
| `src/components/tools/__tests__/ToolShell.test.tsx`                 | NEW                                                                          |
| `src/components/tools/__tests__/ToolCard.test.tsx`                  | NEW                                                                          |
| `src/app/tools/page.tsx`                                            | NEW — `/tools` index                                                         |
| `src/app/tools/[slug]/page.tsx`                                     | NEW — dynamic tool route, `generateStaticParams`, `generateMetadata`        |
| `src/app/tools/[slug]/__tests__/page.test.tsx`                      | NEW                                                                          |
| `src/components/tools/calculators/ProjectScopingCalculator.tsx`     | NEW — Feature 2.1                                                            |
| `src/components/tools/calculators/PricingCalculator.tsx`            | NEW — Feature 2.2                                                            |
| `src/components/tools/calculators/RoiCalculator.tsx`                | NEW — Feature 2.3                                                            |
| `src/components/tools/calculators/DiscoveryTimelineCalculator.tsx`  | NEW — Feature 2.4                                                            |
| `src/components/tools/calculators/__tests__/*.test.tsx`             | NEW — one per calculator                                                     |
| `src/lib/tools/calculations/project-scoping.ts`                     | NEW — pure `estimateScope(input)` + `ProjectScopingInputSchema`              |
| `src/lib/tools/calculations/pricing.ts`                             | NEW — pure `computeQuoteRange(input)` + `PricingInputSchema`                 |
| `src/lib/tools/calculations/roi.ts`                                 | NEW — pure `computeAnnualSavings(input)` + `RoiInputSchema`                  |
| `src/lib/tools/calculations/discovery-timeline.ts`                  | NEW — pure `buildDiscoverySchedule(input)` + `DiscoveryInputSchema`          |
| `src/lib/tools/calculations/__tests__/*.test.ts`                    | NEW — one per calculation module                                             |
| `src/lib/tools/formatters.ts`                                       | NEW — shared `formatCurrency()`, `clamp()`, `formatHours()`                  |
| `src/components/capture/EmailCapture.tsx`                           | REFERENCE (from wf 4.1) — embedded in the `<ToolShell>` capture slot         |
| `src/components/site/Container.tsx`                                 | REFERENCE (from wf 1.4) — used by `<ToolShell>` and the `/tools` index       |
| `src/components/site/Header.tsx`                                    | MODIFY (Phase 3.2) — add `/tools` nav link                                   |
| `src/app/sitemap.ts`                                                | MODIFY (Phase 3.2) — import `getAllTools()` and append tool routes           |
| `src/app/globals.css`                                               | REFERENCE — brand tokens already defined by wf 1.3                           |

**Important:** The four tools do NOT each get a hand-written `src/app/tools/{slug}/page.tsx` file. `src/app/tools/[slug]/page.tsx` reads `getToolBySlug(slug)` and renders the matching calculator component. That is the entire point of the registry — one dynamic route handles all tools. Adding a fifth tool later = one new calculator module + one new registry entry, zero new route files.

## Verification Plan

| Phase | Verification |
|-------|--------------|
| 1     | `npm run lint` clean. `npm test` — `ToolSchema` unit tests pass, registry test green (empty registry is valid), `<ToolShell>` renders children + result slots + conditional capture, `<ToolCard>` renders tool metadata. `npm run build` clean. Visiting `/tools` in `npm run dev` renders the empty-state copy ("More tools landing soon."). Visiting `/tools/bogus` 404s. |
| 2     | Each pure calculation function passes its unit-test fixture table. Each calculator component renders `<ToolShell>`, accepts input changes via `useState`, computes a result, and surfaces it in the result slot. `<EmailCapture source="tool-{slug}" />` is absent before first calc, present after. Every tool accessible at `/tools/{slug}` under `npm run dev`. `npm run build` generates static params for all four tools. |
| 3     | Per-tool `generateMetadata` produces unique `<title>` + `<meta description>` visible in `view-source:` for each route. JSON-LD `SoftwareApplication` block present on every tool page and validates at https://validator.schema.org. `/sitemap.xml` lists `/tools` + all four tool routes. Header nav shows a `/tools` link, highlighted when the active path starts with `/tools`. Lighthouse local run on every tool route: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90. Keyboard-only walkthrough reaches every input, submit button, and capture form without getting stuck. |
| All   | `npm run lint` clean. `npm test` green + coverage still ≥ thresholds (70/80/80/80). `npm run build` clean. Manual smoke (against `npm run start`): `/tools`, `/tools/project-scoping`, `/tools/pricing`, `/tools/roi`, `/tools/discovery-timeline`, `/sitemap.xml` lists all five of those URLs. Submit a test email on a result page — `wf`'s Resend capture logs the hit with `source=tool-{slug}`. |

## Phase Documentation

- [Phase 1: Foundation](./phase-1-foundation.md) — `Tool` schema, registry, `<ToolShell>`, `/tools` index + dynamic route (2 sections)
- [Phase 2: Calculators](./phase-2-calculators.md) — four calculators packaged as two merged sections (Scoping + Pricing; ROI + Discovery Timeline)
- [Phase 3: Polish](./phase-3-polish.md) — per-tool SEO/JSON-LD + sitemap integration + nav link + a11y/perf sweep (single merged section)

## Dependencies to Add

**None.** Every dependency this job needs (`zod`, `resend`, `@testing-library/*`, `vitest`, Tailwind, React 19) is already installed by `website-foundation` or the initial scaffold.

## Open Items (Resolve During Implementation)

- **Calculator math constants** (multipliers, base values for the four calculators in Phase 2) — the plan specifies the shape of each calculation but the exact tuning coefficients (`BASE_WEEKS.web-app = 6`, `complexityMultiplier.enterprise = 2.0`, etc.) are starting guesses. `/red` should write tests against a fixture table of known-good inputs/outputs; `/green` can tune coefficients to match that table. The tuning should not drift during `/refactor`.
- **Site-shell nav active-state pattern** — `wf` 1.4 may or may not already implement `usePathname()`-based active nav. If it doesn't, Phase 3.2 of this job adds it.

## Section IDs for TDD Workflow

Each feature maps to one section ID used by `/discovery`, `/red`, `/green`, `/refactor`. Section IDs use the canonical slug `free-tools`, not the alias `ft`.

| Section ID          | Feature                                                     |
|---------------------|-------------------------------------------------------------|
| `free-tools-1.1`    | Tool schema + empty registry + `<ToolShell>` layout         |
| `free-tools-1.2`    | `/tools` index + `/tools/[slug]` dynamic route              |
| `free-tools-2.1`    | Scoping + Pricing calculators                               |
| `free-tools-2.2`    | ROI + Discovery Timeline calculators                        |
| `free-tools-3.1`    | SEO + JSON-LD + sitemap + nav + a11y/perf sweep             |

These IDs are consumed by `pipeline/active/session.yaml` and used as directory names under `pipeline/active/`.
