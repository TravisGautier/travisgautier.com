# Phase 2: Pages

**Total Size: M + L**
**Prerequisites:** Phase 1 shipped — `Showcase` type exported, `ShowcaseSchema` wired into `validators.ts`, `getAllShowcaseEntries()` / `getShowcaseEntryBySlug()` returning the seed entry, seed MDX + hero image checked in. Also requires `wf` 1.4 (`<Container>`, site shell), `wf` 2.1 (MDX pipeline + `mdx-components.tsx`), and `wf` 4.2 (`<LllCrosslinks>`).
**New Types:** None (uses `Showcase` + `Builder` from Phase 1).
**New Files:** `src/components/showcase/{ShowcaseCard,ShowcaseBuilder,ShowcaseStack,ShowcaseLinks,ShowcaseGallery}.tsx`, `src/app/showcase/page.tsx`, `src/app/showcase/[slug]/page.tsx` + co-located tests.

Phase 2 turns the Phase 1 data layer into public pages. After it ships,
`/showcase` and `/showcase/{slug}` render end-to-end under `npm run dev` and
`npm run build`, with the seed entry visible in the hero grid and a fully-
rendered detail page. Phase 3 adds polish (metadata, JSON-LD, sitemap, a11y
sweep) on top of working pages.

All components in this phase are server components — no `'use client'`
directive anywhere. The showcase surface is purely presentational (no form
state, no interactivity beyond navigation), so there's nothing to hydrate.
This keeps the bundle small and matches the `wf` episodes/cases pages.

---

## Feature 2.1: `<ShowcaseCard>` Component + `/showcase` Index Page

**Complexity: M** — One reusable card component (with `"hero"` and
`"standard"` variants) shipped together with its sole consumer: the
`/showcase` index page that renders the featured hero grid at top and a full
"all entries" grid below. The card has no other consumer in v1, so building
it without the index leaves both halves untestable in dev — they ship in one
section.

### Problem

Two coupled concerns:

1. **Card.** The index page renders the same `Showcase` record in two visual
   modes: a large image-dominant hero card in the featured grid, and a
   compact text-first standard card in the "all entries" grid below. Writing
   two unrelated card components drifts the styling over time; one component
   with a `variant` prop keeps them aligned.

2. **Index.** Visitors need a landing page for the community gallery.
   Without it, the individual detail pages are unlisted, uncrawlable from
   the site, and invisible from the header nav. The index also carries the
   channel's editorial framing ("Built with Travis Gautier") so first-time
   visitors understand what they're looking at.

### Implementation

#### `<ShowcaseCard>` Component

**NEW** `src/components/showcase/ShowcaseCard.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import type { Showcase } from '@/content/schemas';

export type ShowcaseCardVariant = 'hero' | 'standard';

interface ShowcaseCardProps {
  entry: Showcase;
  variant?: ShowcaseCardVariant;
}

export function ShowcaseCard({
  entry,
  variant = 'standard',
}: ShowcaseCardProps) {
  const isHero = variant === 'hero';

  return (
    <Link
      href={`/showcase/${entry.slug}`}
      className="group block h-full overflow-hidden rounded-md border border-mist transition-colors hover:border-accent"
      aria-labelledby={`showcase-${entry.slug}-title`}
    >
      <div
        className={
          isHero
            ? 'relative aspect-[16/9] w-full bg-mist'
            : 'relative aspect-[3/2] w-full bg-mist'
        }
      >
        <Image
          src={entry.heroImage}
          alt="" /* decorative — title carries the accessible name */
          fill
          sizes={
            isHero
              ? '(min-width: 1024px) 50vw, 100vw'
              : '(min-width: 1024px) 33vw, 100vw'
          }
          className="object-cover"
          priority={isHero}
        />
      </div>

      <div className={isHero ? 'p-6 md:p-8' : 'p-5'}>
        <p className="text-xs uppercase tracking-wide text-muted">
          {entry.builder.name}
          {entry.builder.company ? ` · ${entry.builder.company}` : null}
        </p>
        <h2
          id={`showcase-${entry.slug}-title`}
          className={
            isHero
              ? 'mt-2 font-display text-2xl text-foreground group-hover:text-accent md:text-3xl'
              : 'mt-2 font-display text-lg text-foreground group-hover:text-accent'
          }
        >
          {entry.title}
        </h2>
        <p
          className={
            isHero
              ? 'mt-3 max-w-xl text-base text-muted'
              : 'mt-2 text-sm text-muted'
          }
        >
          {entry.summary}
        </p>
        <p className="mt-4 text-xs text-link">View project →</p>
      </div>
    </Link>
  );
}
```

