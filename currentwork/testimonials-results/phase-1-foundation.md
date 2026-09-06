# Phase 1: Foundation

**Total Size: M + M**
**Prerequisites:** `website-foundation` shipped — brand tokens, site shell, MDX pipeline (`createMDX()` wrap, `mdx-components.tsx`, `pageExtensions` extended), generic content loader (`src/lib/content/loader.ts`), validators module (`src/content/schemas/validators.ts`), `zod` installed.
**New Types:** `Testimonial`, `TestimonialAuthor`
**New Files:** `src/content/schemas/testimonial.ts`, `src/lib/content/testimonials.ts`, three seed MDX files under `src/content/testimonials/`, `docs/testimonial-authoring.md` + co-located tests.

Phase 1 is pure plumbing. After it ships, there is no visible UI yet — but the type system, the runtime validator, the loader (including `getTestimonialCounts()`), and three seed entries all exist and round-trip cleanly. Phase 2 builds pages and components against a known-good data layer. Every feature in this phase follows the pattern established by `website-foundation` (`Episode`, `Case`, `SourceMaterial`) and mirrored by `community-showcase` 1.1–1.3, so there are no architecture decisions left to make here.

---

## Feature 1.1: `Testimonial` + `TestimonialAuthor` Schema + Zod Validator

**Complexity: M** — Two interfaces and two Zod schemas. Smaller than `Showcase` from `community-showcase` 1.1 (8 fields vs 14) but otherwise the same shape.

### Problem

The results wall needs a typed content model before any testimonial can be written, validated, or loaded. Authors (editorial-only, for now) write MDX files with frontmatter — the frontmatter has to match `Testimonial` exactly, or the build fails at load time with a useful error. Without runtime validation, a typo in the `publishedAt` field or a missing author name only surfaces when the page finally renders.

Shape follows the existing `Episode`, `Case`, and `Showcase` patterns: a TypeScript interface in `src/content/schemas/`, a matching Zod schema in `src/content/schemas/validators.ts`, and a re-export from the barrel.

### Implementation

**NEW** `src/content/schemas/testimonial.ts`:

```ts
export interface TestimonialAuthor {
  name: string;
  title?: string;           // e.g. "Founder", "Head of Ops"
  company?: string;         // e.g. "Parker Studio"
  avatarUrl?: string;       // external URL or /testimonials/{slug}/avatar.jpg
}

export interface Testimonial {
  id: string;
  slug: string;             // kebab-case, used as anchor on /results
  quote: string;            // 20–600 chars; the testimonial body
  author: TestimonialAuthor;
  metric?: string;          // optional outcome headline, e.g. "Saved 40 hours/month"
  verified: boolean;        // true = real client with permission → "Verified client" chip
  featured: boolean;        // promoted to the homepage strip + md:col-span-2 on /results
  publishedAt: string;      // ISO 8601 date, sort key
  relatedEpisodeSlug?: string;  // resolves to /episodes/{slug}
  relatedCaseSlug?: string;     // resolves to /cases/{slug}
  videoUrl?: string;            // reserved for future video testimonials; v1 UI ignores
  lllEntryUrls: string[];       // same shape as Episode.lllEntryUrls; may be empty
}
```

**MODIFY** `src/content/schemas/index.ts` — add the re-export (order matches the existing style):

```ts
export * from './content-tier';
export * from './content-pillar';
export * from './episode';
export * from './source-material';
export * from './case';            // from wf 1.1
export * from './showcase';        // from community-showcase 1.1 (if shipped first)
export * from './testimonial';     // ← new
export * from './validators';      // from wf 1.2
```

**MODIFY** `src/content/schemas/validators.ts` — add `TestimonialAuthorSchema` + `TestimonialSchema` alongside existing schemas. Reuse the shared regex constants if they already exist from `wf` 1.2 / `community-showcase` 1.1 (`SLUG`, `ISO_DATE`, `PUBLIC_PATH`, `HTTP_URL`); otherwise define them:

