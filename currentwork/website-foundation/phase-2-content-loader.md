# Phase 2: Content Loader

**Total Size: L + M**
**Prerequisites: Phase 1 complete (Case schema, Zod validators, design system, site shell)**
**New Types: None (schemas already exist)**
**New Files: `mdx-components.tsx`, `src/lib/content/loader.ts`, `src/lib/content/episodes.ts`, `src/lib/content/cases.ts`, `src/content/episodes/pilot-party-masters-discovery.mdx`, `src/content/cases/party-masters.mdx`**

Phase 2 turns the schema + shell into a working content pipeline: MDX wired
into Next.js 16, a typed loader that reads files, validates against the Zod
schemas from Phase 1, and returns strict records to server components, plus
one episode and one case of seed content.

---

## Feature 2.1: MDX Pipeline + Content Loaders

**Complexity: L** — Install the MDX packages, configure `next.config.ts`,
create the required `mdx-components.tsx` root file, and build the
filesystem-driven content discovery with dynamic imports and Zod validation.

### Problem

Next.js 16 does not process `.mdx` files out of the box. Without the MDX
packages and configuration, content files can't be imported. And once MDX is
wired, every page in Phase 3 needs typed structured data — episode titles for
the index, case summaries for the homepage, etc. Pages can't directly import
MDX files when they also need to iterate "all episodes ordered by date". The
loader is the layer that does filesystem discovery + dynamic import + Zod
validation once, and exposes clean typed accessors to the rest of the app.

### Implementation

#### MDX Wiring

Install the packages:

```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

**MODIFY** `next.config.ts` — wrap with `createMDX()`, extend `pageExtensions`.
Keep the existing `output: "standalone"` setting intact.

```ts
import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  output: 'standalone',
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
};

const withMDX = createMDX({
  // Add remark/rehype plugins here as the site grows.
  // For Phase 2 we keep the pipeline plain to minimize build-time surprises.
});

export default withMDX(nextConfig);
```

**NEW** `mdx-components.tsx` at the project root (required by `@next/mdx` for
App Router — will not work without it per the Next.js docs):

```tsx
import type { MDXComponents } from 'mdx/types';

