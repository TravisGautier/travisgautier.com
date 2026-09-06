# Phase 3: Polish

**Total Size: L**
**Prerequisites:** Phase 2 shipped — `/showcase` and `/showcase/[slug]` render end-to-end, every component + page has green tests, the seed entry is visible in dev + build.
**New Types:** None.
**New Files:** None at the route/component level. All of Phase 3 is edits to existing pages + shared infrastructure from `wf`.

Phase 3 is the final pass before ship: per-page SEO metadata, OpenGraph +
Twitter cards, inline JSON-LD, sitemap integration, a header nav link,
`llms.txt` polish, and a Lighthouse sweep — all in one cycle. The two
original sections (3.1 metadata + 3.2 sitemap/nav/a11y) ship together
because they form one coherent "shippable posture" pass: the sitemap
modifications need per-page metadata in place so canonical URLs match, and
the Lighthouse sweep inspects the full state including metadata + sitemap +
nav + llms.txt simultaneously.

---

## Feature 3.1: SEO Metadata + OpenGraph + JSON-LD + Sitemap + Nav + llms.txt + a11y Sweep

**Complexity: L** — One bundled polish pass with two thematic groups: (a)
per-page SEO/structured data on the showcase routes themselves, and (b)
cross-site integration touches (sitemap, header nav, `llms.txt`, Lighthouse
sweep). Each individual edit is small; together they land the shipping
posture of the job.

### Problem

Two coupled concerns ship as one feature:

1. **Per-page SEO and structured data.** The Phase 2 metadata consts carry
   `title` and `description` only. That's the minimum for a text-based
   search result, but for social sharing and structured data the pages need
   richer metadata: a per-entry title on detail pages, OpenGraph / Twitter
   card tags pointing at the hero image, and structured data that tells
   search engines "this is a CreativeWork by a person at a company,
   published on a specific date."

2. **Cross-site discovery and a11y.** `/showcase` and every
   `/showcase/{slug}` route need to appear in the dynamic sitemap so search
   engines discover them without waiting for backlinks. The site header
   needs a `/showcase` link so visitors can find the gallery from any page.
   `public/llms.txt` needs to mention the new surface so AI crawlers
   understand the site map. And finally: before calling the job complete,
   the new pages need a Lighthouse sweep to confirm they hit the brand's
   a11y and performance targets.

### Implementation

#### 3.1a: Per-Page Metadata + OpenGraph + JSON-LD

**MODIFY** `src/app/showcase/page.tsx` — widen the static `metadata` const
with OpenGraph + Twitter blocks. The index page isn't per-request dynamic, so
it stays a const rather than becoming `generateMetadata`:

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Built with Travis Gautier',
  description:
    'Community projects shipped with the Travis Gautier methodology — in-house work, agent-driven builds, and case studies from the field.',
  openGraph: {
    title: 'Built with Travis Gautier',
    description:
      'Community projects shipped with the Travis Gautier methodology — in-house work, agent-driven builds, and case studies from the field.',
    url: '/showcase',
    type: 'website',
    siteName: 'Travis Gautier',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Built with Travis Gautier',
    description:
      'Community projects shipped with the Travis Gautier methodology.',
  },
  alternates: {
    canonical: '/showcase',
  },
};
```

**MODIFY** `src/app/showcase/[slug]/page.tsx` — replace any Phase 2 static
metadata with a `generateMetadata` function plus an inline JSON-LD block:

```tsx
import type { Metadata } from 'next';

// ... existing imports ...

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getShowcaseEntryBySlug(slug);
  if (!entry) return {};

  const canonical = `/showcase/${entry.slug}`;
  return {
    title: `${entry.title} — Showcase`,
    description: entry.summary,
    openGraph: {
      title: entry.title,
      description: entry.summary,
      url: canonical,
      type: 'article',
      siteName: 'Travis Gautier',
      images: [
        {
          url: entry.heroImage,
          width: 1600,
          height: 900,
          alt: `${entry.title} hero screenshot`,
        },
      ],
      publishedTime: entry.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: entry.title,
      description: entry.summary,
      images: [entry.heroImage],
    },
    alternates: {
      canonical,
    },
  };
}