```ts
import { z } from 'zod';

// Shared constants from wf 1.2 (or community-showcase 1.1). Define only if absent.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const PUBLIC_PATH = /^\/[\w\-./]+$/;
const HTTP_URL = z.string().url().refine((v) => v.startsWith('http://') || v.startsWith('https://'), {
  message: 'must be an http(s) URL',
});

export const TestimonialAuthorSchema = z.object({
  name: z.string().min(1).max(80),
  title: z.string().min(1).max(120).optional(),
  company: z.string().min(1).max(120).optional(),
  avatarUrl: z.union([HTTP_URL, z.string().regex(PUBLIC_PATH)]).optional(),
});

export const TestimonialSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(SLUG),
  quote: z.string().min(20).max(600),
  author: TestimonialAuthorSchema,
  metric: z.string().min(1).max(120).optional(),
  verified: z.boolean(),
  featured: z.boolean(),
  publishedAt: z.string().regex(ISO_DATE),
  relatedEpisodeSlug: z.string().regex(SLUG).optional(),
  relatedCaseSlug: z.string().regex(SLUG).optional(),
  videoUrl: HTTP_URL.optional(),
  lllEntryUrls: z.array(HTTP_URL).max(8),
});
```

### Tests (red phase of section `testimonials-results-1.1`)

`src/content/schemas/__tests__/validators.test.ts` — add a `describe('TestimonialSchema', …)` block:

- `TestimonialSchema.safeParse(validFixture)` succeeds
- Rejects `slug: 'Bad_Slug'` (not kebab-case)
- Rejects `slug: 'UPPER'` (uppercase)
- Rejects `quote` under 20 chars and over 600 chars
- Rejects missing `author.name` and empty string
- Accepts `author` with only `name` set (title / company / avatarUrl all optional)
- Rejects `author.avatarUrl: 'avatar.jpg'` (relative)
- Accepts `author.avatarUrl: 'https://github.com/…'` and `author.avatarUrl: '/testimonials/jane/avatar.jpg'`
- Rejects `verified: 'yes'` and `featured: 'no'` (both must be booleans)
- Rejects `publishedAt: '04/11/2026'` (not ISO)
- Accepts `publishedAt: '2026-04-11'` and `publishedAt: '2026-04-11T00:00:00Z'`
- Accepts `metric: undefined`; rejects `metric: ''` (min 1)
- Rejects `lllEntryUrls: ['not-a-url']`
- Accepts `lllEntryUrls: []`
- `TestimonialAuthorSchema` — standalone: rejects empty `name`; rejects `title: ''` (min 1); accepts `avatarUrl: '/testimonials/foo/avatar.jpg'`; rejects `avatarUrl: 'https:/broken'`

Also export a valid fixture (`validTestimonialFixture()`) from the test file so feature 1.2 (and component tests in Phase 2) can reuse it.

### Design Decisions