const components: MDXComponents = {
  // Lightweight brand styling for MDX-rendered content.
  // Extend with custom components (Callout, Figure, etc.) as the site grows.
  h1: ({ children }) => (
    <h1 className="font-display text-4xl font-semibold tracking-tight mt-12 mb-4">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-2xl font-semibold tracking-tight mt-10 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-xl font-semibold tracking-tight mt-8 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-4 leading-relaxed text-foreground">{children}</p>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-link underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-4 list-disc pl-6 space-y-2">{children}</ul>
  ),
  code: ({ children }) => (
    <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-sm">
      {children}
    </code>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
```

#### Content Loader Utilities

**NEW** `src/lib/content/loader.ts` — the generic discovery + import + validation engine:

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { type ZodType } from 'zod';

interface LoadOptions<T> {
  directory: string;
  schema: ZodType<T>;
}

interface LoadedEntry<T> {
  meta: T;
  Component: () => JSX.Element;
}

/**
 * Discover every .mdx file in `directory`, dynamically import its default
 * export (React component) and named `meta` export, validate `meta` against
 * `schema`, and return the validated results.
 *
 * Throws with an actionable error if any file's meta export fails validation.
 * This is intentional — invalid content should crash the build, not silently
 * render wrong.
 */
export async function loadContent<T>(
  options: LoadOptions<T>,
): Promise<LoadedEntry<T>[]> {
  const absoluteDir = path.resolve(process.cwd(), options.directory);
  const files = await fs.readdir(absoluteDir);
  const mdxFiles = files.filter((file) => file.endsWith('.mdx'));

  const entries = await Promise.all(
    mdxFiles.map(async (file) => {
      const slug = file.replace(/\.mdx$/, '');
      const mod = await import(
        /* webpackInclude: /\.mdx$/ */
        `@/content/${path.basename(absoluteDir)}/${slug}.mdx`
      );
      const parseResult = options.schema.safeParse(mod.meta);
      if (!parseResult.success) {
        throw new Error(
          `[content loader] Invalid meta in ${file}:\n${parseResult.error.message}`,
        );
      }
      return {
        meta: parseResult.data,
        Component: mod.default as () => JSX.Element,
      };
    }),
  );

  return entries;
}
```

> **Implementation note**: Next.js 16 + Turbopack has constraints around
> dynamic `import()` paths. If the `webpackInclude` magic comment or the
> template-literal path doesn't resolve, fall back to an explicit switch over
> known slugs driven by `readdir()`, or use per-entry static imports inside
> `episodes.ts` / `cases.ts`. The `/red` agent should write a test that proves
> the loader resolves at least one seed file end-to-end; if that test fails,
> escalate to static imports.

**NEW** `src/lib/content/episodes.ts`:

```ts
import type { Episode } from '@/content/schemas';
import { EpisodeSchema } from '@/content/schemas';
import { loadContent } from './loader';

let episodesCache: Awaited<ReturnType<typeof loadContent<Episode>>> | null = null;

async function loadAll() {
  if (!episodesCache) {
    episodesCache = await loadContent<Episode>({
      directory: 'src/content/episodes',
      schema: EpisodeSchema,
    });
  }
  return episodesCache;
}

export async function getAllEpisodes(): Promise<Episode[]> {
  const entries = await loadAll();
  return entries
    .map((entry) => entry.meta)
    .sort((a, b) => {
      const aDate = a.publishedAt ?? '';
      const bDate = b.publishedAt ?? '';
      return bDate.localeCompare(aDate);
    });
}

export async function getEpisodeBySlug(slug: string): Promise<{
  meta: Episode;
  Component: () => JSX.Element;
} | null> {
  const entries = await loadAll();
  return entries.find((entry) => entry.meta.slug === slug) ?? null;
}

export async function getLatestEpisode(): Promise<Episode | null> {
  const episodes = await getAllEpisodes();
  return episodes[0] ?? null;
}
```

**NEW** `src/lib/content/cases.ts`:

```ts
import type { Case } from '@/content/schemas';
import { CaseSchema } from '@/content/schemas';
import { loadContent } from './loader';

let casesCache: Awaited<ReturnType<typeof loadContent<Case>>> | null = null;

async function loadAll() {
  if (!casesCache) {
    casesCache = await loadContent<Case>({
      directory: 'src/content/cases',
      schema: CaseSchema,
    });
  }
  return casesCache;
}

export async function getAllCases(): Promise<Case[]> {
  const entries = await loadAll();
  return entries
    .map((entry) => entry.meta)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getCaseBySlug(slug: string): Promise<{
  meta: Case;
  Component: () => JSX.Element;
} | null> {
  const entries = await loadAll();
  return entries.find((entry) => entry.meta.slug === slug) ?? null;
}
```

### Tests (red phase of section `website-foundation-2.1`)

Colocate under `src/lib/content/__tests__/`:

- `loader.test.ts` — mock `fs.readdir` + dynamic import, verify discovery, schema validation happy path, validation failure throws readable error
- `episodes.test.ts` — happy path with seed episode, `getLatestEpisode` returns most recent by `publishedAt`, slug lookup returns null for unknown slug
- `cases.test.ts` — happy path with seed case, alphabetical sort, slug lookup returns null for unknown slug

### Design Decisions

- **Keep the MDX pipeline plain in Phase 2** — no remark-gfm, no rehype-slug, no syntax highlighting. These are valuable but each adds build-time risk, and Turbopack has constraints on non-serializable plugin options. Phase 4's polish section can layer in GFM and slug anchors once the content pipeline is proven stable.
- **`pageExtensions` includes `md` + `mdx`** — per the Next.js docs, this is required even though we don't route MDX files directly via file-based routing (episodes and cases use dynamic `[slug]` routes that import from `src/content/`).
- **MDX components are minimal and inline-styled with Tailwind** — no separate CSS file. The design tokens from Phase 1.3 drive everything via `var()`-backed utilities.
- **Root-level `mdx-components.tsx`, not in `src/`** — the Next.js docs explicitly say it lives "at the same level as `pages` or `app`, or inside `src` if applicable". Root placement is the documented default and less likely to trip path-resolution issues.
- **Module-level cache (`episodesCache`, `casesCache`)** — server components may call `getAllEpisodes()` multiple times per request. Since content is statically known at build time, caching once per process is safe and avoids re-reading the filesystem. Next.js server components already live in a request-scoped context, but the cache is harmless because the underlying data is immutable within a build.
- **Loader returns `{ meta, Component }`** — detail pages need both the metadata (for `<title>`, breadcrumbs, badges) and the React component (for the MDX body). Returning both in a single pass avoids re-importing the file.
- **Validation errors crash loudly** — `safeParse` + throw, not silent skip. If a content author ships an invalid file, the build fails with the file path and a readable Zod message. That is the correct failure mode for a static site.
- **Sort order is domain-specific per loader** — episodes by `publishedAt` desc, cases alphabetically. The loader doesn't assume a universal sort.
- **`getLatestEpisode()` as a named helper** — the homepage needs "the single latest episode" as a distinct concept from "the full list". Expressing that as a helper keeps the homepage code clean.

### Files

| Action | File                                           |
|--------|------------------------------------------------|
| MODIFY | `next.config.ts`                               |
| NEW    | `mdx-components.tsx`                           |
| MODIFY | `package.json` (via `npm install`)             |
| NEW    | `src/lib/content/loader.ts`                    |
| NEW    | `src/lib/content/episodes.ts`                  |
| NEW    | `src/lib/content/cases.ts`                     |
| NEW    | `src/lib/content/__tests__/loader.test.ts`     |
| NEW    | `src/lib/content/__tests__/episodes.test.ts`   |
| NEW    | `src/lib/content/__tests__/cases.test.ts`      |

---

## Feature 2.2: Seed Content

**Complexity: M** — One real episode MDX and one placeholder Party Masters
case MDX, each exporting a typed `meta` object that passes Zod validation.

### Problem

The loader from 2.1 is impossible to test end-to-end without at least one
concrete content file per type. Phase 3 pages are impossible to visually verify
without at least one episode and one case. Seed content is the bridge.

### Implementation

**NEW** `src/content/episodes/pilot-party-masters-discovery.mdx`:

```mdx
export const meta = {
  id: 'ep-s1e01',
  slug: 'pilot-party-masters-discovery',
  title: 'Pilot — Discovery for Party Masters',
  series: 'The Party Masters Build',
  season: 1,
  act: 1,
  episodeNumber: 1,
  tier: 'flagship',
  pillar: 'workflow',
  summary:
    'The pilot episode. Scoping a real CRM project for Andy, documenting how an AI agent team runs discovery before a single line of code is written.',
  sourceMaterialIds: ['sm-party-masters-interview-notes', 'sm-party-masters-proposal-draft'],
  lllEntryUrls: ['https://largelanguagelibrary.ai/entries/crm-discovery-framework'],
  durationMinutes: 42,
  publishedAt: '2026-04-15T12:00:00.000Z',
  youtubeUrl: 'https://www.youtube.com/watch?v=PLACEHOLDER',
};

## What you'll see in this episode

A walk-through of the discovery process for Party Masters, a real CRM
engagement. The focus is on *how* an AI-run consultancy does discovery — the
templates, the questions, the folder structure, the handoff artifacts — not on
shipping code.

## The stack for this run

- Claude (planning + architecture + writeup)
- A discovery template pack (linked in the show notes)
- Real client calls, not mocked ones

## Links referenced

Crosslinks to the structured knowledge entries in The Large Language Library
appear in the footer below. This episode feeds one new entry: the CRM discovery
framework.
```

**NEW** `src/content/cases/party-masters.mdx` (placeholder copy — the "Real
Party Masters case content" is a separate future task):

```mdx
export const meta = {
  id: 'case-party-masters',
  slug: 'party-masters',
  title: 'Party Masters — Event Management CRM',
  client: 'Party Masters (Andy R.)',
  status: 'active',
  summary:
    'Custom CRM and workflow system for a party-rental and events business. Replacing a stack of spreadsheets, email threads, and sticky notes with a single source of truth.',
  problem:
    'Multi-tool workflow fragmentation causing missed bookings, invoice errors, and 10+ hours a week of manual reconciliation.',
  marketResearch:
    'See the episode series for the documented research phase.',
  discoveryProcess:
    'See the episode series for the discovery phase walkthrough.',
  technicalDecisions:
    'See the episode series for the architectural decision log.',
  deliverables: [
    'Booking + inventory management',
    'Customer database with segmentation',
    'Invoice generation + payment tracking',
    'Equipment scheduling',
  ],
  outcome:
    'Engagement is active — outcome and metrics will land here after the build ships.',
  startedAt: '2026-03-01T00:00:00.000Z',
  relatedEpisodeIds: ['ep-s1e01'],
  lllEntryUrls: ['https://largelanguagelibrary.ai/entries/crm-discovery-framework'],
};

## Overview

Party Masters is the launch case study for the Travis Gautier channel — a real,
active engagement being documented episode by episode. This placeholder page
holds the route and metadata. The narrative body is backfilled as the build
progresses on camera.

## Where to find the full story

Every discovery call, decision, and delivery is documented in
[the episode series](/episodes). This page will be updated with the full
written case once the engagement ships.
```

### Design Decisions

- **Episode metadata is realistic, case metadata is placeholder** — the episode is a genuine pilot scenario that matches the brand doc exactly. The case study is a deliberate placeholder because real case content is a separate content-writing task outside this job's scope.
- **MDX body is intentionally short** — just enough to prove the pipeline renders MDX correctly. Rich styling (callouts, embedded components) is Phase 4 polish.
- **`sourceMaterialIds` references that may not exist yet** — the existing `Episode` schema requires a `sourceMaterialIds: string[]` field. We ship placeholder IDs that *could* become real source-material records later. For now the episode page renders the IDs as a simple list; full source-material rendering is deferred until a `SourceMaterial` loader exists (future job).
- **Dates in ISO 8601** — required by Zod's `.datetime()` validator from Phase 1.2.
- **`youtubeUrl: 'https://www.youtube.com/watch?v=PLACEHOLDER'`** — fails the URL check pass (it's technically a valid URL, just not a working video). This is fine for a seed; real episodes get real URLs on publish.

### Files

| Action | File                                                      |
|--------|-----------------------------------------------------------|
| NEW    | `src/content/episodes/pilot-party-masters-discovery.mdx`  |
| NEW    | `src/content/cases/party-masters.mdx`                     |

---

## Phase 2 Exit Criteria

- `@next/mdx` + dependencies installed
- `mdx-components.tsx` present at project root
- `next.config.ts` wrapped with `createMDX()`
- `npm run build` passes — MDX files compile
- `getAllEpisodes()`, `getEpisodeBySlug()`, `getLatestEpisode()` return Zod-validated records under unit tests
- `getAllCases()`, `getCaseBySlug()` return Zod-validated records under unit tests
- Invalid MDX metadata throws a readable error at load time (error path test)
- `npm run lint` clean, `npm test` green, coverage still meets thresholds