// ... existing default export, but add the JSON-LD block inside the render ...

export default async function ShowcaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getShowcaseEntryBySlug(slug);
  if (!entry) notFound();

  const mdxModule = await import(`@/content/showcase/${entry.slug}.mdx`);
  const MdxBody = mdxModule.default;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: entry.title,
    description: entry.summary,
    url: `https://travisgautier.com/showcase/${entry.slug}`,
    datePublished: entry.publishedAt,
    image: `https://travisgautier.com${entry.heroImage}`,
    author: {
      '@type': 'Person',
      name: entry.builder.name,
      ...(entry.builder.handleUrl ? { url: entry.builder.handleUrl } : {}),
      ...(entry.builder.company
        ? {
            affiliation: {
              '@type': 'Organization',
              name: entry.builder.company,
            },
          }
        : {}),
    },
    keywords: entry.stack,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ...hero image, header, body, gallery, crosslinks from Phase 2.2... */}
    </article>
  );
}
```

#### 3.1b: Sitemap + Header Nav + llms.txt + Lighthouse

**MODIFY** `src/app/sitemap.ts` — import the showcase loader and append the
entries. The sitemap shape from `wf` 4.4 already handles episodes and cases;
this extends the same pattern:

```ts
import type { MetadataRoute } from 'next';
import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';
import { getAllShowcaseEntries } from '@/lib/content/showcase'; // ← new

const BASE = 'https://travisgautier.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, cases, showcase] = await Promise.all([
    getAllEpisodes(),
    getAllCases(),
    getAllShowcaseEntries(), // ← new
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1.0 },
    { url: `${BASE}/episodes`, priority: 0.8 },
    { url: `${BASE}/cases`, priority: 0.8 },
    { url: `${BASE}/showcase`, priority: 0.8 }, // ← new
    { url: `${BASE}/about`, priority: 0.5 },
  ];

  return [
    ...staticRoutes,
    ...episodes.map((e) => ({
      url: `${BASE}/episodes/${e.slug}`,
      lastModified: e.publishedAt,
      priority: 0.7,
    })),
    ...cases.map((c) => ({
      url: `${BASE}/cases/${c.slug}`,
      priority: 0.7,
    })),
    ...showcase.map((s) => ({
      url: `${BASE}/showcase/${s.slug}`,
      lastModified: s.publishedAt,
      priority: 0.6,
    })),
  ];
}
```

**MODIFY** `src/components/site/Header.tsx` — add a `/showcase` entry to the
primary nav list. The exact shape depends on how `wf` 1.4 built the header,
but the edit is a one-liner appending to the nav items array:

```tsx
// inside the nav items array from wf 1.4
const navItems = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases', label: 'Cases' },
  { href: '/showcase', label: 'Showcase' }, // ← new
  { href: '/about', label: 'About' },
];
```

If `wf` 1.4 doesn't already highlight the active link via `usePathname()`,
this section adds it here — but only the minimum needed to make the
`/showcase` link highlight when `pathname.startsWith('/showcase')`. No
broader refactor.

**MODIFY** `public/llms.txt` — add a line mentioning `/showcase` in whatever
section of the file lists site routes. The existing structure from `wf` 4.4
determines the exact diff; it's a single line insertion.

**Lighthouse sweep** — run against `npm run start` after `npm run build`:

```
lighthouse http://localhost:3000/showcase --preset=desktop --only-categories=accessibility,performance,seo,best-practices
lighthouse http://localhost:3000/showcase/party-masters-team --preset=desktop --only-categories=accessibility,performance,seo,best-practices
```

Target: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90. Fix any
regressions before closing the feature. Common issues to watch for:

- Missing or duplicate `<h1>` on the detail page
- Hero image without width/height hints causing CLS
- Low-contrast link colors on dark-mode (if dark mode is live from `wf` 1.3)
- Missing skip-link hookup from the header (from `wf` 1.4)
- `next/image` pre-transformed asset availability

### Tests (red phase of section `community-showcase-3.1`)

#### Per-page metadata + JSON-LD

- `src/app/showcase/__tests__/page.test.tsx` — extend with assertions on `metadata.openGraph.title`, `metadata.openGraph.url === '/showcase'`, `metadata.twitter.card === 'summary_large_image'`, `metadata.alternates.canonical === '/showcase'`
- `src/app/showcase/[slug]/__tests__/page.test.tsx` — new tests:
  - `generateMetadata({ params: { slug: 'party-masters-team' } })` returns an object with `title` ending in `— Showcase` and `description === entry.summary`
  - `generateMetadata` for an unknown slug returns `{}`
  - `openGraph.images[0].url === entry.heroImage` and dimensions set correctly
  - `openGraph.type === 'article'` (not `website`) on detail pages
  - `twitter.card === 'summary_large_image'`
  - `alternates.canonical === '/showcase/{slug}'`
- New JSON-LD test: render the page with a known entry and assert the `<script type="application/ld+json">` exists and contains valid JSON that parses to an object with `@type: 'CreativeWork'`, correct `name`, correct `author.name`, and `datePublished` matching `entry.publishedAt`
- JSON-LD with no `builder.company` → no `author.affiliation` key in the payload
- JSON-LD with no `builder.handleUrl` → no `author.url` key in the payload

#### Sitemap + nav

- `src/app/__tests__/sitemap.test.ts` (extends whatever `wf` 4.4 shipped):
  - Sitemap includes `https://travisgautier.com/showcase`
  - Sitemap includes one URL per showcase slug returned by the mocked `getAllShowcaseEntries`
  - Entries have the expected `priority` (0.8 for index, 0.6 for details)
