# Phase 2: Page + Components

**Total Size: L + M**
**Prerequisites:** Phase 1 shipped — `Testimonial`/`TestimonialAuthor` schema, `TestimonialSchema`/`TestimonialAuthorSchema` validators, content loader with three typed helpers, three seed MDX files. Also depends on `wf` 1.3 (brand tokens), `wf` 1.4 (`<Container>`), and `wf` 2.1 (MDX pipeline for rendering the optional body on the full variant).
**New Types:** None (all new types live in Phase 1).
**New Files:** `src/components/testimonials/{Testimonial,ResultsWall,TestimonialMetrics}.tsx` + co-located tests, `src/app/results/page.tsx` + co-located test.

Phase 2 delivers the first visible UI of the job. After it ships, `/results` renders a complete results wall with three seed testimonials, a metrics strip, and a footer CTA. The `<Testimonial>` and `<ResultsWall>` components are exported and ready to be embedded elsewhere (Phase 3 does exactly that).

---

## Feature 2.1: Testimonial Card + Wall + Metrics Components

**Complexity: L** — Three components: `<Testimonial>` (compact + full variants, initials-fallback, verified chip, optional metric badge, optional MDX context body), `<ResultsWall>` (responsive grid that embeds `<Testimonial>`, featured promotion, optional `limit`), and `<TestimonialMetrics>` (counts-only stats strip). The wall embeds the card directly — testing them in the same pipeline run avoids mocking one while building the other.

### Problem

#### `<Testimonial>`

Every page that surfaces a testimonial (the `/results` wall, the homepage strip, the `/about` section, and future `storefront-auth` product pages) needs the same card. Without a shared primitive, the layouts drift: spacing, font sizes, border treatment, avatar handling, and the `verified`/metric badges all end up hand-rolled per embed. Extracting a component up front costs one feature and saves every subsequent embed from re-litigating the design.

Two variants are required:
- **compact** — used in the homepage strip and the `/about` section; shows quote + author block only. Metric, verified chip, and MDX body are hidden even when present.
- **full** — used on `/results`; shows quote + author block + metric badge (if present) + verified chip (if `verified: true`) + optional MDX context body (if the testimonial has one).

#### `<ResultsWall>` + `<TestimonialMetrics>`

`<ResultsWall>` is what the page (2.2) and the embeds (3.1) actually consume. Building the page before the wall would mean inlining the grid markup in `src/app/results/page.tsx`, then extracting it later when 3.1 needs the same layout. Do the extraction up front.

`<TestimonialMetrics>` is a small bordered strip that sits above the wall on `/results`. Counts-only (per the scope decision): `{ total, verified, featured }`. It's extracted as a component so the page stays declarative and the strip is re-usable if the `/about` embed decides to surface counts later.

### Implementation

#### `<Testimonial>`

**NEW** `src/components/testimonials/Testimonial.tsx`:

```tsx
import type { Testimonial as TestimonialType } from '@/content/schemas';
import Image from 'next/image';
import type { ReactNode } from 'react';

export interface TestimonialProps {
  testimonial: TestimonialType;
  variant?: 'compact' | 'full';
  /** Optional rendered MDX body for the contextual paragraph on the full variant. */
  body?: ReactNode;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function Avatar({ url, name }: { url?: string; name: string }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={`${name} avatar`}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover border border-mist"
        unoptimized={url.startsWith('http')}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 items-center justify-center rounded-full bg-steel/10 text-steel font-display font-medium text-base border border-mist"
    >
      {initials(name)}
    </div>
  );
}

export function Testimonial({ testimonial, variant = 'full', body }: TestimonialProps) {
  const { quote, author, metric, verified, slug } = testimonial;
  const isFull = variant === 'full';

  return (
    <article
      id={slug}
      className={
        'flex flex-col gap-4 rounded-2xl border border-mist bg-parchment p-6 ' +
        'text-ink shadow-sm transition hover:shadow-md'
      }
    >
      {isFull && (metric || verified) && (
        <div className="flex flex-wrap items-center gap-2">
          {metric && (
            <span className="inline-flex items-center rounded-full bg-ember/10 px-3 py-1 text-sm font-medium text-ember">
              {metric}
            </span>
          )}
          {verified && (
            <span
              className="inline-flex items-center rounded-full bg-signal/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-signal"
              aria-label="Verified client"
            >
              Verified client
            </span>
          )}
        </div>
      )}

      <blockquote className="text-base leading-relaxed text-ink md:text-lg">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {isFull && body && (
        <div className="prose prose-sm max-w-none text-muted">{body}</div>
      )}

      <footer className="mt-auto flex items-center gap-3 pt-2">
        <Avatar url={author.avatarUrl} name={author.name} />
        <div className="flex flex-col leading-tight">
          <span className="font-display font-semibold text-ink">{author.name}</span>
          {(author.title || author.company) && (
            <span className="text-sm text-muted">
              {[author.title, author.company].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </footer>
    </article>
  );
}
```