- **`Testimonial` and `TestimonialAuthor` interfaces live in `testimonial.ts`; `TestimonialSchema` and `TestimonialAuthorSchema` live in `validators.ts`** — matches the `Episode`/`EpisodeSchema` split from `wf` 1.1–1.2 and the `Showcase`/`ShowcaseSchema` split from `community-showcase` 1.1. Types stay zero-dependency on zod; validators are infrastructure.
- **`quote` bounded at 20–600 chars** — short enough to fit a card layout, long enough to accommodate a meaningful paragraph-length quote. A 600-char quote is ~100 words, about the longest you'd ever put on a results wall card.
- **`verified: boolean`, not `status: 'unverified' | 'verified' | …`** — a flat boolean is enough for v1 (display a "Verified client" chip when true). A future third state can be added by flipping to an enum without changing the card component's switch logic (the current logic is just `verified ? render chip : null`).
- **`featured: boolean`, same semantics as `Showcase.featured`** — drives both (a) inclusion in the homepage strip when combined with `limit` + the loader's featured-first sort, and (b) `md:col-span-2` promotion in `<ResultsWall>`. Reusing the same name keeps mental overhead low across content types.
- **`metric?: string`, not `metric?: { label, value, unit }`** — authors write free-form copy ("Saved 40 hours/month", "Delivered in 6 weeks", "2x team velocity"). A structured metric forces a rigid format that rarely matches the actual claim. The string is treated as opaque display copy; no parsing.
- **`videoUrl?: string` reserved but unused** — the future-jobs doc explicitly calls out "Video testimonials — later — schema should leave room." Shipping the field now means the schema is forward-compatible without the UI needing to handle it.
- **`lllEntryUrls` always present, possibly empty** — matches `Episode`, `Case`, and `Showcase`. Empty-array-as-default means any future LLL crosslink component renders `null` cleanly without guarding on `undefined`.
- **`id` field distinct from `slug`** — `id` is an internal identifier (e.g. `testimonial-jane-park`); `slug` is the URL anchor segment. Mirrors `Episode.id` vs `Episode.slug` and `Showcase.id` vs `Showcase.slug`. Convention: `id = 'testimonial-' + slug`.
- **`publishedAt` accepts date-only and full ISO timestamps** — authors typically write dates, not timestamps. The loader parses both via `Date.parse` and the UI formats via `Intl.DateTimeFormat`.
- **Schema in `validators.ts`, not `testimonial.ts`** — keeps `testimonial.ts` importable from any file (including files that don't need runtime validation). Matches the `community-showcase` 1.1 decision.
- **Per-field length limits** — every string field has a max. Prevents a runaway 10 KB quote from exploding OG metadata or JSON-LD payload size. Limits are generous enough for normal editorial copy.
- **No `author.handle` / `author.handleUrl` pair** — unlike `Builder` in `community-showcase`, testimonial authors usually don't get a public social link. Adding them would invite awkward attribution claims. If needed later, the field can be added without schema churn.

### Files

| Action | File                                                 |
|--------|------------------------------------------------------|
| NEW    | `src/content/schemas/testimonial.ts`                 |
| MODIFY | `src/content/schemas/index.ts`                       |
| MODIFY | `src/content/schemas/validators.ts`                  |
| MODIFY | `src/content/schemas/__tests__/validators.test.ts`   |

---

## Feature 1.2: Testimonial Loader + Seed Content + Authoring Guide

**Complexity: M** — Directory-scan loader with featured-first sort, Zod validation at load time, a guard against a completely-empty content directory, a small counts aggregator for the metrics strip, three seed MDX files that exercise every card variant, and an internal authoring doc. Combines the data-layer wiring with the seed fixtures that validate it end-to-end.

### Problem

Phase 2 and Phase 3 both need typed, validated testimonial data. The `/results` page needs the full sorted list plus aggregate counts for the metrics strip; the homepage and `/about` embeds need a sliced, featured-first list; component tests need a deterministic sort. These are all satisfied by three functions plus a module-scoped cache.

The interesting parts of the loader:
1. The loader runs at build time (server components only), so the file-read pattern from `wf` 2.2 applies.
2. Results must be featured-first, then most-recent-first, then slug-tie-break, so the homepage strip and the `/results` page render in a stable, deterministic order.
3. A totally-empty testimonials directory should fail the build loudly, not render an empty wall. The near-empty 1- or 2-entry state is normal and silent.
4. The metrics strip needs `{ total, verified, featured }` — a trivial reduction over the loaded array, cached alongside the array itself.

The loader needs at least one entry to function (per the empty-directory guard), and the Phase 2 components/pages need deterministic data so their tests can exercise every variant branch (featured, verified, metric, MDX body, missing avatar). A single seed would leave 1.1/1.2 tests thin. Three entries — one of each combination — exercise every code path end-to-end. Future agents adding new testimonials need a short reference for the frontmatter shape and the anchor-link convention. The TS type is the source of truth, but a prose guide is faster to read for short content like this.

### Implementation

#### Loader

**NEW** `src/lib/content/testimonials.ts`:

```ts
import type { Testimonial } from '@/content/schemas';
import { TestimonialSchema } from '@/content/schemas/validators';
import { loadContentDirectory } from '@/lib/content/loader';

// Relative to repo root; `loadContentDirectory` resolves it via process.cwd().
const TESTIMONIALS_DIR = 'src/content/testimonials';

export interface TestimonialCounts {
  total: number;
  verified: number;
  featured: number;
}

let cache: readonly Testimonial[] | null = null;
let countsCache: TestimonialCounts | null = null;

function compareEntries(a: Testimonial, b: Testimonial): number {
  // Featured first.
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  // Then most recent publishedAt.
  const timeDiff = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  if (timeDiff !== 0) return timeDiff;
  // Stable tie-break on slug.
  return a.slug.localeCompare(b.slug);
}

async function loadAll(): Promise<readonly Testimonial[]> {
  if (cache) return cache;

  const raw = await loadContentDirectory(TESTIMONIALS_DIR); // from wf 2.2
  const entries = raw
    .map((frontmatter) => TestimonialSchema.parse(frontmatter))
    .sort(compareEntries);

  if (entries.length === 0) {
    throw new Error(
      `[testimonials] ${TESTIMONIALS_DIR} contains zero entries. The results ` +
        `wall must have at least one seed entry. Add an MDX file or delete ` +
        `the /results route.`,
    );
  }

  cache = Object.freeze(entries);
  return cache;
}

export async function getAllTestimonials(): Promise<readonly Testimonial[]> {
  return loadAll();
}

export async function getTestimonialBySlug(
  slug: string,
): Promise<Testimonial | undefined> {
  const all = await loadAll();
  return all.find((entry) => entry.slug === slug);
}

export async function getTestimonialCounts(): Promise<TestimonialCounts> {
  if (countsCache) return countsCache;

  const all = await loadAll();
  const counts: TestimonialCounts = {
    total: all.length,
    verified: all.filter((t) => t.verified).length,
    featured: all.filter((t) => t.featured).length,
  };
  countsCache = Object.freeze(counts);
  return countsCache;
}
```

#### Seed Content

**NEW** `src/content/testimonials/jane-park-agency.mdx` — featured + verified + metric + MDX body:

```mdx
---
id: testimonial-jane-park-agency
slug: jane-park-agency
quote: The Travis Gautier discovery pipeline cut our pre-sales work by more than half. We went from three-week discoveries to structured five-day ones without sacrificing depth.
author:
  name: Jane Park
  title: Founder
  company: Parker Studio
  avatarUrl: https://avatars.githubusercontent.com/u/0?v=4
metric: 3 weeks → 5 days on discovery
verified: true
featured: true
publishedAt: 2026-03-18
relatedCaseSlug: party-masters
lllEntryUrls: []
---

Before adopting the methodology, every discovery engagement at Parker Studio
ran long — clients wanted certainty faster than we could reasonably deliver
it. The TDD-style breakdown forced us to compress the "research" phase into a
structured rhythm that the client could actually watch.
```

**NEW** `src/content/testimonials/marcus-ops-team.mdx` — verified, non-featured, metric, no MDX body:

```mdx
---
id: testimonial-marcus-ops-team
slug: marcus-ops-team
quote: We ran the agent workflow across three concurrent ops projects. The pipeline's discipline around failing tests first caught a schema drift we would have shipped to prod.
author:
  name: Marcus Lindgren
  title: Head of Platform Ops
  company: Teaguewaters
metric: 40 hours/month saved across team
verified: true
featured: false
publishedAt: 2026-02-09
lllEntryUrls: []
---
```

**NEW** `src/content/testimonials/rivera-studio.mdx` — unverified, no metric, no MDX body (exercises the "raw" card branch):

```mdx
---
id: testimonial-rivera-studio
slug: rivera-studio
quote: Watching the pipeline work in real time is what convinced me to rebuild our internal tooling with it. The pattern is repeatable in a way agent workflows usually aren't.
author:
  name: Sam Rivera
verified: false
featured: false
publishedAt: 2026-01-22
lllEntryUrls: []
---
```

#### Authoring Guide

**NEW** `docs/testimonial-authoring.md`:

```markdown
# Testimonial Authoring Guide

Internal reference for adding entries to the `/results` wall.

## Where things live

- **MDX file**: `src/content/testimonials/{slug}.mdx`
- **Optional avatar asset**: `public/testimonials/{slug}/avatar.jpg` (or external URL)
- **Anchor on `/results`**: `#{slug}` (e.g. `/results#jane-park-agency`)

There is no per-testimonial detail page. Each testimonial renders as a card
inside the results wall; the slug exists as a stable anchor for deep-linking.

## Frontmatter shape

All fields validated at build time by `TestimonialSchema`
(`src/content/schemas/validators.ts`). See the TS interface `Testimonial` in
`src/content/schemas/testimonial.ts` for the canonical definition.

**Required:** `id`, `slug`, `quote`, `author.name`, `verified`, `featured`, `publishedAt`, `lllEntryUrls`.

**Optional:** `metric`, `author.title`, `author.company`, `author.avatarUrl`, `relatedEpisodeSlug`, `relatedCaseSlug`, `videoUrl`.

## Conventions

- **Slug**: kebab-case, matches the filename exactly. Often `{first-name-last-name}` or `{first-name-company}`.
- **`id`**: prefix with `testimonial-` (`testimonial-{slug}`).
- **`quote`**: 20–600 characters. A single sentence is fine; a short paragraph is the longest you'd put on a card. No smart quotes or markdown — plain text.
- **`metric`**: optional one-line outcome headline. Free-form: "Saved 40 hours/month", "Delivered in 6 weeks", "2x team velocity". Rendered as a styled badge on the `full` card variant.
- **`verified`**: `true` only when the quote is from a real, named client who has explicitly given permission. Renders a "Verified client" chip.
- **`featured`**: `true` for the homepage strip and the `md:col-span-2` promotion on `/results`. Default `false`.
- **`publishedAt`**: ISO date (`YYYY-MM-DD` or full timestamp). Sort key for the results wall.
- **`author.avatarUrl`**: optional. Accepts either an external URL (e.g. a GitHub avatar) or a `/public/...` path. If omitted, the card renders initials in a brand-colored circle.
- **`videoUrl`**: reserved for future video testimonials. Leave unset — the v1 UI ignores it.
- **`lllEntryUrls`**: absolute URLs to `largelanguagelibrary.ai` entries. Leave as `[]` if none.

## Body

Everything below the closing `---` is MDX and optional. When present, it renders as a contextual paragraph underneath the quote on the `full` card variant. Keep it short — the quote is the primary content, the body is supporting context.

## Adding an entry

1. Create `src/content/testimonials/{slug}.mdx` with the frontmatter above.
2. Optionally drop an avatar into `public/testimonials/{slug}/avatar.jpg`.
3. Run `npm run dev`, visit `/results`, verify the card renders with the expected variants.
4. Run `npm test` to confirm no validator regressions.
5. Run `npm run build` to confirm the loader picks up the new entry.

If frontmatter doesn't match `TestimonialSchema`, the build fails at module load with a Zod error pointing at the bad field.
```

### Tests (red phase of section `testimonials-results-1.2`)

#### Unit tests — mocked loader

`src/lib/content/__tests__/testimonials.test.ts`:

- Mock `@/lib/content/loader` (`loadContentDirectory`) to return a fixture array of five unsorted entries:
  - A: featured + verified, oldest `publishedAt`
  - B: non-featured + verified, newest `publishedAt`
  - C: non-featured + verified, middle `publishedAt`
  - D: non-featured + unverified, oldest `publishedAt`
  - E: featured + verified, newest `publishedAt` (tie-break against E alphabetical slug)
- `getAllTestimonials()` returns all five sorted: featured-first (A, E — ordered by date desc then slug), then non-featured by date desc (B, C, D).
- Tie-break test: two entries with identical `publishedAt` but different slugs → alphabetical by slug.
- `getTestimonialBySlug('bogus')` → `undefined`
- `getTestimonialBySlug('<known slug>')` → correct entry
- `getTestimonialCounts()` against the five-entry mock returns `{ total: 5, verified: 4, featured: 2 }`
- Empty-directory guard: mock `loadContentDirectory` to return `[]` → `getAllTestimonials()` throws with a message containing `src/content/testimonials`
- Zod validation guard: mock to return a malformed entry (missing `author.name`) → `getAllTestimonials()` throws a `ZodError`
- Result array is frozen (`Object.isFrozen(result) === true`) to prevent callers from mutating shared state
- Counts object is frozen
- Cache test: calling `getAllTestimonials()` twice only invokes `loadContentDirectory` once (assert via spy)
- Cache test: calling `getTestimonialCounts()` after `getAllTestimonials()` reuses the same underlying array (counts reflect the cached array, not a re-read)

Reset the module-scoped caches between tests via `vi.resetModules()` or an exported test-only `__resetTestimonialsCache()` helper. Prefer `vi.resetModules()` to keep the production surface clean.

#### Integration test — real filesystem

`src/lib/content/__tests__/testimonials.integration.test.ts` (new or folded into the unit test file as a `describe('seed content', …)` block that disables the mock):

- `getAllTestimonials()` (running against the real `src/content/testimonials/` directory, no mocks) returns an array of length ≥ 3
- All three seed entries (`jane-park-agency`, `marcus-ops-team`, `rivera-studio`) are present and individually pass `TestimonialSchema.safeParse`
- Sorted order: `jane-park-agency` first (featured + newest among featured), then `marcus-ops-team`, then `rivera-studio`
- `getTestimonialBySlug('jane-park-agency')` returns the featured entry with `verified: true`, a non-empty `metric`, and a `relatedCaseSlug`
- `getTestimonialBySlug('rivera-studio')` returns the unverified entry with `verified: false` and `metric: undefined`
- `getTestimonialCounts()` against the real seed returns `{ total: 3, verified: 2, featured: 1 }`
- `lllEntryUrls` is present on every entry (may be empty)
- If a seed entry declares `author.avatarUrl` as a `/public/...` path, that path exists on disk (`fs.existsSync(join('public', entry.author.avatarUrl))`). HTTPS avatars are not checked.

### Design Decisions

#### Loader

- **Cache the parsed + sorted result** — build-time content rarely changes within a run. The cache makes `getTestimonialBySlug` and repeated `getAllTestimonials` calls cheap across multiple page renders. Next.js build runs are short-lived processes, so stale-cache risk is zero.
- **Empty-directory is a hard throw** — per the scope decision, a zero-entry results wall is a broken state. Throwing at module load fails `npm run build` loudly instead of shipping a dead route. The error message tells the author exactly where to look.
- **Separate counts cache** — `getTestimonialCounts()` caches its result so the metrics strip component can be rendered in multiple places (homepage strip potentially, `/results` page) without re-reducing the array. Freezing it is cheap insurance against accidental mutation.
- **Featured-first comparator, not a filter + concat** — a single `.sort()` that honors the comparator yields one traversal and one stable result. Filtering into two arrays and concatenating is two allocations and a repeated sort-key computation. Matches the `community-showcase` 1.2 decision.
- **`readonly Testimonial[]` return type + `Object.freeze`** — protects the cache from callers that might `.sort()` or `.push()` in a page component. Matches `community-showcase` 1.2.
- **Loader is `async`** — the `loadContentDirectory` wf 2.2 helper is async because it does a filesystem read + dynamic `import()` of each MDX module. Callers already `await` their content loaders.
- **`Date.parse` for sorting** — cheaper than constructing `Date` objects, and the comparator only cares about the numeric delta. Both date-only and full-ISO strings round-trip correctly.
- **Mutable `let cache` module-scoped** — the module is loaded once per build process; the cache only grows monotonically. No cache-invalidation logic needed because the process exits before anything could change.
- **No try/catch around `TestimonialSchema.parse`** — Zod errors are already descriptive and should blow up the build. Swallowing them would hide bad frontmatter.
- **`getTestimonialCounts()` is async to match the sibling API** — even though the underlying reduction is synchronous once the cache is populated, returning a Promise means pages call all three loader functions with the same `await` shape.

#### Seed Content + Authoring Guide

- **Three seed entries, not one** — exercises every card variant in Phase 2 tests without needing ad-hoc fixtures: (a) featured + verified + metric + MDX body, (b) non-featured + verified + metric + no body, (c) unverified + no metric + no body. One seed would leave half the component branches tested only against mocks.
- **`jane-park-agency` is featured** — the Phase 2 page tests and Phase 3 homepage-strip tests both assert that at least one entry renders in the featured slot / promoted position. A featured seed keeps those tests deterministic without needing a second fixture.
- **`jane-park-agency` has `relatedCaseSlug: 'party-masters'`** — creates one valid round-trip link into `wf`'s case study tree without depending on a third-party submission. Matches the `community-showcase` 1.3 self-referential-seed decision.
- **`rivera-studio` has `author: { name: 'Sam Rivera' }` only** — exercises the "missing avatar / missing title / missing company" branch in the card component. No external dependencies.
- **Placeholder author names and companies are plausible but fictional** — real client quotes replace them during normal content authoring, not during this job. The implementation-plan doc explicitly treats content authoring as a separate concern from content infrastructure.
- **`docs/testimonial-authoring.md` instead of inline README comments** — future agents grep `docs/` for authoring conventions. A dedicated doc surfaces cleanly in that search. Matches the `community-showcase` 1.3 decision.
- **Integration test hits the real filesystem** — proves the full loader → Zod → frontmatter round-trip works against actual content. Mocked unit tests prove the logic; this integration test proves the wiring.
- **No avatar assets checked in for v1 seed** — `jane-park-agency` uses a public GitHub avatar URL, `marcus-ops-team` and `rivera-studio` have no avatar. The initials-fallback branch in the card component (Phase 2.1) gets exercised without shipping placeholder images.
- **Avatar `avatars.githubusercontent.com` is a public host** — Next.js 16's default `next/image` config may require a `remotePatterns` entry to allow it. If the build fails because of the image domain, swap Jane's `avatarUrl` for `undefined` (exercising the initials fallback) rather than editing `next.config.ts` — `next.config.ts` image config is out of scope for this job.

### Files

| Action | File                                                                      |
|--------|---------------------------------------------------------------------------|
| NEW    | `src/lib/content/testimonials.ts`                                         |
| NEW    | `src/lib/content/__tests__/testimonials.test.ts`                          |
| NEW    | `src/lib/content/__tests__/testimonials.integration.test.ts` (or folded into the unit test file) |
| NEW    | `src/content/testimonials/jane-park-agency.mdx`                           |
| NEW    | `src/content/testimonials/marcus-ops-team.mdx`                            |
| NEW    | `src/content/testimonials/rivera-studio.mdx`                              |
| NEW    | `docs/testimonial-authoring.md`                                           |

---

## Phase 1 Exit Criteria

- `npm run lint` clean, `npm test` green, coverage still ≥ thresholds, `npm run build` clean
- `TestimonialSchema.parse(validFixture)` succeeds and rejects every malformed fixture in the test suite
- `TestimonialAuthorSchema` rejects empty `name` and malformed `avatarUrl`
- `getAllTestimonials()` returns all three seed entries sorted featured-first / date-desc when called against the real `src/content/testimonials/` directory
- `getTestimonialBySlug('jane-park-agency')` returns the featured seed with `verified: true` and a non-empty `metric`
- `getTestimonialBySlug('bogus')` returns `undefined`
- `getTestimonialCounts()` returns `{ total: 3, verified: 2, featured: 1 }` against the seed
- Empty-directory guard throws with a clear error message when tested against a mocked empty content dir
- `docs/testimonial-authoring.md` is committed and not linked from anywhere yet (Phase 3 may optionally reference it from `llms.txt`)
- Phase 2 can start: the three components and the `/results` page have typed, validated data waiting for them
