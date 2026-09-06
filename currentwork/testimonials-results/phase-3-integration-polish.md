# Phase 3: Integration + Polish

**Total Size: L**
**Prerequisites:** Phase 2 shipped — `<ResultsWall>`, `<Testimonial>`, `<TestimonialMetrics>` all exported, `/results` page renders under `npm run dev` and `npm run build`. Also depends on `wf` 3.1 (homepage), `wf` 3.6 (`/about`), `wf` 4.3 (SEO metadata convention), `wf` 4.4 (sitemap + llms.txt).
**New Types:** None.
**New Files:** None. Phase 3 is entirely modifications to existing files.

Phase 3 is the "make it real" phase. After it ships, the results wall is discoverable from the highest-traffic surfaces (homepage, `/about`, header nav), search engines can crawl and structure it (sitemap + JSON-LD), and the Lighthouse sweep confirms the page meets brand-quality thresholds.

---

## Feature 3.1: Embeds + SEO + Sitemap + Nav + A11y Sweep

**Complexity: L** — Two embed surfaces (homepage + `/about`), plus a coordinated polish pass across the results page (`generateMetadata` + JSON-LD), sitemap, header nav, and `llms.txt`, closed out by a Lighthouse + keyboard walkthrough. All changes touch existing files; no new files.

### Problem

#### Embeds

`/results` is the destination page, but destinations only matter if they get traffic. The homepage is the brand's top-of-funnel; `/about` is where curious visitors land after reading a case study. Neither currently surfaces any social proof. A single compact strip on the homepage and a full wall section on `/about` close the loop without requiring a full page rebuild.

Both embeds read testimonials via the loader directly. No new loader calls — the cache populated by `/results` is hit again by these pages, which is cheap.

#### SEO + Sitemap + Nav + A11y

After the embeds land, the feature is functionally complete but not discoverable. Search engines need structured data, social cards need OG tags, the sitemap needs the new route, the header nav needs the link, and `llms.txt` needs to mention the new page for AI crawlers. Lighthouse + a keyboard walkthrough catch any regressions before shipping — including regressions on `/` and `/about` caused by the embed work in this same feature.

### Implementation

#### Homepage + `/about` Embeds

**MODIFY** `src/app/page.tsx` (homepage from `wf` 3.1) — add a compact testimonial strip below the existing "latest episode" section. The exact insertion point depends on `wf` 3.1's final homepage layout; the template below inserts the strip as a new sibling `<section>`.

```tsx
// Existing imports from wf 3.1 + new imports:
import Link from 'next/link';
import { ResultsWall } from '@/components/testimonials/ResultsWall';
import { getAllTestimonials } from '@/lib/content/testimonials';

export default async function HomePage() {
  // ... existing wf 3.1 data loading (episodes, cases, etc.) ...
  const testimonials = await getAllTestimonials();
  const homepageTestimonials = testimonials.slice(0, 3); // featured-first from loader

  return (
    <>
      {/* ... existing wf 3.1 hero + latest-episode + cases/episodes sections ... */}

      <section className="bg-parchment/50 py-16 md:py-24" aria-labelledby="homepage-results-heading">
        <Container>
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Results</p>
            <h2
              id="homepage-results-heading"
              className="mt-3 font-display text-3xl font-semibold text-ink md:text-4xl"
            >
              Shipping with the methodology
            </h2>
          </div>

          <ResultsWall testimonials={homepageTestimonials} variant="compact" />

          <div className="mt-10 text-center">
            <Link
              href="/results"
              className="inline-flex items-center gap-2 text-sm font-medium text-link hover:text-ember"
            >
              Read every result →
            </Link>
          </div>
        </Container>
      </section>

      {/* ... existing LLL callout + email capture + footer from wf 3.1 ... */}
    </>
  );
}
```

**MODIFY** `src/app/about/page.tsx` (from `wf` 3.6) — add a full results wall section above the LLL callout. This section is denser than the homepage strip because `/about` readers are further down the funnel and ready for detail.