#### `<ResultsWall>`

**NEW** `src/components/testimonials/ResultsWall.tsx`:

```tsx
import type { Testimonial as TestimonialType } from '@/content/schemas';
import type { ReactNode } from 'react';
import { Testimonial } from './Testimonial';

export interface ResultsWallProps {
  testimonials: readonly TestimonialType[];
  /** If set, renders only the first N entries after the loader's existing sort. */
  limit?: number;
  variant?: 'compact' | 'full';
  /**
   * Optional map of slug → rendered MDX body. The full variant uses this to
   * display the contextual paragraph underneath each quote. Slugs without a
   * body entry render without the body section.
   */
  bodyBySlug?: Record<string, ReactNode>;
}

export function ResultsWall({
  testimonials,
  limit,
  variant = 'full',
  bodyBySlug,
}: ResultsWallProps) {
  const entries = limit !== undefined ? testimonials.slice(0, limit) : testimonials;

  if (entries.length === 0) {
    // Defensive: the loader already hard-throws on an empty directory, but a
    // caller could pass an already-filtered empty array.
    return null;
  }

  return (
    <ul
      role="list"
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      aria-label="Client testimonials"
    >
      {entries.map((testimonial) => (
        <li
          key={testimonial.id}
          className={testimonial.featured && variant === 'full' ? 'md:col-span-2' : undefined}
        >
          <Testimonial
            testimonial={testimonial}
            variant={variant}
            body={bodyBySlug?.[testimonial.slug]}
          />
        </li>
      ))}
    </ul>
  );
}
```

#### `<TestimonialMetrics>`

**NEW** `src/components/testimonials/TestimonialMetrics.tsx`:

```tsx
import type { TestimonialCounts } from '@/lib/content/testimonials';

export interface TestimonialMetricsProps {
  counts: TestimonialCounts;
}

function formatStat(n: number, label: string): string {
  return `${n.toLocaleString('en-US')} ${label}`;
}

export function TestimonialMetrics({ counts }: TestimonialMetricsProps) {
  const { total, verified, featured } = counts;

  return (
    <dl
      className={
        'flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-xl ' +
        'border border-mist bg-parchment px-6 py-4 text-ink'
      }
      aria-label="Testimonial counts"
    >
      <div className="flex items-baseline gap-2">
        <dt className="text-sm uppercase tracking-wide text-muted">Total</dt>
        <dd className="font-display text-2xl font-semibold">{formatStat(total, 'quotes')}</dd>
      </div>
      <div className="flex items-baseline gap-2">
        <dt className="text-sm uppercase tracking-wide text-muted">Verified</dt>
        <dd className="font-display text-2xl font-semibold">{formatStat(verified, 'clients')}</dd>
      </div>
      <div className="flex items-baseline gap-2">
        <dt className="text-sm uppercase tracking-wide text-muted">Featured</dt>
        <dd className="font-display text-2xl font-semibold">{formatStat(featured, 'entries')}</dd>
      </div>
    </dl>
  );
}
```

### Tests (red phase of section `testimonials-results-2.1`)

#### `<Testimonial>`

`src/components/testimonials/__tests__/Testimonial.test.tsx`:

- **compact variant**:
  - Renders quote (via `getByText` with a partial match)
  - Renders author name + title + company separator
  - Does **not** render metric even when `metric` is set
  - Does **not** render "Verified client" chip even when `verified: true`
  - Does **not** render MDX body even when `body` prop is passed
