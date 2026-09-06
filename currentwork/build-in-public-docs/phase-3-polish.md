# Phase 3: Polish

**Total Size: L (consolidated from M + S)**
**Prerequisites:** Phase 2 complete (all four routes render with stub metadata; loaders are stable; `<MarkdownDocument>` is in place).
**New Types:** None
**New Files:** None — Phase 3 is purely modifications to existing files (Phase 2's pages, `wf` 4.4's sitemap, `wf` 1.4's Header, `wf` 4.4's `llms.txt`, `wf` 3.1's homepage).

Phase 3 is the polish phase: per-page SEO metadata including OpenGraph and
JSON-LD, the sitemap append for every build-log route, the header nav link,
the homepage callout, the `llms.txt` mention, and the accessibility +
performance sweep. After it ships, the build-log section is fully
production-grade and indistinguishable in polish from the rest of the wf-built
site. Post-condense, the two sub-features ship as one L-sized pipeline run —
all facets are small polish touches against routes that already exist, and
3.2 already bundles 5 facets.

---

## Feature 3.1: SEO + Sitemap + Nav + a11y Polish

**Complexity: L (consolidated from old 3.1 metadata M + old 3.2 sitemap/nav/a11y S)** — Widen every route's metadata with OpenGraph + Twitter + JSON-LD, append the routes to the sitemap, wire the Header nav link, add the homepage callout, mention `/build-log` in `llms.txt`, and run the accessibility + performance sweep. One TDD cycle covers the entire polish surface because every modification lands on Phase 2's pages or on wf-shipped shared components.

### Part 1 — Per-Page Metadata + JSON-LD

**Part complexity: M** — Replace the simple `metadata` exports from Phase 2 with
richer `generateMetadata` definitions including OpenGraph and Twitter card
tags, plus inline JSON-LD `<script type="application/ld+json">` blocks on the
job and phase pages. Index and status pages get `CollectionPage` shape; job
and phase pages get `TechArticle` shape.

#### Problem

Phase 2 ships every page with a basic `title` + `description`. OpenGraph
images, Twitter card tags, and structured data (JSON-LD) are missing. Without
them, social shares of build-log URLs show no preview, and search engines
don't get the rich metadata they reward with better ranking.

The build-log is a high-signal SEO surface for the channel — these pages rank
on search queries like "TDD pipeline implementation plan example" and "how
agents build a Next.js site". The metadata polish matters specifically here.

#### Implementation

**MODIFY** `src/app/build-log/page.tsx` — replace the static `metadata` const
with a richer one (still static — no params on the index):

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Build log',
  description:
    'A live view of the agent-driven build process behind travisgautier.com — every job plan, every phase, every section the TDD pipeline has shipped or is about to ship.',
  openGraph: {
    title: 'Build log · travisgautier',
    description:
      'The agent-driven build process behind travisgautier.com, rendered as published content.',
    type: 'website',
    url: '/build-log',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build log · travisgautier',
    description:
      'The agent-driven build process behind travisgautier.com, rendered as published content.',
  },
  alternates: {
    canonical: '/build-log',
  },
};
```

Add a `CollectionPage` JSON-LD block at the top of the rendered output:

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Build log',
  description:
    'The agent-driven build process behind travisgautier.com, rendered as published content.',
  url: 'https://travisgautier.com/build-log',
  isPartOf: {
    '@type': 'WebSite',
    name: 'travisgautier',
    url: 'https://travisgautier.com',
  },
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <Container as="main" className="py-12">
      ...
    </Container>
  </>
);
```

**MODIFY** `src/app/build-log/status/page.tsx` — same shape, with
`name: 'Pipeline status'` and `url: '/build-log/status'`. Otherwise identical
to the index treatment.

**MODIFY** `src/app/build-log/jobs/[slug]/page.tsx` — widen `generateMetadata`
to include OpenGraph + Twitter cards, and add a `TechArticle` JSON-LD block:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};
  const description = job.context.split('\n')[0]?.slice(0, 160) ?? job.title;
  const url = `/build-log/jobs/${slug}`;
  return {
    title: `${job.title} · Build log`,
    description,
    openGraph: {
      title: job.title,
      description,
      type: 'article',
      url,
      images: ['/og-default.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: job.title,
      description,
    },
    alternates: { canonical: url },
  };
}

