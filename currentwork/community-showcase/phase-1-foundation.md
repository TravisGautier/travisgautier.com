# Phase 1: Foundation

**Total Size: M + M**
**Prerequisites:** `website-foundation` shipped — brand tokens, site shell, MDX pipeline (`createMDX()` wrap, `mdx-components.tsx`, `pageExtensions` extended), generic content loader (`src/lib/content/loader.ts`), validators module (`src/content/schemas/validators.ts`), `zod` installed, `next/image` configured.
**New Types:** `Showcase`, `Builder`
**New Files:** `src/content/schemas/showcase.ts`, `src/content/showcase/party-masters-team.mdx`, `public/showcase/party-masters-team/hero.jpg`, `src/lib/content/showcase.ts`, `docs/showcase-authoring.md` + co-located tests.

Phase 1 is pure plumbing. After it ships, there is no visible UI yet — but the
type system, the runtime validator, the loader, and the single seed entry all
exist and round-trip cleanly. Phase 2 can then build pages against a known-good
data layer. Every feature in this phase follows an established pattern from
`website-foundation` (`Episode`, `Case`, `SourceMaterial` all went through the
same shape), so there are no architecture decisions left to make here.

---

## Feature 1.1: `Showcase` + `Builder` Schema + Zod Validator

**Complexity: M** — Two interfaces and one Zod schema. Straightforward but
wide: the `Showcase` type has ~12 fields plus a nested `Builder` block.

### Problem

The showcase gallery needs a typed content model before any content can be
written, validated, or loaded. Authors (editorial-only, for now) write MDX
files with frontmatter — the frontmatter has to match `Showcase` exactly, or
the build fails at load time with a useful error. Without runtime validation,
a typo in a date field or a missing hero image only surfaces at the request
that finally hits the page.

Shape follows the existing `Episode` and `Case` patterns: a TypeScript
interface in `src/content/schemas/`, a matching Zod schema in
`src/content/schemas/validators.ts`, and a re-export from the barrel.

### Implementation

**NEW** `src/content/schemas/showcase.ts`:

```ts
export interface Builder {
  name: string;
  handle?: string;          // @name (display — e.g. "@kirahall")
  handleUrl?: string;       // full URL for the handle (github, x, bluesky, …)
  company?: string;
  avatarUrl?: string;       // external URL or /showcase/{slug}/avatar.jpg
}

export interface Showcase {
  id: string;
  slug: string;             // kebab-case, matches /showcase/[slug]
  title: string;
  summary: string;          // 1–2 sentences; used on cards + OG description
  featured: boolean;        // promoted to hero grid on /showcase
  publishedAt: string;      // ISO 8601 date, sort key
  builder: Builder;
  stack: string[];          // tech tags, e.g. ["Next.js", "Cloudflare", "Claude"]
  heroImage: string;        // absolute path under /public, e.g. /showcase/{slug}/hero.jpg
  gallery?: string[];       // additional screenshot paths
  liveUrl?: string;
  repoUrl?: string;
  relatedEpisodeSlug?: string;  // resolves to /episodes/{slug}
  relatedCaseSlug?: string;     // resolves to /cases/{slug}
  lllEntryUrls: string[];       // same shape as Episode.lllEntryUrls
}
```

**MODIFY** `src/content/schemas/index.ts` — add the re-export:

```ts
export * from './content-tier';
export * from './content-pillar';
export * from './episode';
export * from './source-material';
export * from './case';            // from wf 1.1
export * from './showcase';        // ← new
export * from './validators';      // from wf 1.2
```

**MODIFY** `src/content/schemas/validators.ts` — add `ShowcaseSchema`
alongside the existing `EpisodeSchema`, `SourceMaterialSchema`, `CaseSchema`.
The shape mirrors the TS interface one-to-one:

```ts
import { z } from 'zod';

// ... existing EpisodeSchema, SourceMaterialSchema, CaseSchema ...

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const PUBLIC_PATH = /^\/[\w\-./]+$/;
const HTTP_URL = z.string().url().refine((v) => v.startsWith('http://') || v.startsWith('https://'), {
  message: 'must be an http(s) URL',
});

export const BuilderSchema = z.object({
  name: z.string().min(1).max(80),
  handle: z.string().regex(/^@[\w-]+$/).optional(),
  handleUrl: HTTP_URL.optional(),
  company: z.string().max(120).optional(),
  avatarUrl: z.union([HTTP_URL, z.string().regex(PUBLIC_PATH)]).optional(),
});

export const ShowcaseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(SLUG),
  title: z.string().min(4).max(120),
  summary: z.string().min(20).max(280),
  featured: z.boolean(),
  publishedAt: z.string().regex(ISO_DATE),
  builder: BuilderSchema,
  stack: z.array(z.string().min(1).max(40)).min(1).max(12),
  heroImage: z.string().regex(PUBLIC_PATH),
  gallery: z.array(z.string().regex(PUBLIC_PATH)).max(10).optional(),
  liveUrl: HTTP_URL.optional(),
  repoUrl: HTTP_URL.optional(),
  relatedEpisodeSlug: z.string().regex(SLUG).optional(),
  relatedCaseSlug: z.string().regex(SLUG).optional(),
  lllEntryUrls: z.array(HTTP_URL).max(8),
});
```

### Tests (red phase of section `community-showcase-1.1`)

`src/content/schemas/__tests__/validators.test.ts` — add a `describe('ShowcaseSchema', …)` block:

- `ShowcaseSchema.safeParse(validFixture)` succeeds
- Rejects `slug: 'Bad_Slug'` (not kebab-case)
- Rejects `slug: 'UPPER'` (uppercase)
- Rejects empty `title`, title under 4 chars, title over 120 chars
- Rejects `summary` under 20 chars, over 280 chars
- Rejects `featured: 'yes'` (must be boolean)
- Rejects `publishedAt: '04/11/2026'` (not ISO)
- Accepts `publishedAt: '2026-04-11'` and `publishedAt: '2026-04-11T00:00:00Z'`
- Rejects `stack: []` (empty array) and `stack` > 12 entries
- Rejects `heroImage: 'https://example.com/hero.jpg'` (external not allowed for hero)
- Rejects `heroImage: 'hero.jpg'` (relative not allowed)
- Accepts `heroImage: '/showcase/foo/hero.jpg'`
- Accepts `gallery` undefined and as empty array
- Rejects `gallery` with > 10 entries
- Rejects `lllEntryUrls: ['not-a-url']`
- Accepts `lllEntryUrls: []`
- `BuilderSchema` — rejects empty `name`; rejects `handle: 'kirahall'` (missing `@`); rejects `handleUrl: 'kirahall.dev'` (no protocol); accepts `avatarUrl: '/showcase/foo/avatar.jpg'`; accepts `avatarUrl: 'https://github.com/…'`

Also export a valid fixture (`validShowcaseFixture()`) from the test file so
1.2 can reuse it.

### Design Decisions