- **full variant**:
  - Renders quote
  - Renders metric when `metric` is set
  - Does **not** render metric badge when `metric: undefined`
  - Renders "Verified client" chip when `verified: true`
  - Does **not** render chip when `verified: false`
  - Renders `body` prop when passed
  - Does **not** render body section when `body` is undefined
- **avatar rendering**:
  - Renders `<img>` when `author.avatarUrl` is present (via `getByAltText('{name} avatar')`)
  - Renders initials fallback (`getByText('JP')` for "Jane Park") when `avatarUrl` is absent
  - Initials for single-word names: "Sam" → "S"
  - Initials for multi-word names: "Jane Park" → "JP", "Marcus Patrick Lindgren" → "ML" (first + last)
  - Initials are uppercase regardless of input casing
- **wrapper**:
  - `<article>` carries `id={testimonial.slug}` so `/results#jane-park-agency` deep-links work
  - Renders as a single `<article>` element (for a11y landmark tree)
- **author block**:
  - Author name always rendered
  - Title/company separator only rendered when at least one is present
  - When only `title` is set, renders `"Founder"` (no trailing separator)
  - When only `company` is set, renders `"Parker Studio"` (no leading separator)

#### `<ResultsWall>`

`src/components/testimonials/__tests__/ResultsWall.test.tsx`:

- Renders one `<li>` per testimonial when `testimonials` has length N
- Respects `limit` — `limit={2}` against a 5-entry array renders 2 cards
- `limit` greater than length renders all entries (no crash)
- `limit={0}` renders `null` (empty-state branch)
- Empty `testimonials` array renders `null`
- Passes `variant` through to each `<Testimonial>` (spy-and-assert, or assert via rendered markup: the full variant exposes the verified chip, compact doesn't)
- `featured` entries with `variant="full"` get the `md:col-span-2` class on their `<li>` wrapper
- `featured` entries with `variant="compact"` do **not** get the col-span class (compact strips are uniform)
- Non-featured entries never get the col-span class
- Passes `bodyBySlug[slug]` down to each testimonial card when the map is provided
- Missing body-slug entries render without a body (no crash)
- `<ul role="list">` is present (explicit role required because Tailwind 4's default `list-style: none` removes the implicit list semantic in some screen readers)
- `<ul>` carries `aria-label="Client testimonials"`

#### `<TestimonialMetrics>`

`src/components/testimonials/__tests__/TestimonialMetrics.test.tsx`:

- Renders three `<dt>`/`<dd>` pairs for total, verified, featured
- Renders the correct formatted strings for `{ total: 12, verified: 8, featured: 3 }`
- `toLocaleString` handles large numbers (`getByText('1,200 quotes')` for `total: 1200`)
- Zero counts render without special-casing (`0 clients` is acceptable copy)
- `<dl>` carries `aria-label="Testimonial counts"`

### Design Decisions

#### `<Testimonial>`

- **Single component, `variant` prop** — not two separate components. Both variants share ~80% of the markup (wrapper, quote, author block). Splitting means every future design change has to be made twice. The variant prop is a three-line conditional, not a polymorphism problem.
- **`variant` defaults to `full`** — the `/results` page is the primary consumer; it should be the zero-config path. Compact is the "opt-in for embed" variant.
- **MDX body is a `ReactNode` prop, not read from the testimonial** — the `Testimonial` type intentionally has no `body` field. The MDX body comes from importing the `.mdx` module at the page layer and passing the rendered JSX down. This matches the `wf` 2.2 "dynamic import the MDX module, pass the exported component to the page" pattern and keeps the component zero-filesystem-dependency (pure presentation).
- **`Image` with `unoptimized` for http URLs** — avoids forcing callers to add external hosts to `next.config.ts` `remotePatterns`. Local paths (starting with `/`) still go through Next's optimizer. This is acceptable for avatars (small, cached, not critical-path).
- **Initials fallback uses first + last character** — matches the convention people expect ("Jane Park" → "JP"). Single-word names fall back to the first character ("Sam" → "S"), not a single letter of a first-last split.
- **Initials component is `aria-hidden="true"`** — the visible initials are redundant with the author name in the footer. A screen reader should announce the name once, not spell out "J P Jane Park".
- **`<blockquote>` for the quote, `<footer>` for attribution** — matches HTML semantics. Screen readers announce the quote as a blockquote and the author block as its footer.
- **`id={slug}` on the `<article>` wrapper** — enables anchor deep-linking (`/results#jane-park-agency`). Feature 2.2 and Phase 3 both rely on this being present.
- **Verified chip is `uppercase tracking-wide text-xs`** — visually distinct from the metric badge (which is `text-sm font-medium`). The chip is a status marker, not a claim; the metric is a claim. Design hierarchy matches the semantic hierarchy.
- **Metric badge uses `bg-ember/10 text-ember`** — ember is the brand's accent token (from `wf` 1.3). The metric is the "headline" on the card; it earns the warm accent. Signal tokens are reserved for the verified chip.
- **No hover interaction beyond `shadow-md`** — the card is presentational, not a link. The hover shadow is a subtle affordance without promising clickability.

#### `<ResultsWall>` + `<TestimonialMetrics>`

- **Grid, not masonry** — `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` is predictable, testable, and keyboard-friendly. Masonry layouts add a CSS/JS dependency and break focus order. Cards have consistent enough heights that the uniform grid is fine.
- **`md:col-span-2` for featured entries on the full variant** — gives featured quotes visual prominence without a separate rendering path. Not applied to the compact variant because compact strips are uniform by design.
- **`<ul>` + `<li>` semantic structure** — screen readers announce "list of 3 items" for the wall. `role="list"` on the `<ul>` is defensive against Tailwind 4's `list-style: none` + VoiceOver behavior that silently drops the list semantic.
- **`bodyBySlug` is a keyed prop, not an array-of-pairs** — the page looks up bodies by slug when it renders; a map is the direct data shape. An array would require pairing logic in the component.
- **Empty-array returns `null`** — defensive against callers that filter into an empty result. The loader's hard-throw handles the "no testimonials at all" case at the data layer; this is the UI-layer fallback.
- **`TestimonialCounts` imported from the loader module** — the counts type is owned by the loader (it's computed there). Components re-import it rather than redefining, which keeps one source of truth.
- **Metrics uses `<dl>` / `<dt>` / `<dd>`** — semantically a description list: each count is a name-value pair. Screen readers announce "Total: 12 quotes; Verified: 8 clients; Featured: 3 entries" naturally.
- **Metric labels are lowercase under-hash** — "quotes", "clients", "entries". Keeps the strip from shouting. The `<dt>` labels ("TOTAL", "VERIFIED", "FEATURED") carry the uppercase.
- **`toLocaleString('en-US')` for count formatting** — `1200` → `1,200`. Forward-compatible with scale without adding an i18n concern for v1.
- **No aggregate "big number" claims** — the strip only reports counts. Individual testimonials still surface their own metric (metric badge) but the aggregate never invents a number. Matches the scope decision.
- **No `border-mist/50` semi-transparency on the metrics strip** — full `border-mist` for definition. Semi-transparent borders read as "disabled" at some zoom levels.

#### Cross-component

- **Brand tokens only** — no hard-coded hex. Every color, spacing, and typography value comes from `globals.css` tokens + Tailwind 4 utilities. Matches the `community-showcase` 2.1 decision.

### Files

| Action | File                                                              |
|--------|-------------------------------------------------------------------|
| NEW    | `src/components/testimonials/Testimonial.tsx`                     |
| NEW    | `src/components/testimonials/__tests__/Testimonial.test.tsx`      |
| NEW    | `src/components/testimonials/ResultsWall.tsx`                     |
| NEW    | `src/components/testimonials/__tests__/ResultsWall.test.tsx`      |
| NEW    | `src/components/testimonials/TestimonialMetrics.tsx`              |
| NEW    | `src/components/testimonials/__tests__/TestimonialMetrics.test.tsx` |

---

## Feature 2.2: `/results` Page

**Complexity: M** — Single page file, RSC, reads the loader at build time, composes `<Container>` + `<TestimonialMetrics>` + `<ResultsWall>` + footer CTA.

### Problem

`/results` is the primary surface. It has to load all testimonials, their counts, and each testimonial's optional rendered MDX body, then lay them out inside the brand shell. No dynamic segments, no client-side interactivity.

The page also has to handle the MDX body dynamic-import pattern from `wf` 2.2: each `.mdx` file's default export is a React component that renders the body. The page imports each module, pairs it with its slug, and passes the map to `<ResultsWall>` via `bodyBySlug`.

### Implementation

**NEW** `src/app/results/page.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { ResultsWall } from '@/components/testimonials/ResultsWall';
import { TestimonialMetrics } from '@/components/testimonials/TestimonialMetrics';
import {
  getAllTestimonials,
  getTestimonialCounts,
} from '@/lib/content/testimonials';

// Static detail metadata lives on the page. Phase 3 enriches with OG/JSON-LD.
export const metadata: Metadata = {
  title: 'Results — Travis Gautier',
  description:
    'Client outcomes and quotes from teams shipping with the Travis Gautier methodology.',
};

/**
 * Build a slug → rendered body map by dynamic-importing each testimonial MDX
 * module. Matches the `wf` 2.2 pattern: the MDX file exports a default React
 * component for the body.
 */
async function loadBodies(
  testimonials: readonly { slug: string }[],
): Promise<Record<string, ReactNode>> {
  const entries = await Promise.all(
    testimonials.map(async (t) => {
      try {
        const mod = (await import(
          `@/content/testimonials/${t.slug}.mdx`
        )) as { default: () => ReactNode };
        const Body = mod.default;
        return [t.slug, <Body key={t.slug} />] as const;
      } catch {
        // No body (MDX file has no content below the frontmatter).
        return [t.slug, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries.filter(([, body]) => body !== null));
}

export default async function ResultsPage() {
  const [testimonials, counts] = await Promise.all([
    getAllTestimonials(),
    getTestimonialCounts(),
  ]);
  const bodyBySlug = await loadBodies(testimonials);

  return (
    <Container as="main" className="py-16 md:py-24">
      <header className="mb-10 text-center md:mb-14">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Results</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">
          Clients shipping with the methodology
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted md:text-lg">
          Real outcomes from teams running the Travis Gautier pipeline against real
          projects. Every quote here is editorial — we publish only with the
          client&rsquo;s permission.
        </p>
      </header>

      <div className="mb-10 md:mb-14">
        <TestimonialMetrics counts={counts} />
      </div>

      <ResultsWall testimonials={testimonials} variant="full" bodyBySlug={bodyBySlug} />

      <section className="mt-16 rounded-2xl border border-mist bg-parchment p-8 text-center md:mt-24 md:p-12">
        <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          Want to work together?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted">
          Start with the case studies or watch a full discovery engagement on
          the channel.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href="/cases"
            className="inline-flex items-center rounded-full border border-ink bg-ink px-5 py-2 text-sm font-medium text-parchment transition hover:bg-ember hover:border-ember"
          >
            See case studies
          </a>
          <a
            href="/episodes"
            className="inline-flex items-center rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink transition hover:bg-ink hover:text-parchment"
          >
            Watch episodes
          </a>
        </div>
      </section>
    </Container>
  );
}
```

### Tests (red phase of section `testimonials-results-2.2`)

`src/app/results/__tests__/page.test.tsx` (RTL + Vitest, mocks the loader module):

- Mock `@/lib/content/testimonials` to return three fixture testimonials + corresponding counts
- `ResultsPage` renders the page heading ("Clients shipping with the methodology")
- Renders the eyebrow label ("Results")
- Renders the intro paragraph
- Renders `<TestimonialMetrics>` with the mocked counts
- Renders `<ResultsWall>` with the three mocked testimonials
- Each testimonial's quote appears in the rendered output
- Featured testimonial(s) receive the `md:col-span-2` treatment (spot-check the rendered DOM for the class on the correct `<li>`)
- Footer CTA renders both `See case studies` (→ `/cases`) and `Watch episodes` (→ `/episodes`) links
- `<main>` landmark exists (from `<Container as="main">`)
- `metadata.title` is `'Results — Travis Gautier'`
- `metadata.description` contains the word `outcomes`
- Mock a testimonial with no MDX body (module `import` throws or returns `{ default: () => null }`) → the card renders without a body section and the page does not crash

Mock the dynamic MDX imports via Vitest's `vi.mock('@/content/testimonials/...', ...)` or by stubbing `loadBodies` directly. Prefer stubbing `loadBodies` by refactoring it out of the page as a testable helper if the dynamic import is hard to mock.

### Design Decisions

- **Page is a server component, no `'use client'`** — the entire page is static and reads the build-time loader. No client bundle.
- **`Promise.all` around the loader + counts** — both functions hit the same underlying cache after the first call; calling them in parallel is pointlessly cheap but keeps the control flow tidy.
- **`loadBodies` is a dedicated async helper** — extraction makes the page testable via mock, and makes the dynamic-import fallback (no body) explicit. An inline `map` with try/catch would be harder to spy on.
- **Dynamic import path is `@/content/testimonials/${slug}.mdx`** — relies on Next.js 16's MDX pipeline (from `wf` 2.1). The template-literal import path is a known Next.js 16 pattern; Webpack resolves it at build time by scanning the directory. If `/green 2.2` hits a "cannot find module" error on the build, the fallback is to hand-enumerate the MDX imports via a static map populated by `fs.readdirSync` at build time — same pattern used by the `community-showcase` loader's dynamic import wrapper.
- **Bodies that throw silently become `null`** — expected for MDX files with no content below the frontmatter. The `try/catch` absorbs the missing-default-export error and renders the card without a body. Phase 1's seed entries include one MDX file with a body (`jane-park-agency`) and two without (`marcus-ops-team`, `rivera-studio`) so both branches are exercised.
- **Footer CTA links `/cases` and `/episodes`** — `/cases` is the natural next step for someone who wants depth; `/episodes` is the brand play. Both routes exist from `wf` 3. No link to `/products` because `storefront-auth` hasn't shipped; can be added in a one-line edit later.
- **`Container as="main"`** — the `<Container>` primitive from `wf` 1.4 accepts an `as` prop so the page can expose a proper `<main>` landmark. Matches the `community-showcase` 2.2 decision.
- **Header uses `text-center`** — the results wall is a social-proof page; a centered hero frames it as a destination rather than a list. Card body alignment (left) stays inside each card; only the page header + CTA are centered.
- **Empty-array guard lives in the loader, not the page** — the loader throws if there are zero testimonials. The page assumes at least one. No `if (testimonials.length === 0) …` branch in the page component.
- **Static `metadata` export on the page** — Phase 3 replaces this with `generateMetadata` when it adds OG + Twitter + JSON-LD. The static form is enough for Phase 2's "page renders under `npm run dev`" exit criterion.
- **Brand tokens throughout** — `bg-parchment`, `text-ink`, `border-mist`, `text-muted`, `text-ember`, `font-display`. Matches `community-showcase` 2.2.

### Files

| Action | File                                          |
|--------|-----------------------------------------------|
| NEW    | `src/app/results/page.tsx`                    |
| NEW    | `src/app/results/__tests__/page.test.tsx`     |

---

## Phase 2 Exit Criteria

- `npm run lint` clean, `npm test` green, coverage still ≥ thresholds, `npm run build` clean
- `<Testimonial variant="compact">` and `<Testimonial variant="full">` both render correctly in RTL tests, with the compact variant suppressing metric/verified/body and the full variant showing them when present
- Avatar initials fallback works for single-word and multi-word names
- `<ResultsWall>` respects `limit`, handles empty arrays, promotes featured entries on the full variant, and passes `bodyBySlug` through
- `<TestimonialMetrics>` renders three stat pairs with correctly formatted counts
- `/results` page renders under `npm run dev` showing eyebrow + title + intro + metrics strip + full results wall + footer CTA
- `/results` appears in the build output (`npm run build` completes and lists the route)
- Deep-link anchor: `/results#jane-park-agency` scrolls to the correct card (manual check)
- Phase 3 can start: `<ResultsWall>` is importable from `@/components/testimonials/ResultsWall` and works against `getAllTestimonials()` in server components