- Header component test:
  - Nav contains an anchor/link with `href="/showcase"` and visible text "Showcase"
  - Active-state class is applied when the mocked `usePathname()` returns `/showcase` or `/showcase/something`
  - Active-state class is NOT applied for `/episodes` or `/`
- No test for `llms.txt` (plain text file; the verification is a manual grep + `curl localhost:3000/llms.txt`)
- No test for Lighthouse scores (manual gate — run the tool, commit with the result logged in the commit message)

### Design Decisions

#### Metadata + JSON-LD

- **`generateMetadata` on the detail page, static const on the index** — the detail page needs per-slug metadata (titles, OG images, canonical URLs) so it has to be a function. The index is a single static page so a const is enough. Matches Next.js idioms.
- **`openGraph.url` and `alternates.canonical` as absolute-path strings** — Next.js resolves these against `metadataBase` (set to `https://travisgautier.com` in the root layout by `wf` 1.4). Writing relative paths keeps the doc portable if the production URL ever changes.
- **`openGraph.type: 'article'` on detail, `'website'` on index** — semantic distinction. Social crawlers use this to decide whether to render "a link to a site" or "a link to a published piece".
- **JSON-LD built as a plain object + `JSON.stringify`** — the `CreativeWork` schema is small enough that hand-building the object is readable; a schema.org helper library would be overkill. Matches the `wf` 4.3 inline-JSON-LD precedent.
- **Spread-conditional for `author.url` and `author.affiliation`** — optional fields only appear in the payload when data exists. Validators at schema.org will flag a `null` or empty string as a soft warning; omission is cleaner.
- **`keywords: entry.stack`** — reuses the tech stack as a keyword list for structured data. Cheap way to give crawlers extra signal without inventing new metadata.
- **Absolute URLs inside JSON-LD (`https://travisgautier.com/…`)** — schema.org requires absolute URLs for `url` and `image`. The rest of the page (Next.js metadata) uses path-relative URLs that `metadataBase` resolves; JSON-LD can't lean on `metadataBase`.
- **`width: 1600, height: 900` hardcoded in OpenGraph** — matches the 16:9 aspect ratio the authoring guide mandates for hero images. If the hero dimension policy changes, both the guide and this constant update together.
- **JSON-LD only on detail pages, not the index** — index page is a "collection" and mapping it to `CollectionPage` adds complexity for marginal SEO benefit. Can be added later if it matters.
- **Canonical URL on both pages** — prevents duplicate-content penalties if the pages are ever accessed via query strings or tracking parameters.
- **Twitter card uses `summary_large_image`** — the hero image is the key visual asset; the default `summary` card hides it behind a thumbnail.