- **`Showcase` and `Builder` interfaces live in `showcase.ts`; `ShowcaseSchema` and `BuilderSchema` live in `validators.ts`** — this matches the `Episode` / `EpisodeSchema` split from `wf` 1.1 and 1.2. Types are the public API; validators are infrastructure.
- **`heroImage` as a `/public/…` path, not a URL** — every hero is local per the scope decision. A regex keeps the runtime honest instead of trusting TypeScript. Rejecting external URLs for the hero avoids half the gallery going to dead CDNs in a year.
- **`avatarUrl` accepts both local paths and HTTP(S) URLs** — builders often link to their existing GitHub/X avatars. The local-path branch is for when a builder provides a custom avatar to embed in the repo.
- **`handle` is `@name` (display), `handleUrl` is the href** — separating them means the card component can render `@kirahall` as the visible text while the link goes to the right place. If the builder only supplies a URL, `handle` renders as a cleaned-up fallback (e.g. `github.com/kirahall`).
- **`featured: boolean`, not `status: 'draft' | 'featured' | 'archived'`** — per the scope decision. A flat boolean is the minimum field that supports the hero-grid split. Draft state can come later by adding `draft?: boolean`; archived state can come later by adding `archived?: boolean`. No churn needed now.
- **`stack` is a bare `string[]`, not a closed enum** — tech stacks vary too much to enumerate. The validator caps length + per-entry length to keep the card layout predictable.
- **`lllEntryUrls` always present, possibly empty** — matches the `Episode` shape from `wf`. Empty-array-as-default means the crosslink component can render `null` cleanly.
- **`id` field distinct from `slug`** — `id` is an internal identifier (e.g. `showcase-party-masters-team`); `slug` is the URL segment. This mirrors `Episode.id` vs `Episode.slug`. For now, conventionally `id = 'showcase-' + slug`. The split exists so future features (e.g. changing a slug without losing references) remain cheap.
- **`publishedAt` accepts both date-only and full ISO timestamps** — authors typically write dates, not timestamps. The loader parses both and the UI formats via `Intl.DateTimeFormat`.
- **Schema lives in `validators.ts` rather than `showcase.ts`** — keeps `showcase.ts` zero-dependency on `zod` (the type barrel should stay light so it can be imported from anywhere, including files that don't need runtime validation).
- **Per-field length limits** — every string field has a max length. Prevents a runaway 10 KB summary from exploding OG metadata or sitemap size. Limits are generous enough for normal copy.

### Files

| Action | File                                                 |
|--------|------------------------------------------------------|
| NEW    | `src/content/schemas/showcase.ts`                    |
| MODIFY | `src/content/schemas/index.ts`                       |
| MODIFY | `src/content/schemas/validators.ts`                  |
| MODIFY | `src/content/schemas/__tests__/validators.test.ts`   |

---

## Feature 1.2: Showcase Content Loader + Seed Content + Authoring Guide

**Complexity: M** — Directory-scan loader (with featured-first sort, Zod
validation at load time, and an empty-directory guard) shipped together with
the single seed MDX entry, hero image, authoring guide, and the integration
test that proves the full filesystem → loader → Zod → page-data round-trip
works. Merging the loader with the seed eliminates a chicken-and-egg run
where the loader's empty-directory guard would fail any build that lacks a
seed entry.

### Problem

Two chained concerns ship as one feature here:

1. **Loader shape.** The pages in Phase 2 need `getAllShowcaseEntries()` and
   `getShowcaseEntryBySlug()` functions that return typed, validated data.
   The loader runs at build time (server components only), so the file-read
   pattern from `wf` 2.2 applies. Results must be featured-first then
   most-recent-first so the index renders in a stable order. A totally-empty
   showcase directory should fail the build loudly, not render an empty
   gallery — but the "near-empty" one-or-two-entry state is normal.

2. **Seed and authoring guide.** The loader needs at least one entry to
   function (per the empty-directory guard), and Phase 2 pages need
   something to render so their tests can exercise real data. Future agents
   adding new showcase entries need a short reference for the frontmatter
   shape and the image-placement convention — the TS type is the source of
   truth but a prose guide is faster to read.

The seed entry is intentionally a self-referential placeholder: it
showcases the Travis Gautier team's own Party Masters project, which is also
the subject of the `party-masters` case study from `wf` 2.3. This creates
one valid round-trip through `relatedCaseSlug` without depending on a
third-party submission.

### Implementation

#### Content Loader

**NEW** `src/lib/content/showcase.ts`:

```ts
import type { Showcase } from '@/content/schemas';
import { ShowcaseSchema } from '@/content/schemas/validators';
import { loadContentDirectory } from '@/lib/content/loader';

// Relative to repo root; `loadContentDirectory` resolves it via process.cwd().
const SHOWCASE_DIR = 'src/content/showcase';

let cache: readonly Showcase[] | null = null;

function compareEntries(a: Showcase, b: Showcase): number {
  // Featured first.
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  // Then most recent publishedAt.
  const timeDiff = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  if (timeDiff !== 0) return timeDiff;
  // Stable tie-break on slug.
  return a.slug.localeCompare(b.slug);
}

async function loadAll(): Promise<readonly Showcase[]> {
  if (cache) return cache;

  const raw = await loadContentDirectory(SHOWCASE_DIR); // from wf 2.2
  const entries = raw
    .map((frontmatter) => ShowcaseSchema.parse(frontmatter))
    .sort(compareEntries);

  if (entries.length === 0) {
    throw new Error(
      `[showcase] ${SHOWCASE_DIR} contains zero entries. The gallery must ` +
        `have at least one seed entry. Add an MDX file or delete the /showcase route.`,
    );
  }

  cache = Object.freeze(entries);
  return cache;
}

export async function getAllShowcaseEntries(): Promise<readonly Showcase[]> {
  return loadAll();
}

export async function getShowcaseEntryBySlug(
  slug: string,
): Promise<Showcase | undefined> {
  const all = await loadAll();
  return all.find((entry) => entry.slug === slug);
}
```

#### Seed Content

**NEW** `src/content/showcase/party-masters-team.mdx`:

```mdx
---
id: showcase-party-masters-team
slug: party-masters-team
title: Party Masters — agent-driven venue ops
summary: The in-house Party Masters discovery build, by the Travis Gautier core team — the first project shipped end-to-end with the methodology.
featured: true
publishedAt: 2026-04-11
builder:
  name: Travis Gautier Core Team
  handle: "@travisgautier"
  handleUrl: https://github.com/travisgautier
  company: Travis Gautier
stack:
  - Next.js
  - Tailwind
  - Claude Code
  - Vitest
  - TDD pipeline
heroImage: /showcase/party-masters-team/hero.jpg
liveUrl: https://travisgautier.com/cases/party-masters
repoUrl: https://github.com/travisgautier/party-masters
relatedCaseSlug: party-masters
lllEntryUrls: []
---

## The build

Party Masters is the anchor case the Travis Gautier methodology was originally
built around. The discovery phase was documented on-camera and ran through
the same `/discovery → /red → /green → /refactor` pipeline the rest of the
channel uses.

See the full [case study](/cases/party-masters) for the timeline, findings,
and outcomes.
```

**NEW** `public/showcase/party-masters-team/hero.jpg` — 1600×900 placeholder
image (brand colors, title overlay). Committed as a binary asset. `/green`
should either drop in a temporary branded-gradient JPEG or coordinate with the
user to supply a real screenshot; either is acceptable for v1.

#### Authoring Guide

**NEW** `docs/showcase-authoring.md`:

```markdown
# Showcase Authoring Guide

Internal reference for adding entries to the `/showcase` community gallery.

## Where things live

- **MDX file**: `src/content/showcase/{slug}.mdx`
- **Images**: `public/showcase/{slug}/` (hero, gallery entries, optional avatar)
- **URL**: `/showcase/{slug}` (`slug` matches the filename)

## Frontmatter shape

All fields validated at build time by `ShowcaseSchema`
(`src/content/schemas/validators.ts`). See the TS interface
`Showcase` in `src/content/schemas/showcase.ts` for the canonical definition.

Required fields: `id`, `slug`, `title`, `summary`, `featured`, `publishedAt`,
`builder` (with `name`), `stack`, `heroImage`, `lllEntryUrls`.

Optional fields: `gallery`, `liveUrl`, `repoUrl`, `relatedEpisodeSlug`,
`relatedCaseSlug`, and all `builder` fields except `name`.

## Conventions

- **Slug**: kebab-case, matches the filename exactly.
- **`id`**: prefix with `showcase-` (`showcase-{slug}`).
- **`featured`**: `true` for the hero grid. Default `false` unless the entry is being promoted to the top of `/showcase`.
- **Hero image**: 1600×900 JPEG or PNG, stored at `public/showcase/{slug}/hero.jpg`. The schema path starts with `/` because it's relative to `/public` — `next/image` resolves it directly.
- **Gallery images**: optional; store in the same `public/showcase/{slug}/` folder.
- **`stack`**: 1–12 tech tags, kept short and human-readable.
- **`lllEntryUrls`**: absolute URLs to `largelanguagelibrary.ai` entries. Leave as `[]` if none.
- **`publishedAt`**: ISO date (`YYYY-MM-DD` or full timestamp). Sort key for the index page.

## Body

Everything below the closing `---` is MDX. Write the project writeup as free
prose — sections, screenshots (via markdown image syntax, pointed at
`/showcase/{slug}/…`), links. The site shell, hero, builder block, stack
pills, and LLL crosslinks all render above and below the body automatically.

## Adding an entry

1. Create `src/content/showcase/{slug}.mdx` with the frontmatter above.
2. Drop the hero image into `public/showcase/{slug}/hero.jpg`.
3. Run `npm run dev`, visit `/showcase/{slug}`, verify the page renders.
4. Run `npm test` to confirm no validator regressions.
5. Run `npm run build` to confirm `generateStaticParams` picks up the new slug.

If frontmatter doesn't match `ShowcaseSchema`, the build fails at module load
with a Zod error pointing at the bad field.
```

### Tests (red phase of section `community-showcase-1.2`)

#### Loader unit tests

`src/lib/content/__tests__/showcase.test.ts`:

- Mock `@/lib/content/loader` to return a fixture array of three unsorted entries: one featured with an old date, one non-featured with a newer date, one non-featured with an older date.
- `getAllShowcaseEntries()` returns them sorted: featured first, then by `publishedAt` descending.
- Tie-break test: two entries with identical `publishedAt` but different slugs → result order is alphabetical by slug.
- `getShowcaseEntryBySlug('bogus')` → `undefined`
- `getShowcaseEntryBySlug` against a known slug returns the correct entry
- Empty-directory guard: mock `loadContentDirectory` to return `[]` → `getAllShowcaseEntries()` throws with a message containing `src/content/showcase`
- Zod validation guard: mock `loadContentDirectory` to return a malformed entry (missing `title`) → `getAllShowcaseEntries()` throws the Zod error (assert on `ZodError` type)
- Result array is frozen (`Object.isFrozen(result) === true`) to prevent callers from mutating shared state

#### Seed integration tests

`src/lib/content/__tests__/showcase.integration.test.ts` (or folded into the
unit test file as a `describe('seed content', …)` block):

- `getAllShowcaseEntries()` (running against the real `src/content/showcase/` directory, no mocks) returns an array of length ≥ 1
- The seed entry (`party-masters-team`) is present and passes `ShowcaseSchema.safeParse`
- `getShowcaseEntryBySlug('party-masters-team')` returns the seed entry with the expected `title`, `featured`, and `relatedCaseSlug` fields
- The seed entry's `heroImage` path exists on disk (`fs.existsSync(join('public', entry.heroImage))`)
- The `lllEntryUrls` array is present (may be empty)

### Design Decisions

#### Loader

- **Cache the parsed + sorted result** — build-time content rarely changes within a run. The cache makes `getShowcaseEntryBySlug` cheap for multiple page renders. Next.js build runs are short-lived processes so stale-cache risk is zero.
- **Empty-directory is a hard throw** — per the scope decision, a zero-entry gallery is a broken state. Throwing at module load fails `npm run build` loudly instead of shipping a dead route. The error message tells the author exactly where to look.
- **Featured-first comparator, not a filter + concat** — a single `.sort()` that honors the comparator yields one traversal and one stable result. Filtering into two arrays and concatenating is two allocations and a repeated sort-key computation.
- **`readonly Showcase[]` return type + `Object.freeze`** — protects the cache from callers that might `.sort()` or `.push()` in a handler. Matches the `free-tools` `getAllTools()` readonly convention.
- **Loader is `async`** — even though parsing is synchronous, the `loadContentDirectory` wf 2.2 helper is async because it does a filesystem read + dynamic `import()` of each MDX module. Callers already have to `await` their content loaders.
- **`Date.parse` for sorting, not a full `Date` object** — cheaper, and the comparator only cares about the numeric delta. Both date-only and full-ISO strings round-trip correctly through `Date.parse`.
- **Mutable `let cache` module-scoped** — the module is loaded once per build process; the cache only grows monotonically. No cache-invalidation logic needed because the process exits before anything could change.
- **No try/catch around `ShowcaseSchema.parse`** — Zod errors are already descriptive and should blow up the build. Swallowing them would hide bad frontmatter.

#### Seed + Guide

- **Self-referential seed entry** — using the Travis Gautier team's own Party Masters project as the seed avoids depending on external submissions during initial development and naturally tests the `relatedCaseSlug` link into `wf`'s case study tree. When real community projects exist, they replace this placeholder.
- **Seed is `featured: true`** — the Phase 2 index page tests assert that at least one entry renders in the hero grid. A featured seed keeps those tests deterministic without needing a second fixture.
- **Image is a committed binary, not a build-time download** — reproducible builds matter. Dropping a 1600×900 placeholder JPEG into `public/showcase/party-masters-team/hero.jpg` at feature-implementation time is acceptable even if the asset is later replaced with a real screenshot.
- **`docs/showcase-authoring.md` instead of inline README comments** — future agents grep `docs/` for authoring conventions. A dedicated doc surfaces cleanly in that search. The content is also short enough that it rarely needs updating.
- **Integration test hits the real filesystem** — proves the full loader → Zod → frontmatter round-trip works against actual content. Mocked unit tests prove the logic; the integration test proves the wiring.
- **No `gallery` on the seed entry** — the detail-page gallery renders conditionally. The seed being gallery-less tests the "no gallery" branch of Phase 2.2 (detail page). A second test fixture can exercise the gallery-present branch during 2.2 without needing a second real MDX file.
- **Loader and seed ship in one section** — without seed content, the loader's empty-directory guard fails any `npm run build`. Without the loader, the seed has no validator to round-trip against. Shipping them together means the integration test exercises both pieces of work end-to-end on first commit.

### Files

| Action | File                                                              |
|--------|-------------------------------------------------------------------|
| NEW    | `src/lib/content/showcase.ts`                                     |
| NEW    | `src/lib/content/__tests__/showcase.test.ts`                      |
| NEW    | `src/content/showcase/party-masters-team.mdx`                     |
| NEW    | `public/showcase/party-masters-team/hero.jpg`                     |
| NEW    | `docs/showcase-authoring.md`                                      |
| NEW    | `src/lib/content/__tests__/showcase.integration.test.ts` (or fold into the unit test file) |

---

## Phase 1 Exit Criteria

- `npm run lint` clean, `npm test` green, coverage still ≥ thresholds, `npm run build` clean
- `ShowcaseSchema.parse(validFixture)` succeeds and rejects every malformed fixture in the test suite
- `getAllShowcaseEntries()` returns the seed entry when called against the real `src/content/showcase/` directory
- `getShowcaseEntryBySlug('party-masters-team')` returns the seed entry
- `getShowcaseEntryBySlug('bogus')` returns `undefined`
- Empty-directory guard throws with a clear error message when tested against a mock-empty content dir
- `public/showcase/party-masters-team/hero.jpg` is committed and resolvable by `next/image`
- `docs/showcase-authoring.md` is committed and linked from nowhere yet (Phase 3.1 may or may not reference it)
- Phase 2 can start: each page feature has typed, validated data waiting for it