```tsx
// Existing imports from wf 3.6 + new imports:
import Link from 'next/link';
import { ResultsWall } from '@/components/testimonials/ResultsWall';
import { TestimonialMetrics } from '@/components/testimonials/TestimonialMetrics';
import {
  getAllTestimonials,
  getTestimonialCounts,
} from '@/lib/content/testimonials';

export default async function AboutPage() {
  // ... existing wf 3.6 brand-story content ...
  const testimonials = await getAllTestimonials();
  const counts = await getTestimonialCounts();
  const aboutTestimonials = testimonials.slice(0, 4);

  return (
    <Container as="main" className="py-16 md:py-24">
      {/* ... existing wf 3.6 brand story + team / mission sections ... */}

      <section className="mt-20 md:mt-24" aria-labelledby="about-results-heading">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Proof</p>
          <h2
            id="about-results-heading"
            className="mt-3 font-display text-3xl font-semibold text-ink md:text-4xl"
          >
            Teams shipping with us
          </h2>
        </div>

        <div className="mb-10">
          <TestimonialMetrics counts={counts} />
        </div>

        <ResultsWall testimonials={aboutTestimonials} variant="full" />

        <div className="mt-10 text-center">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 text-sm font-medium text-link hover:text-ember"
          >
            See the full results wall →
          </Link>
        </div>
      </section>

      {/* ... existing wf 3.6 LLL callout ... */}
    </Container>
  );
}
```

#### `/results` Page — SEO + JSON-LD

**MODIFY** `src/app/results/page.tsx` — replace the static `metadata` export with `generateMetadata` + inline `CollectionPage` JSON-LD containing a list of `Review` items, following the `wf` 4.3 pattern.

```tsx
import type { Metadata } from 'next';
import {
  getAllTestimonials,
  getTestimonialCounts,
} from '@/lib/content/testimonials';

export async function generateMetadata(): Promise<Metadata> {
  const counts = await getTestimonialCounts();
  const description = `${counts.verified} verified client quotes from teams shipping with the Travis Gautier methodology. Outcomes, timelines, and honest feedback.`;
  return {
    title: 'Results — Travis Gautier',
    description,
    alternates: { canonical: '/results' },
    openGraph: {
      title: 'Results — Travis Gautier',
      description,
      type: 'website',
      url: '/results',
      images: [{ url: '/og/results.png', width: 1200, height: 630, alt: 'Travis Gautier Results' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Results — Travis Gautier',
      description,
      images: ['/og/results.png'],
    },
  };
}

// Inside the existing `ResultsPage` component, before the returned JSX:
function buildJsonLd(
  testimonials: readonly Testimonial[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Results — Travis Gautier',
    description:
      'Client outcomes and quotes from teams shipping with the Travis Gautier methodology.',
    url: 'https://travisgautier.com/results',
    hasPart: testimonials.map((t) => ({
      '@type': 'Review',
      reviewBody: t.quote,
      datePublished: t.publishedAt,
      author: {
        '@type': 'Person',
        name: t.author.name,
        ...(t.author.title && { jobTitle: t.author.title }),
        ...(t.author.company && {
          worksFor: { '@type': 'Organization', name: t.author.company },
        }),
      },
      itemReviewed: {
        '@type': 'Organization',
        name: 'Travis Gautier',
        url: 'https://travisgautier.com',
      },
    })),
  };
}

// Inside the return, immediately after the opening <Container>:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(testimonials)) }}
/>
```

#### Sitemap + Nav + llms.txt

**MODIFY** `src/app/sitemap.ts` (from `wf` 4.4) — append `/results` to the routes array. No dynamic sub-routes because there's no `/results/[slug]`.