#### Sitemap, Nav, llms.txt, a11y

- **Parallel loader calls in `Promise.all`** — the sitemap does three independent async reads. Parallelizing keeps build-time sitemap generation fast even as content grows.
- **Showcase detail priority of 0.6, below episodes (0.7)** — episodes are the flagship content; showcase entries are secondary social proof. Signals relative importance to crawlers without being aggressive.
- **`lastModified: s.publishedAt`** — showcase entries don't track a separate `updatedAt` field. Using `publishedAt` as the modification time is accurate for now (entries are static), and adding `updatedAt` to the schema can wait until real editing behavior emerges.
- **Nav link as "Showcase" (not "Community" or "Built with Travis Gautier")** — concise, one-word, fits nav chrome. The page itself carries the longer "Built with Travis Gautier" framing in the `<h1>`.
- **`pathname.startsWith('/showcase')` for active state** — both the index and the detail pages should highlight the Showcase nav link. `startsWith` handles both.
- **No nav dropdown for showcase sub-entries** — the list would be too long and introduces keyboard-trap risk. Visitors browse via the index, not the nav.
- **`llms.txt` edit is minimal** — mention the new route, nothing else. The file is already curated by `wf` 4.4 and this job doesn't own the file's overall structure.
- **Lighthouse sweep is a manual gate** — the raw scores don't round-trip to tests, but they do round-trip to the commit message. Logging the scores makes regressions easy to detect later.
- **No performance budget framework** — too much infrastructure for a v1 gallery. Lighthouse spot-checks are enough until the page count grows.
- **No per-page sitemap split** — the site is small enough that a single sitemap is fine. If it ever grows past 50k URLs, split at that time.
- **Polish work bundled in one section** — sitemap modifications depend on canonical URLs being stable, which means metadata has to land first. Lighthouse sweep inspects the full shipping state. Splitting these into two pipeline runs would either interleave half-shipped state or duplicate the Lighthouse pass.

### Files

| Action | File                                                              |
|--------|-------------------------------------------------------------------|
| MODIFY | `src/app/showcase/page.tsx`                                       |
| MODIFY | `src/app/showcase/[slug]/page.tsx`                                |
| MODIFY | `src/app/showcase/__tests__/page.test.tsx`                        |
| MODIFY | `src/app/showcase/[slug]/__tests__/page.test.tsx`                 |
| MODIFY | `src/app/sitemap.ts`                                              |
| MODIFY | `src/components/site/Header.tsx`                                  |
| MODIFY | `public/llms.txt`                                                 |
| MODIFY | `src/app/__tests__/sitemap.test.ts` (or whatever `wf` 4.4 named it) |
| MODIFY | `src/components/site/__tests__/Header.test.tsx`                   |

---

## Phase 3 Exit Criteria

- `npm run lint` clean, `npm test` green, coverage still ≥ thresholds, `npm run build` clean
- `view-source:` on `/showcase` and `/showcase/party-masters-team` shows unique title, description, OpenGraph, and Twitter tags
- Detail page contains a valid `CreativeWork` JSON-LD block that validates at https://validator.schema.org
- `/sitemap.xml` lists `/showcase` + every showcase slug with the expected priorities
- Header nav shows `/showcase`; active-state highlights for both the index and any detail page
- `public/llms.txt` mentions `/showcase`
- Lighthouse sweep: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90 on both `/showcase` and one detail page
- Keyboard-only walkthrough reaches the nav, both headings, every link, and the LLL crosslinks block without getting stuck
- Commit message logs the four Lighthouse scores per page so regressions can be diffed later
- Job is shippable: every exit criterion from the README `Verification Plan` table is satisfied