// inside the default export, before `<Container>`:
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: job.title,
  description: job.context.split('\n')[0] ?? job.title,
  url: `https://travisgautier.com/build-log/jobs/${slug}`,
  author: {
    '@type': 'Organization',
    name: 'Travis Gautier',
    url: 'https://travisgautier.com',
  },
  isPartOf: {
    '@type': 'CollectionPage',
    name: 'Build log',
    url: 'https://travisgautier.com/build-log',
  },
};
```

**MODIFY** `src/app/build-log/jobs/[slug]/[phase]/page.tsx` — same treatment
with the phase title in the headline and `isPartOf` pointing at the parent
job page:

```tsx
const phaseTitle = ph.header.title
  ? `Phase ${ph.header.phaseNumber}: ${ph.header.title}`
  : ph.slug;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: `${phaseTitle} · ${job.title}`,
  description: ph.header.totalSize ?? `Phase document for ${job.title}.`,
  url: `https://travisgautier.com/build-log/jobs/${slug}/${phase}`,
  author: {
    '@type': 'Organization',
    name: 'Travis Gautier',
    url: 'https://travisgautier.com',
  },
  isPartOf: {
    '@type': 'TechArticle',
    name: job.title,
    url: `https://travisgautier.com/build-log/jobs/${slug}`,
  },
};
```

#### Tests (merged into red phase of section `build-in-public-docs-3.1`)

Extend the existing page tests with metadata + JSON-LD assertions:

`src/app/build-log/__tests__/page.test.tsx`:
- The page rendered output contains a `<script type="application/ld+json">` element
- The script's `__html` payload parses as JSON and has `@type: 'CollectionPage'`, `name: 'Build log'`, `url: 'https://travisgautier.com/build-log'`
- The exported `metadata` const has `openGraph.url === '/build-log'`, `openGraph.type === 'website'`, `twitter.card === 'summary_large_image'`, `alternates.canonical === '/build-log'`

`src/app/build-log/status/__tests__/page.test.tsx`:
- Same JSON-LD assertions with `name: 'Pipeline status'`, `url: 'https://travisgautier.com/build-log/status'`

`src/app/build-log/jobs/[slug]/__tests__/page.test.tsx`:
- `generateMetadata({ params: { slug: 'community-showcase' } })` returns an object with `title: 'community-showcase — Implementation Plan · Build log'`, `openGraph.type === 'article'`, `openGraph.url === '/build-log/jobs/community-showcase'`, `alternates.canonical === '/build-log/jobs/community-showcase'`
- Renders a JSON-LD script with `@type: 'TechArticle'`, `headline` matching the job title, `isPartOf['@type'] === 'CollectionPage'`
- `generateMetadata({ params: { slug: 'bogus' } })` returns `{}` (loader returns undefined)

`src/app/build-log/jobs/[slug]/[phase]/__tests__/page.test.tsx`:
- `generateMetadata({ params: { slug: 'community-showcase', phase: 'phase-1-foundation' } })` returns the right title and description
- Renders a JSON-LD script with `@type: 'TechArticle'`, `isPartOf` pointing at the parent job's URL
- Returns `{}` from `generateMetadata` when the phase or job is unknown

#### Design Decisions

- **`TechArticle` for job and phase pages, `CollectionPage` for index and status** — schema.org's closest types for "developer-facing technical writing in a structured collection". `TechArticle` is appropriate for in-depth implementation plans; `CollectionPage` is appropriate for the index and the live-status board.
- **`isPartOf` chains the structure** — phase → job → CollectionPage → WebSite. Search engines surface this as a breadcrumb trail in rich results.
- **`OpenGraph.url` and `alternates.canonical` are relative paths** — the wf root layout sets `metadataBase: new URL('https://travisgautier.com')`, so Next.js resolves the relative paths against it. Keeping them relative avoids hardcoding the production domain in 4 separate files.
- **JSON-LD inlined via `dangerouslySetInnerHTML`** — same pattern as wf 4.3's episode + case detail pages. Allows the JSON to be statically embedded in the SSR output without escaping issues.
- **JSON-LD URL is absolute** — schema.org requires fully-qualified URLs in the structured data even when the per-page metadata uses relative paths. The page builds the absolute URL from the slug params.
- **`og-default.png` is the OG image for every build-log page** — the image was added by wf 4.3 and lives at `public/og-default.png`. Per-page custom OG images would be a polish item for later (each job could have its own when real screenshots exist).
- **No `breadcrumb` JSON-LD on the phase page** — the `isPartOf` chain effectively encodes the breadcrumb. Adding a separate `BreadcrumbList` is duplicate signal that doesn't move the SEO needle for a 3-level deep technical article.
- **`description` truncated to 160 chars** — the OpenGraph + meta-description sweet spot. Search engines truncate longer descriptions in result snippets.
- **No `datePublished` / `dateModified` in the TechArticle** — the build-log content is regenerated on every build, and the underlying `currentwork/*.md` files don't carry per-record timestamps. Adding a synthetic `dateModified: new Date().toISOString()` would force the field to "always today", which is misleading. Better to omit.

#### Files (Part 1)

| Action | File                                                                  |
|--------|-----------------------------------------------------------------------|
| MODIFY | `src/app/build-log/page.tsx`                                          |
| MODIFY | `src/app/build-log/status/page.tsx`                                   |
| MODIFY | `src/app/build-log/jobs/[slug]/page.tsx`                              |
| MODIFY | `src/app/build-log/jobs/[slug]/[phase]/page.tsx`                      |
| MODIFY | `src/app/build-log/__tests__/page.test.tsx`                           |
| MODIFY | `src/app/build-log/status/__tests__/page.test.tsx`                    |
| MODIFY | `src/app/build-log/jobs/[slug]/__tests__/page.test.tsx`               |
| MODIFY | `src/app/build-log/jobs/[slug]/[phase]/__tests__/page.test.tsx`       |

---

### Part 2 — Sitemap + Nav + llms.txt + Homepage Callout + a11y Sweep

**Part complexity: S** — Five small modifications to existing files plus a
Lighthouse pass. Each individual change is one or two lines; the sweep at the
end is what catches polish issues.

#### Problem

The build-log routes need to be discoverable by search crawlers via the
sitemap, by humans via the header nav, and by viewers via the homepage. The
`llms.txt` should mention the section so AI crawlers know it exists. And
every new route needs to clear the wf-established a11y/perf bar (Lighthouse
≥ 95 a11y, ≥ 90 perf).

#### Implementation

**MODIFY** `src/app/sitemap.ts` — append the build-log routes:

```ts
import type { MetadataRoute } from 'next';
import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';
import { getAllJobs } from '@/lib/build-log/jobs';

const BASE_URL = 'https://travisgautier.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, cases, jobs] = await Promise.all([
    getAllEpisodes(),
    getAllCases(),
    getAllJobs(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/episodes`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cases`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/build-log`, changeFrequency: 'daily', priority: 0.7 },
    {
      url: `${BASE_URL}/build-log/status`,
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ];

  // ... existing episodeRoutes / caseRoutes ...

  const buildLogJobRoutes = jobs.map((job) => ({
    url: `${BASE_URL}/build-log/jobs/${job.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const buildLogPhaseRoutes = jobs.flatMap((job) =>
    job.phases.map((phase) => ({
      url: `${BASE_URL}/build-log/jobs/${job.slug}/${phase.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  );

  return [
    ...staticRoutes,
    ...episodeRoutes,
    ...caseRoutes,
    ...buildLogJobRoutes,
    ...buildLogPhaseRoutes,
  ];
}
```

**MODIFY** `src/components/site/Header.tsx` — add a "Build log" nav link with
active-state highlighting on `/build-log`. The exact structure depends on
what `wf` 1.4 ships, but the addition is one `<NavLink>` (or whatever the
Header's nav-item component is) pointing at `/build-log`.

```tsx
// inside the nav <ul> or equivalent:
<li>
  <Link
    href="/build-log"
    className={[
      'hover:text-accent',
      pathname?.startsWith('/build-log') ? 'text-accent' : '',
    ].join(' ')}
    aria-current={pathname?.startsWith('/build-log') ? 'page' : undefined}
  >
    Build log
  </Link>
</li>
```

**MODIFY** `public/llms.txt` — add `/build-log` to the routes the file lists.
The exact paragraph that wf 4.4 ships will look something like:

```
The structured, machine-readable knowledge base lives at the sister project:
  https://largelanguagelibrary.ai
```

Add a build-log mention near the sitemap line:

```
Sitemap: https://travisgautier.com/sitemap.xml

The /build-log section of this site renders the agent-driven build process
behind travisgautier.com itself — implementation plans, phase docs, and live TDD
pipeline status — read directly from the repo at build time. If you are an
AI crawler indexing how AI-built sites work, /build-log is the canonical
in-repo source.
```

**MODIFY** `src/app/page.tsx` — add a small "Inside the build" callout above
the footer (or wherever the homepage's "secondary CTAs" section lives,
depending on what `wf` 3.1 shipped). The exact insertion point is decided
during `/green` after reading the final homepage component:

```tsx
<section className="border-t border-mist py-12">
  <Container>
    <h2 className="text-2xl font-display mb-3">Inside the build</h2>
    <p className="text-muted max-w-2xl mb-4">
      This entire site is built by the same agent workflow we document on the
      channel. Watch the plans, the phases, and the running pipeline in
      real-ish time.
    </p>
    <Link
      href="/build-log"
      className="text-link hover:text-accent font-medium"
    >
      Read the build log →
    </Link>
  </Container>
</section>
```

#### Accessibility + Performance Sweep

Run `npm run build && npm run start` and Lighthouse against:
- `/build-log`
- `/build-log/jobs/website-foundation`
- `/build-log/jobs/website-foundation/phase-1-foundation`
- `/build-log/status`

**Targets** (matching wf 4.4): a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best
practices ≥ 90.

**Check on every new route**:
- Landmark regions (`<header>`, `<main>`, `<footer>`, `<nav>` present — they
  are via the wf shell)
- Heading hierarchy: one `<h1>` per page (the page title); markdown bodies
  start at `<h2>` after the demote-h1-to-h2 override in `<MarkdownDocument>`
- Color contrast ≥ 4.5:1 for body text, 3:1 for large text — particularly the
  status badge backgrounds and the progress bar fill color (adjust if a
  badge fails contrast)
- Keyboard tab order: header nav → main content → footer with no traps
- Focus rings visible on every interactive element (links, badges-as-links if
  any, the rollup table rows)
- The `<JobsRollupTable>` progress bars have correct ARIA
  (`role="progressbar"`, `aria-valuenow/min/max/label`)
- Markdown autolink anchors are keyboard-reachable even though they're
  visually hidden until hover
- Code blocks in `<MarkdownDocument>` have appropriate contrast against the
  chosen highlight.js theme
- Wide tables overflow horizontally without breaking the layout (the
  `.build-log-table-wrapper` does this)

Fix anything that lands below threshold. If `highlight.js/styles/github-dark.css`
fails contrast against the `--color-ink` background, switch to a different
theme during this sweep.

#### Tests (merged into red phase of section `build-in-public-docs-3.1`)

`src/app/__tests__/sitemap.test.ts` (extended from wf 4.4):
- The sitemap result includes `/build-log` and `/build-log/status`
- The sitemap result includes one entry per job (assert against the real
  `currentwork/` tree returning ≥ 7 entries)
- The sitemap result includes one entry per phase across all jobs
- All build-log URLs use the `https://travisgautier.com/build-log/...` prefix

`src/components/site/__tests__/Header.test.tsx`:
- The header includes a "Build log" link pointing at `/build-log`
- When the test mocks `usePathname` to `/build-log`: the link has
  `aria-current="page"` and the active-state class
- When the test mocks `usePathname` to `/build-log/jobs/foo`: the link still
  has the active-state highlighting (path starts with `/build-log`)
- When the test mocks `usePathname` to `/episodes`: the build-log link does
  NOT have the active state

`src/app/__tests__/page.test.tsx` (homepage test, extended from wf 3.1):
- The homepage contains an "Inside the build" section heading
- The homepage contains a link to `/build-log` with text "Read the build log →"

#### Design Decisions

- **`changeFrequency: 'daily'` for `/build-log` and `/build-log/status`** — these surfaces update whenever the pipeline does, which can be multiple times per day during active sprints. Crawlers should re-check often. Job and phase pages get `'weekly'` because the underlying plan files change less frequently.
- **`priority: 0.7` for the build-log index, `0.6` for status, `0.6` for job pages, `0.5` for phase pages** — the index is the highest-priority entry point for crawlers; status is high but slightly lower because its content is mostly transient; job pages are middle-tier; phase pages are deep-link content. The wf episode index is `0.9`; build-log is intentionally below that because it's secondary to the channel content.
- **Append-only sitemap modification, no restructure** — the existing wf 4.4 sitemap structure is left alone. Build-log routes are appended at the end. Easier to review, less risk of regressing wf coverage.
- **Header nav link uses the existing wf 1.4 nav-item pattern** — whatever component shape wf ships, this feature inserts one new entry. The exact API depends on what wf 1.4 settles on (`<NavLink>`, raw `<Link>`, an array config); during `/green`, mirror the existing entries.
- **Active-state on `pathname.startsWith('/build-log')`** — covers the index, status board, and every nested job/phase page with one check.
- **Homepage callout placement is open** — `wf 3.1` may ship a homepage with a specific structure. The callout drops in above the footer if there's no obvious dedicated "secondary CTAs" section. During `/green`, read `src/app/page.tsx` first and pick the right insertion point.
- **`llms.txt` mention is one paragraph, not a separate section** — the file is small and rarely updated; adding a paragraph keeps it scannable. AI crawlers reading `llms.txt` will follow the prose narrative to find the build-log surface.
- **Lighthouse run is local, not a CI gate** — wf 4.4 sets the same convention. Adding a Lighthouse CI gate is a separate concern that should be tackled across all routes uniformly, not per-job.
- **No `revalidate` or ISR config on the build-log routes** — they rebuild on every full `npm run build`. Adding `export const revalidate = 60` would make them rebuild every 60 seconds in production, which costs CPU for marginal value (the underlying files don't change in production unless we redeploy). If real-time pipeline status becomes important, the upgrade is `revalidate: 60` on `status/page.tsx` only.
- **No homepage placement A/B test** — the callout is a single component drop, not a styled hero or above-the-fold treatment. The wf homepage already prioritizes the channel content; the build-log is a secondary CTA, not a primary one.

#### Files (Part 2)

| Action | File                                                          |
|--------|---------------------------------------------------------------|
| MODIFY | `src/app/sitemap.ts`                                          |
| MODIFY | `src/app/__tests__/sitemap.test.ts`                           |
| MODIFY | `src/components/site/Header.tsx`                              |
| MODIFY | `src/components/site/__tests__/Header.test.tsx`               |
| MODIFY | `src/app/page.tsx`                                            |
| MODIFY | `src/app/__tests__/page.test.tsx`                             |
| MODIFY | `public/llms.txt`                                             |

---

## Phase 3 Exit Criteria

- `npm run lint` clean, `npm test` green + coverage still ≥ thresholds, `npm run build` clean
- `view-source:` on every build-log page shows a unique `<title>`, `<meta description>`, OG image + Twitter card tags, and the per-route JSON-LD block
- JSON-LD payloads validate at https://validator.schema.org for both the `CollectionPage` (index, status) and `TechArticle` (job, phase) shapes
- `/sitemap.xml` lists `/build-log`, `/build-log/status`, every `/build-log/jobs/{slug}` URL, and every `/build-log/jobs/{slug}/{phase}` URL
- Header nav has a "Build log" link with active-state highlighting on every `/build-log/...` route
- `public/llms.txt` mentions `/build-log` in the sitemap section
- `/` homepage shows the "Inside the build" callout with a working link to `/build-log`
- Lighthouse local run on `/build-log` and `/build-log/jobs/website-foundation/phase-1-foundation` clears a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90
- Keyboard-only walkthrough succeeds: tab from header → "Build log" → into the index grid → into a job page → through the `<PhaseNav>` → into a phase page → through the markdown body's autolink anchors → back out via the breadcrumb → home, with no traps and visible focus rings throughout
- All existing wf tests still pass (no regressions in episodes/cases/sitemap/header/homepage)
- The job is shippable: `npm run build && npm run start` produces a fully-rendered, fully-indexed, fully-navigable build-log section indistinguishable in polish from the rest of the site