#### `/showcase` Index Page

**NEW** `src/app/showcase/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { ShowcaseCard } from '@/components/showcase/ShowcaseCard';
import { getAllShowcaseEntries } from '@/lib/content/showcase';

export const metadata: Metadata = {
  title: 'Built with Travis Gautier',
  description:
    'Community projects shipped with the Travis Gautier methodology — in-house work, agent-driven builds, and case studies from the field.',
};

export default async function ShowcaseIndexPage() {
  const entries = await getAllShowcaseEntries();
  const featured = entries.filter((entry) => entry.featured);
  const allEntries = entries; // featured entries also appear in the full list (see README "Open Items")

  return (
    <Container as="main" className="py-12 md:py-16">
      <header className="mb-12 border-b border-mist pb-6">
        <p className="text-xs uppercase tracking-wide text-muted">Showcase</p>
        <h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">
          Built with Travis Gautier
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Projects shipped with the Travis Gautier methodology. Each entry documents
          a real build — team, stack, outcomes — from inside the channel and
          from the community.
        </p>
      </header>

      {featured.length > 0 && (
        <section
          aria-labelledby="showcase-featured-heading"
          className="mb-16"
        >
          <h2
            id="showcase-featured-heading"
            className="mb-6 text-sm font-medium uppercase tracking-wide text-muted"
          >
            Featured
          </h2>
          <ul className="grid gap-6 md:grid-cols-2">
            {featured.map((entry) => (
              <li key={entry.slug}>
                <ShowcaseCard entry={entry} variant="hero" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="showcase-all-heading">
        <h2
          id="showcase-all-heading"
          className="mb-6 text-sm font-medium uppercase tracking-wide text-muted"
        >
          All entries
        </h2>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allEntries.map((entry) => (
            <li key={entry.slug}>
              <ShowcaseCard entry={entry} variant="standard" />
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
```

### Tests (red phase of section `community-showcase-2.1`)

#### `<ShowcaseCard>` component tests

`src/components/showcase/__tests__/ShowcaseCard.test.tsx`:

- Renders title as an `<h2>` heading
- Renders `entry.builder.name` in the eyebrow
- Renders `entry.builder.name · entry.builder.company` when company is present; just the name when it's absent
- Renders summary text
- Wraps everything in a `<Link>` pointing to `/showcase/{slug}`
- `variant="hero"` applies the hero classes (assert on `aspect-[16/9]`, `text-2xl`, `p-6`)
- `variant="standard"` applies the standard classes (assert on `aspect-[3/2]`, `text-lg`, `p-5`)
- `variant="hero"` sets `priority={true}` on the `<Image>` (inspect the rendered `img` element or mock `next/image`)
- `<Image>` `alt=""` — decorative, since the card is already labelled via `aria-labelledby` pointing at the title heading
- Default variant is `"standard"` when not passed

#### Index page tests

`src/app/showcase/__tests__/page.test.tsx`:

- Mock `getAllShowcaseEntries()` to return a fixture array: two featured + three non-featured
- Featured section renders when at least one entry has `featured: true`; hidden entirely when `featured.length === 0`
- Featured grid contains exactly 2 `<ShowcaseCard variant="hero">` elements
- "All entries" grid contains 5 `<ShowcaseCard variant="standard">` elements (featured entries included — dedup is "Open Items" territory)
- "All entries" heading is always present
- Featured section has `aria-labelledby="showcase-featured-heading"` and the matching `<h2 id="...">`
- `metadata.title === 'Built with Travis Gautier'`
- `metadata.description` exists and is a non-empty string
- Zero-entry handling: Phase 1.2 guards empty at the loader. Test a "featured: []" fixture to confirm the featured section is hidden without throwing.

### Design Decisions

#### Card