```ts
// Existing imports + new:
import { getAllTestimonials } from '@/lib/content/testimonials';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ... existing entries for /, /episodes, /episodes/[slug], /cases, /cases/[slug], /about ...

  // Touch the loader so the sitemap's lastModified tracks the newest testimonial.
  const testimonials = await getAllTestimonials();
  const lastModified = testimonials[0]?.publishedAt
    ? new Date(testimonials[0].publishedAt)
    : new Date();

  return [
    // ... existing routes ...
    {
      url: 'https://travisgautier.com/results',
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
```

**MODIFY** `src/components/site/Header.tsx` (from `wf` 1.4) — add a "Results" entry to the nav list. The exact shape depends on `wf` 1.4's implementation, but the pattern is:

```tsx
// Inside the nav array (or the JSX list):
const navItems = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases', label: 'Cases' },
  { href: '/results', label: 'Results' }, // ← new
  { href: '/about', label: 'About' },
];
```

If `wf` 1.4 implements the nav as hand-written JSX instead of a data-driven list, add a single `<Link href="/results">Results</Link>` in the matching position. Active-state highlighting follows the existing pattern (whatever `wf` 1.4 uses — `usePathname` + `startsWith('/results')`).

**MODIFY** `public/llms.txt` — add a mention of `/results` in the sitemap section and in the content index. The existing file is short enough that the modification is one or two lines; match the existing tone and structure.

#### A11y Sweep + Keyboard Walk

Manual, part of `/refactor 3.1`:

- Lighthouse on `/`: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90
- Lighthouse on `/results`: same thresholds
- Lighthouse on `/about`: same thresholds (regression check — the new embed section shouldn't drop scores)
- Keyboard-only: Tab from the header → focus "Results" link → Enter → land on `/results` → Tab through the metrics strip → Tab through the first card (no interactive elements, skips to the next card's region) → Tab through the footer CTA → Tab out of the page via the footer
- Screen reader spot-check (VoiceOver or NVDA): confirm the header "Results" link is announced, the page landmarks are correct (`main`, sections with `aria-labelledby`), and the testimonial cards announce as articles with their quotes
- `view-source:` manual check on `/results`: `<title>`, `<meta description>`, OG tags, Twitter tags, and the inline `<script type="application/ld+json">` block are all present
- Validate the JSON-LD payload at https://validator.schema.org — `CollectionPage` + nested `Review` items should pass without errors

### Tests (red phase of section `testimonials-results-3.1`)

#### Homepage + `/about` embed tests

`src/app/__tests__/page.test.tsx` (update the existing `wf` 3.1 homepage test, or add a new `describe('testimonial strip', …)` block):

- Mock `@/lib/content/testimonials` to return five fixture testimonials (one featured)
- Homepage renders exactly 3 testimonial cards in the strip section (slice of first 3)
- The strip uses `variant="compact"` — verified chips and metric badges should **not** appear even when the mock has `verified: true` and `metric` set
- The strip section has `aria-labelledby="homepage-results-heading"`
- The "Read every result →" link points to `/results`
- When the loader returns only 2 testimonials, the strip renders both (slice never crashes)

`src/app/about/__tests__/page.test.tsx` (update existing `wf` 3.6 test):

- Mock the loader to return four fixture testimonials + mock counts
- `/about` renders `<TestimonialMetrics>` above the wall with the mocked counts
- Wall renders 4 cards with `variant="full"` (verified chips and metric badges visible when present)
- The section has `aria-labelledby="about-results-heading"`
- The "See the full results wall →" link points to `/results`

#### `/results` metadata + JSON-LD tests

`src/app/results/__tests__/page.test.tsx` (extend from 2.2):

- `generateMetadata()` returns a `title` of `'Results — Travis Gautier'`
- `generateMetadata()` returns a description that includes the verified count
- `generateMetadata()` returns `alternates.canonical === '/results'`
- OpenGraph payload contains the `/og/results.png` image with 1200×630 dimensions
- Twitter card type is `summary_large_image`
- Rendered page includes a `<script type="application/ld+json">` element
- The JSON-LD payload parses as valid JSON and has `@type: 'CollectionPage'`
- `hasPart` is an array with one entry per fixture testimonial
- Each `hasPart` entry has `@type: 'Review'`, `reviewBody`, `datePublished`, and a nested `author` object
- When a testimonial has `author.company` set, the JSON-LD `author.worksFor` is present; when absent, `worksFor` is omitted (not present with `undefined` value)

#### Sitemap + Header tests

`src/app/__tests__/sitemap.test.ts` (extend from `wf` 4.4):

- Sitemap includes an entry with `url === 'https://travisgautier.com/results'`
- The `/results` entry has `priority: 0.7` and `changeFrequency: 'monthly'`
- `lastModified` matches the newest testimonial's `publishedAt`

`src/components/site/__tests__/Header.test.tsx` (extend from `wf` 1.4):

- Nav renders a link with text "Results" and `href="/results"`
- Active-state class applied when `usePathname()` returns a path that starts with `/results`
- Active-state class not applied on other paths

### Design Decisions

#### Embeds

- **Slice the first 3 from the featured-first loader** — no need to filter by `featured: true` explicitly. The loader's sort already puts featured entries first; slicing takes them off the top. If fewer than 3 entries are featured, the slice backfills with the most-recent non-featured entries, which is the right behavior for a homepage strip (never empty, always fresh).
- **Homepage strip uses `variant="compact"`** — the homepage is dense with other sections (hero, latest episode, cases strip, LLL callout). The compact variant keeps the strip unobtrusive without losing the social-proof value. The "Read every result" link is the conversion path to the full wall.
- **`/about` uses `variant="full"` + metrics strip** — `/about` readers are further down the funnel; they've already decided to read more. Showing metrics + full cards rewards that intent.
- **Both sections have `aria-labelledby`** — the heading is the accessible name for the section landmark. Screen readers announce "region, Shipping with the methodology" instead of an unnamed region.
- **Homepage strip has a subtle bg (`bg-parchment/50`)** — visual separation from the sections above and below without introducing a new color token. The `/about` section uses no background (it inherits from the page).
- **No testimonial metrics on the homepage strip** — the homepage is already dense; adding a stats strip there would compete with whatever hero metrics `wf` 3.1 ships. If the homepage decides to surface counts later, it's a one-line addition above the `<ResultsWall>` call.
- **Both embeds re-use the same `getAllTestimonials()` call pattern** — the module-scoped cache from Phase 1 means calling it from both `/` and `/about` is free after the first call. No memoization needed at the page layer.
- **No per-embed `limit` math** — just `.slice(0, N)`. The loader has already enforced featured-first ordering and the loader result is `readonly`, so `.slice` returns a new array without mutating the cache.
- **`Link` from `next/link`, not `<a>`** — internal navigation uses the Next.js prefetched-route Link component. External links (if any) would still use `<a>`.
- **No `/products` link on either embed** — the storefront doesn't exist yet (`storefront-auth` is a separate job). Adding a forward-reference to a non-existent route would be clever but broken.

#### SEO + Sitemap + Nav

- **`generateMetadata` instead of a static `metadata` export** — lets the description pull the actual verified count from the loader. If the count grows to 10, 20, 100, the meta description automatically reflects it without a code change.
- **`CollectionPage` + `Review` structured data** — Google supports both types. Each `Review` gets a nested `author.worksFor` when the testimonial has a company, which enables rich snippets in search results. The `itemReviewed` is always the Travis Gautier organization since testimonials are about the methodology itself, not about individual products.
- **JSON-LD rendered via `dangerouslySetInnerHTML`** — matches the `wf` 4.3 pattern. A script tag with `JSON.stringify` is the canonical way to inline structured data in Next.js App Router.
- **`/og/results.png` is a placeholder path** — the actual image file is either produced by `wf` 4.3's OG image pipeline or hand-dropped into `public/og/`. If the image doesn't exist when this feature lands, the social card falls back to the site-wide OG image set by the root `metadataBase`. `/refactor 3.1` should confirm the file exists or coordinate with the user to supply it.
- **`alternates.canonical: '/results'`** — prevents duplicate-content confusion if the page is ever served from a preview URL or a trailing-slash variant.
- **Sitemap `lastModified` tracks the newest testimonial** — if a new testimonial ships, the sitemap reflects the update and crawlers re-index the page. Without this, `lastModified` would be frozen at the deploy time. Matches the `wf` 4.4 pattern for episodes/cases.
- **Sitemap `priority: 0.7`** — higher than deep content (episodes/cases at ~0.6) because `/results` is a conversion page, lower than the homepage (`1.0`) because it's not the primary entry point.
- **Header nav order**: Episodes → Cases → Results → About. Results sits between Cases and About because it's the social-proof bridge between "what we did" (cases) and "who we are" (about). If `wf` 1.4 ships with a different default order, match whatever's there and slot Results before About.
- **llms.txt is updated conservatively** — just a one-line mention and a sitemap reference. Detailed crawler guidance already exists from `wf` 4.4; we're extending, not rewriting.
- **No new OG image generated in this feature** — OG image generation is `wf` 4.3's responsibility. This feature references the expected path and leaves asset production to the content author or a follow-up.

#### A11y

- **Lighthouse thresholds match the `wf` 4.4 and `community-showcase` 3.2 targets** — a11y ≥ 95, perf ≥ 90, SEO ≥ 95. Any regression on `/` or `/about` from the embeds is a blocker for this feature.
- **Keyboard walkthrough validates the non-interactive-card design** — testimonial cards are pure presentation (no links, no buttons inside the card). Tab order should skip from card to card (each card is a region with a heading) via the focus outline on the `<article>`, not through per-card interactive elements that don't exist.
- **No schema.org `AggregateRating`** — we'd have to invent a rating value, which is precisely the "aggregate star rating" scope exclusion. Review entries without a rating are valid schema.org data.

### Files

| Action | File                                              |
|--------|---------------------------------------------------|
| MODIFY | `src/app/page.tsx` (homepage from wf 3.1)         |
| MODIFY | `src/app/about/page.tsx` (from wf 3.6)            |
| MODIFY | `src/app/__tests__/page.test.tsx` (if exists)     |
| MODIFY | `src/app/about/__tests__/page.test.tsx` (if exists) |
| MODIFY | `src/app/results/page.tsx`                        |
| MODIFY | `src/app/results/__tests__/page.test.tsx`         |
| MODIFY | `src/app/sitemap.ts`                              |
| MODIFY | `src/app/__tests__/sitemap.test.ts`               |
| MODIFY | `src/components/site/Header.tsx`                  |
| MODIFY | `src/components/site/__tests__/Header.test.tsx`   |
| MODIFY | `public/llms.txt`                                 |

---

## Phase 3 Exit Criteria

- `npm run lint` clean, `npm test` green + coverage still ≥ thresholds, `npm run build` clean
- Homepage (`/`) shows a 3-card compact testimonial strip with a "Read every result →" link to `/results`
- `/about` shows a metrics strip + 4-card full wall with a "See the full results wall →" link
- `/results` serves `generateMetadata` output visible in `view-source:` — unique title, description with the verified count, OG image, Twitter card
- `/results` contains a single valid `<script type="application/ld+json">` block whose payload passes https://validator.schema.org as a `CollectionPage` with `Review` items
- `/sitemap.xml` lists `/results` with `priority: 0.7` and a `lastModified` matching the newest testimonial
- Header nav shows "Results" with active-state highlighting when the path starts with `/results`
- `public/llms.txt` mentions `/results`
- Lighthouse scores on `/`, `/results`, `/about`: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90 — no regressions from the embeds
- Keyboard-only walkthrough from header → Results → full wall → footer CTA → back to `/` completes without focus traps
- `testimonials-results` is ready for final `/finish` cleanup and commit