- **Single component with a `variant` prop** — two tightly-coupled visual modes for the same record. Splitting into `<FeaturedShowcaseCard>` and `<ShowcaseCard>` would double the places that need updating when styling drifts.
- **Card-wraps-content `<Link>` pattern** — the whole card is the click target, not just the title or the "View project →" text. Matches the `<ToolCard>` pattern from `free-tools`.
- **`aria-labelledby` pointing at the title heading** — screen readers announce "link: {title}" when the card is focused, not the whole card text. The `<Image>` is marked decorative (`alt=""`) to avoid double-narration.
- **`priority` on hero variants** — hero cards are above-the-fold for the featured grid, so `next/image` should LCP-load them. Standard cards are below the fold and lazy-load.
- **Separate `sizes` per variant** — hero cards span half the viewport at desktop, standard cards span a third. Accurate `sizes` lets `next/image` serve the right responsive asset.
- **`aspect-[16/9]` on hero, `aspect-[3/2]` on standard** — hero cards get a cinematic ratio matching the captured screenshot; standard cards get a slightly taller crop that balances in a 3-column grid.
- **`group-hover:text-accent` on the title** — the whole card is the hover surface, not just the title. Grouping the hover into the parent link container keeps the effect unified.
- **No builder avatar in the card** — cards should read quickly; the avatar is a detail-page concern where there's more room. Keeps the card layout text-first and scannable.
- **Summary capped at 280 chars by Phase 1.1's Zod schema** — the card layout doesn't need to truncate; the validator already enforces a length ceiling.
- **No click counter / no tracking pixel** — out of scope for v1. If tracking is added later, it goes in the `<Link>` wrapper, not the card body.

#### Index Page

- **Server component with `await getAllShowcaseEntries()`** — Next.js 16 App Router supports async server components natively. No `getStaticProps` needed, no client-side fetching.
- **Featured section hidden entirely when empty** — returning `null` for an empty hero grid is uglier than gating the whole `<section>` with `featured.length > 0`. The "All entries" grid carries the page alone when nothing is featured.
- **Featured entries appear in both sections by default** — per the README's "Open Items", the simplest behavior is "featured cards also show up in All entries". Dedup is a one-line filter (`allEntries.filter(e => !e.featured)` or `[...featured, ...nonFeatured]`) if this ever needs changing.
- **`<ul>` + `<li>` wrappers around cards** — semantic grids are lists; Lighthouse a11y cares. Matches the `/episodes`, `/cases`, `/tools` indexes from `wf` and `free-tools`.
- **`grid gap-6 md:grid-cols-2` for featured, `md:grid-cols-2 lg:grid-cols-3` for all** — hero cards get more room (2 per row on desktop) so the 16:9 images read; standard cards pack into 3 per row at wide viewports for density. Matches the rhythm of other indexes.
- **`metadata` as a const, not `generateMetadata`** — the index is fully static per request; no per-request metadata computation. Phase 3.1 widens this into `openGraph` / `twitter` but stays a const.
- **Copy is deliberate brand framing, not lorem ipsum** — the index is a first-impression surface, so the intro paragraph has to be actual copy. Writing it now (even if placeholder-ish) prevents a shipping-with-lorem regression.
- **No client interactivity** — no filter bar, no sort controls, no tag selector. All of those are out-of-scope per the scope decisions.
- **No pagination** — the expected gallery size for v1 is single-digit. Pagination gets added when there are 50+ entries; adding it pre-emptively is speculative complexity.
- **Card and consumer ship in one section** — the card has no other consumer in v1 (the detail page does not embed `<ShowcaseCard>`), so building it without the page leaves both halves untestable in dev. Page tests rely on rendered card output to verify variant assignment.

### Files

| Action | File                                                      |
|--------|-----------------------------------------------------------|
| NEW    | `src/components/showcase/ShowcaseCard.tsx`                |
| NEW    | `src/components/showcase/__tests__/ShowcaseCard.test.tsx` |
| NEW    | `src/app/showcase/page.tsx`                               |
| NEW    | `src/app/showcase/__tests__/page.test.tsx`                |

---

## Feature 2.2: `/showcase/[slug]` Detail Page

**Complexity: L** — The most-moving-parts feature of the job. Detail route
needs a hero image, builder block, stack pills, links row, MDX body, optional
gallery, LLL crosslinks, and build-time static params. All within one route
file that delegates to small presentational sub-components.

### Problem

Each showcase entry needs a full page: visitors arriving from search or a
shared link expect a project writeup, screenshots, builder attribution, and
outbound links — not a thin index card. The detail page is also the surface
the Phase 3.1 JSON-LD hangs on, so it has to exist and be stable before
metadata polish can land.

### Implementation

**NEW** `src/components/showcase/ShowcaseBuilder.tsx`:

```tsx
import Image from 'next/image';
import type { Builder } from '@/content/schemas';

interface ShowcaseBuilderProps {
  builder: Builder;
}

export function ShowcaseBuilder({ builder }: ShowcaseBuilderProps) {
  const displayHandle = builder.handle ?? null;
  const handleHref =
    builder.handleUrl ??
    (displayHandle ? `https://github.com/${displayHandle.replace(/^@/, '')}` : null);

  return (
    <div className="flex items-center gap-4">
      {builder.avatarUrl && (
        <Image
          src={builder.avatarUrl}
          alt={`Avatar for ${builder.name}`}
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-full border border-mist object-cover"
        />
      )}
      <div className="min-w-0">
        <p className="font-display text-lg text-foreground">{builder.name}</p>
        <p className="mt-1 text-sm text-muted">
          {handleHref && displayHandle ? (
            <a
              href={handleHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:underline"
            >
              {displayHandle}
            </a>
          ) : null}
          {handleHref && displayHandle && builder.company ? ' · ' : null}
          {builder.company ? <span>{builder.company}</span> : null}
        </p>
      </div>
    </div>
  );
}
```

**NEW** `src/components/showcase/ShowcaseStack.tsx`:

```tsx
interface ShowcaseStackProps {
  stack: string[];
}

export function ShowcaseStack({ stack }: ShowcaseStackProps) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tech stack">
      {stack.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-mist bg-parchment px-3 py-1 text-xs uppercase tracking-wide text-muted"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
```

**NEW** `src/components/showcase/ShowcaseLinks.tsx`:

```tsx
import Link from 'next/link';
import type { Showcase } from '@/content/schemas';

interface ShowcaseLinksProps {
  entry: Showcase;
}

export function ShowcaseLinks({ entry }: ShowcaseLinksProps) {
  const items: Array<{ label: string; href: string; external?: boolean }> = [];

  if (entry.liveUrl) items.push({ label: 'Live site', href: entry.liveUrl, external: true });
  if (entry.repoUrl) items.push({ label: 'Source', href: entry.repoUrl, external: true });
  if (entry.relatedEpisodeSlug) {
    items.push({ label: 'Related episode', href: `/episodes/${entry.relatedEpisodeSlug}` });
  }
  if (entry.relatedCaseSlug) {
    items.push({ label: 'Related case', href: `/cases/${entry.relatedCaseSlug}` });
  }

  if (items.length === 0) return null;

  return (
    <nav aria-label="Project links" className="flex flex-wrap gap-4">
      {items.map((item) =>
        item.external ? (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-link hover:underline"
          >
            {item.label} ↗
          </a>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-link hover:underline"
          >
            {item.label} →
          </Link>
        ),
      )}
    </nav>
  );
}
```

**NEW** `src/components/showcase/ShowcaseGallery.tsx`:

```tsx
import Image from 'next/image';

interface ShowcaseGalleryProps {
  images: string[];
  title: string;
}

export function ShowcaseGallery({ images, title }: ShowcaseGalleryProps) {
  if (images.length === 0) return null;

  return (
    <section aria-labelledby="showcase-gallery-heading" className="mt-16">
      <h2
        id="showcase-gallery-heading"
        className="mb-6 text-sm font-medium uppercase tracking-wide text-muted"
      >
        Gallery
      </h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {images.map((src, i) => (
          <li
            key={src}
            className="relative aspect-[3/2] overflow-hidden rounded-md border border-mist bg-mist"
          >
            <Image
              src={src}
              alt={`${title} screenshot ${i + 1}`}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

**NEW** `src/app/showcase/[slug]/page.tsx`:

```tsx
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Container } from '@/components/site/Container';
import { LllCrosslinks } from '@/components/crosslinks/LllCrosslinks';
import { ShowcaseBuilder } from '@/components/showcase/ShowcaseBuilder';
import { ShowcaseStack } from '@/components/showcase/ShowcaseStack';
import { ShowcaseLinks } from '@/components/showcase/ShowcaseLinks';
import { ShowcaseGallery } from '@/components/showcase/ShowcaseGallery';
import {
  getAllShowcaseEntries,
  getShowcaseEntryBySlug,
} from '@/lib/content/showcase';

export const dynamicParams = false;

export async function generateStaticParams() {
  const entries = await getAllShowcaseEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShowcaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getShowcaseEntryBySlug(slug);
  if (!entry) notFound();

  // Dynamic import of the MDX body for this slug. `wf` 2.1 sets up the MDX
  // pipeline so these imports resolve at build time via `@next/mdx`.
  const mdxModule = await import(`@/content/showcase/${entry.slug}.mdx`);
  const MdxBody = mdxModule.default;

  return (
    <article>
      <div className="relative aspect-[16/9] w-full bg-mist">
        <Image
          src={entry.heroImage}
          alt={`${entry.title} hero screenshot`}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>

      <Container as="div" className="py-12 md:py-16">
        <header className="mb-10 border-b border-mist pb-8">
          <p className="text-xs uppercase tracking-wide text-muted">Showcase</p>
          <h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">
            {entry.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted">{entry.summary}</p>

          <div className="mt-8 space-y-6">
            <ShowcaseBuilder builder={entry.builder} />
            <ShowcaseStack stack={entry.stack} />
            <ShowcaseLinks entry={entry} />
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          <MdxBody />
        </div>

        {entry.gallery && entry.gallery.length > 0 && (
          <ShowcaseGallery images={entry.gallery} title={entry.title} />
        )}

        {entry.lllEntryUrls.length > 0 && (
          <div className="mt-16">
            <LllCrosslinks entries={entry.lllEntryUrls} />
          </div>
        )}
      </Container>
    </article>
  );
}
```

### Tests (red phase of section `community-showcase-2.2`)

Component tests (separate files):

- `src/components/showcase/__tests__/ShowcaseBuilder.test.tsx`
  - Renders builder name
  - Renders avatar `<Image>` when `avatarUrl` is present; omits the avatar node when absent
  - Renders `handle` as a link using `handleUrl` when both present
  - Falls back to `https://github.com/{handle}` when `handleUrl` is absent but `handle` exists
  - Renders company when present; omits separator dot when company is absent
  - External links use `target="_blank"` + `rel="noopener noreferrer"`
- `src/components/showcase/__tests__/ShowcaseStack.test.tsx`
  - Renders one `<li>` per stack entry
  - `<ul>` has `aria-label="Tech stack"`
- `src/components/showcase/__tests__/ShowcaseLinks.test.tsx`
  - Renders all four link types when present (live, repo, episode, case)
  - Omits missing links
  - External (live, repo) uses `<a target="_blank" rel="noopener noreferrer">`
  - Internal (episode, case) uses `<Link>` with correct hrefs (`/episodes/{slug}`, `/cases/{slug}`)
  - Returns `null` when all four are missing (so no empty `<nav>` renders)
- `src/components/showcase/__tests__/ShowcaseGallery.test.tsx`
  - Renders one `<li>` + `<Image>` per image
  - Each `alt` is `{title} screenshot {i+1}`
  - Returns `null` when `images.length === 0`

Page tests:

- `src/app/showcase/[slug]/__tests__/page.test.tsx`
  - Mock `getAllShowcaseEntries()` and `getShowcaseEntryBySlug()`
  - Mock `notFound` from `next/navigation`; assert it's called for an unknown slug
  - Assert `dynamicParams === false`
  - Assert `generateStaticParams()` returns one `{ slug }` per entry
  - Rendering with a known slug produces: title heading, summary, builder name, stack pills, every populated link, and the gallery when `gallery` is present
  - `gallery` absent → no `<ShowcaseGallery>` output (no gallery heading)
  - `lllEntryUrls: []` → no `<LllCrosslinks>` output
  - `lllEntryUrls` non-empty → `<LllCrosslinks>` rendered with the array
  - MDX body import is exercised with a test-only mock for `@/content/showcase/{slug}.mdx` (the test either stubs the dynamic import or uses a fixture entry with a known MDX file)

### Design Decisions

- **Full-width hero image, not container-constrained** — the hero is the visual anchor of the page. Breaking out of the container at full viewport width gives it the weight it needs. Container wraps the rest of the content underneath.
- **Hero image has a real alt text, not empty** — detail-page heroes are content, not decoration. Screen readers benefit from the description. The card-context hero is decorative (title heading is the accessible name); the detail-context hero stands alone.
- **`priority` on the hero `<Image>`** — above-the-fold, LCP candidate. Matches the card variant="hero" `priority` wiring.
- **Components split into five files** — `ShowcaseBuilder`, `ShowcaseStack`, `ShowcaseLinks`, `ShowcaseGallery`, `ShowcaseCard`. Each has one concern and tests in isolation. Attempting to cram them all into one file makes RTL tests noisy (full render of the page just to probe the links row).
- **`ShowcaseLinks` returns `null` when empty** — the page has three cases: all four links, some links, no links. Returning null from the component keeps the page's `<header>` tree clean without conditional `{x && …}` chains.
- **GitHub fallback for `handleHref`** — `@kirahall` without an explicit URL is overwhelmingly likely to be a GitHub handle in this audience. The schema still permits `handleUrl` to override for non-GitHub identities. If future builders prefer X or Bluesky, they supply `handleUrl` and the fallback is ignored.
- **MDX body imported dynamically via template-string `import()`** — the MDX pipeline from `wf` 2.1 supports template-string imports with the `@next/mdx` loader. Each slug maps to exactly one file, and the dynamic import resolves at build time (not request time) because `generateStaticParams` + `dynamicParams = false` pre-renders the full set. No runtime `import()` overhead.
- **`dynamicParams = false`** — unknown slugs 404 at build time. Matches the `wf` episode/case detail patterns.
- **`notFound()` from `next/navigation`** — idiomatic App Router 404 trigger; the catch-all + 404 page from `wf` 1.4 handles the response.
- **`prose` class on the MDX body wrapper** — gives the MDX content typographic defaults from Tailwind Typography (if installed by `wf`) or from the brand token set (if not). If `prose-lg` isn't available, swap to a plain `className` with brand tokens during Phase 2.2 implementation.
- **Gallery + LLL crosslinks are optional blocks** — they render only when non-empty. Matches the schema's optional-ness. Prevents empty section headings from leaking into the DOM.
- **`lllEntryUrls` array check before rendering `<LllCrosslinks>`** — defensive but cheap: the schema guarantees the array exists, so the guard just checks length.
- **One dynamic route file, not one per slug** — per the `free-tools` pattern. Adding a new showcase entry means one new MDX file, zero new route files.
- **`params: Promise<{ slug: string }>`** — Next.js 16 pattern. `AGENTS.md` flags it as a breaking change from earlier versions.

### Files

| Action | File                                                             |
|--------|------------------------------------------------------------------|
| NEW    | `src/components/showcase/ShowcaseBuilder.tsx`                    |
| NEW    | `src/components/showcase/ShowcaseStack.tsx`                      |
| NEW    | `src/components/showcase/ShowcaseLinks.tsx`                      |
| NEW    | `src/components/showcase/ShowcaseGallery.tsx`                    |
| NEW    | `src/components/showcase/__tests__/ShowcaseBuilder.test.tsx`     |
| NEW    | `src/components/showcase/__tests__/ShowcaseStack.test.tsx`       |
| NEW    | `src/components/showcase/__tests__/ShowcaseLinks.test.tsx`       |
| NEW    | `src/components/showcase/__tests__/ShowcaseGallery.test.tsx`     |
| NEW    | `src/app/showcase/[slug]/page.tsx`                               |
| NEW    | `src/app/showcase/[slug]/__tests__/page.test.tsx`                |

---

## Phase 2 Exit Criteria

- `npm run lint` clean, `npm test` green, coverage still ≥ thresholds, `npm run build` clean
- `/showcase` renders under `npm run dev` — seed entry visible in the featured grid
- `/showcase/party-masters-team` renders hero image, builder block, stack pills, links row, MDX body, and any gallery + LLL crosslinks that the seed defines
- `/showcase/bogus` returns a 404
- `generateStaticParams` includes the seed slug
- Component RTL tests cover every branch of every component
- Page tests cover the "no gallery", "no crosslinks", "404" branches
- Phase 3 can start: both pages exist, so metadata widening and sitemap work have concrete targets
