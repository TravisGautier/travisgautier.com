# Phase 3: Polish

**Total Size: L**
**Prerequisites:** Phase 2 complete (all four calculators registered and rendering).
**New Types:** None.
**New Files:** None (all work is `MODIFY` only).

Phase 3 is the final polish before the job can ship: per-tool SEO + JSON-LD
so `/tools/{slug}` pages are indexable and rich-result-eligible, sitemap
integration so crawlers can find the tools, a header nav link so the site's
own visitors can, and a Lighthouse + keyboard sweep to make sure nothing
regressed a11y/perf. All of these are small finishing touches that share a
"ship-readiness" theme, so they ship as one TDD cycle.

---

## Feature 3.1: SEO Metadata + JSON-LD + Sitemap + Nav + A11y/Perf Sweep

**Complexity: L** — `generateMetadata()` on the dynamic route, `SoftwareApplication` JSON-LD, richer metadata on the `/tools` index, sitemap integration for `/tools` + every tool route, site-shell nav link with active-state styling, and the full Lighthouse + keyboard sweep. All are ship-readiness polish that primarily MODIFY existing files.

### Problem

Every tool is an SEO target in its own right — the whole point of `/tools`
is that people search for "AI ROI calculator" or "dev agency pricing
calculator" and land on these specific pages. Generic site-wide metadata
from `wf` isn't enough. Each tool needs a unique `<title>`, unique meta
description, OpenGraph tags, Twitter card tags, and `SoftwareApplication`
JSON-LD so Google can render rich results and offer the "Free" price
annotation that boosts CTR. The `/tools` index page metadata also needs
upgrading with OG + Twitter fields so the hub itself shares cleanly.

Three more loose ends still need to land before the job can ship:

1. `/sitemap.xml` from `wf` 4.4 only lists episodes + cases + static routes. It needs the `/tools` index and every `/tools/{slug}` route.
2. The site shell `<Header>` from `wf` 1.4 doesn't link to `/tools`. Visitors can only reach tools via search, the homepage, or typing the URL. That's a broken brand site.
3. The whole `/tools` section needs a Lighthouse + keyboard sweep before ship to catch any regression the individual feature tests missed.

All five concerns are MODIFY-only polish that share a theme, so they ship as one TDD cycle.

### Implementation

#### Per-tool SEO Metadata + JSON-LD

**MODIFY** `src/app/tools/[slug]/page.tsx` — add `generateMetadata()` and inline JSON-LD:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllTools, getToolBySlug } from '@/content/tools/registry';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ slug: tool.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  return {
    title: tool.title,
    description: tool.summary,
    openGraph: {
      title: tool.title,
      description: tool.summary,
      type: 'website',
      url: `/tools/${tool.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.title,
      description: tool.summary,
    },
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.title,
    description: tool.summary,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `https://travisgautier.com/tools/${tool.slug}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const { Component } = tool;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Component />
    </>
  );
}
```

**MODIFY** `src/app/tools/page.tsx` — expand the existing `metadata` const with OG + Twitter tags:

```tsx
export const metadata: Metadata = {
  title: 'Free Tools',
  description:
    'Free calculators for project scoping, pricing, ROI analysis, and discovery timelines. Built by Travis Gautier.',
  openGraph: {
    title: 'Free Tools · travisgautier',
    description:
      'Free, no-login calculators for project scoping, pricing, ROI, and discovery timelines.',
    type: 'website',
    url: '/tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Tools · travisgautier',
    description:
      'Free, no-login calculators for project scoping, pricing, ROI, and discovery timelines.',
  },
  alternates: {
    canonical: '/tools',
  },
};
```

#### Sitemap Integration

**MODIFY** `src/app/sitemap.ts` — import the tools registry and append routes:

```ts
import type { MetadataRoute } from 'next';
import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';
import { getAllTools } from '@/content/tools/registry';

const BASE_URL = 'https://travisgautier.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, cases] = await Promise.all([
    getAllEpisodes(),
    getAllCases(),
  ]);
  const tools = getAllTools();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,          changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/episodes`,  changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/cases`,     changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`,     changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE_URL}/tools`,     changeFrequency: 'monthly', priority: 0.7 },
  ];

  const episodeRoutes = episodes.map((ep) => ({
    url: `${BASE_URL}/episodes/${ep.slug}`,
    lastModified: ep.publishedAt ? new Date(ep.publishedAt) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const caseRoutes = cases.map((c) => ({
    url: `${BASE_URL}/cases/${c.slug}`,
    lastModified: c.shippedAt ? new Date(c.shippedAt) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const toolRoutes = tools.map((t) => ({
    url: `${BASE_URL}/tools/${t.slug}`,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...episodeRoutes, ...caseRoutes, ...toolRoutes];
}
```

#### Site Shell Nav Link

**MODIFY** `src/components/site/Header.tsx` — add a `/tools` nav link between `/cases` and `/about`.

Exact changes depend on how `wf` 1.4 structured the header. Expected shape:

```tsx
// Before
const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases',    label: 'Cases' },
  { href: '/about',    label: 'About' },
];

// After
const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases',    label: 'Cases' },
  { href: '/tools',    label: 'Tools' },   // ← new
  { href: '/about',    label: 'About' },
];
```

Active-state styling: the nav link should highlight when `usePathname()` starts with `/tools`. If `wf` 1.4 already implemented `usePathname`-based active styling, this is a one-line array change. If not, this feature adds the pattern:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// inside the Header component:
const pathname = usePathname();
// ...
{NAV_ITEMS.map((item) => {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={isActive ? 'text-accent' : 'text-foreground hover:text-accent'}
    >
      {item.label}
    </Link>
  );
})}
```

#### Accessibility + Performance Sweep

Run against a local `npm run build && npm run start` instance, targeting
every `/tools` route:

- **Lighthouse minimums** on `/tools`, `/tools/project-scoping`, `/tools/pricing`, `/tools/roi`, `/tools/discovery-timeline`:
  - Accessibility ≥ 95
  - Performance ≥ 90
  - SEO ≥ 95
  - Best Practices ≥ 90
- **Keyboard walkthrough** on each tool page:
  - Tab order: site header → main content → inputs top-to-bottom → submit button → (if result present) capture form input → capture submit → footer
  - Every focusable element has a visible focus ring (check against `--color-accent` on `--color-parchment`)
  - Result region announced by screen reader when it updates (handled by `aria-live="polite"` on `<ToolShell>` — already in Phase 1.1)
  - Form inputs all have associated `<label>` elements, not placeholder-only
- **Color contrast** on the brand tokens in tool contexts:
  - `text-muted` on `bg-parchment`: ≥ 4.5:1 for body text, ≥ 3:1 for large text (e.g. the muted category label on `<ToolCard>`)
  - `text-link` on `bg-parchment`: ≥ 4.5:1
  - `text-parchment` on `bg-accent` (the submit button): ≥ 4.5:1
  - If any of the above fail, adjust the relevant token in `src/app/globals.css`. `wf` 1.3 sets these, but the tool context may expose a contrast issue the `wf` sweep didn't catch.
- **No layout shift** when the result pane transitions from the placeholder ("Fill in the inputs to see a result.") to a computed result. `<ToolShell>` should reserve a minimum height on the result `<section>` — add `min-h-[220px]` (or similar, tuned to the largest result view) in `src/components/tools/ToolShell.tsx` if a visible shift is observed.
- **No horizontal overflow** on mobile for the discovery timeline result (the one most likely to blow out — make sure the mobile fallback is a stacked `<ol>`, not a wide horizontal grid).
- **Document all four Lighthouse scores in the `/finish` commit message** for this section so the pass is audited at commit time.

### Tests (red phase of section `free-tools-3.1`)

**SEO metadata:**
- `generateMetadata({ params: { slug: 'pricing' } })` returns a metadata object whose `title` matches the registered tool title, description matches summary, `openGraph.url === '/tools/pricing'`, `alternates.canonical === '/tools/pricing'`
- `generateMetadata` with an unknown slug returns `{}`
- `/tools` index `metadata.openGraph.title === 'Free Tools · travisgautier'`

**JSON-LD:**
- Rendering the page (RTL `render`) produces a DOM containing a `<script type="application/ld+json">` tag whose JSON parses to an object with `'@type': 'SoftwareApplication'` and matching `name`/`description`
- JSON-LD `offers.price === '0'` and `offers.priceCurrency === 'USD'`

**Sitemap:**
- `sitemap()` returns a result containing `/tools` as a static route and one entry per tool in the registry (mock the episode/case loaders to return empty arrays so the test isolates tools)
- Tool routes in the sitemap carry `priority: 0.6` and `changeFrequency: 'yearly'`
- `/tools` static route carries `priority: 0.7` and `changeFrequency: 'monthly'`

**Nav:**
- Header `NAV_ITEMS` contains `{ href: '/tools', label: 'Tools' }`
- Header renders a link to `/tools` with `aria-current="page"` when `usePathname()` returns `/tools` or `/tools/pricing` (mock `next/navigation`)

### Design Decisions

**SEO + JSON-LD:**
- **`SoftwareApplication` type** — the most semantically correct schema.org type for an interactive calculator. Google indexes `SoftwareApplication` entries and can render the "Free" price annotation in search results, which is exactly the top-of-funnel hook we want.
- **`price: '0'` + `priceCurrency: 'USD'`** — matches the "free tool" framing. Google's documentation specifically supports `'0'` as a valid price for free apps, and it causes "Free" to appear in rich results.
- **JSON-LD via `dangerouslySetInnerHTML`** — the standard Next.js pattern for inline structured data. React's default string-encoding would escape the JSON braces and break the script.
- **`openGraph.url` and `alternates.canonical` as path strings** — `metadataBase` was set at the root in `wf` 4.3, so relative paths resolve automatically. No base URL duplication.
- **Shared description between `openGraph` and `twitter`** — DRY. The only difference is Twitter needs an explicit `card: 'summary_large_image'`.
- **No dynamic OG image generation** — the site-wide `/og-default.png` from `wf` 4.3 suffices. A future enhancement job can add per-tool OG cards (via `@vercel/og` or equivalent) when there's real traction to justify the work. Phase 3 does not block on this.
- **`notFound()` still fires for unknown slugs, even with JSON-LD in the page body** — the `if (!tool) notFound()` line runs before the JSON-LD block, so invalid routes 404 cleanly.

**Sitemap + nav + sweep:**
- **Sitemap priorities (`/tools` 0.7, individual tools 0.6)** — tools are evergreen SEO assets but less narratively central than episodes (0.8) or cases (0.9). The hub page ranks a notch above its children because it aggregates inbound links.
- **`changeFrequency: 'yearly'` on individual tools** — the calculators are stable. The coefficients get tuned during `/red`/`/green` and then stay put. Monthly would be a lie to crawlers.
- **`changeFrequency: 'monthly'` on `/tools` hub** — the hub changes when a new tool is added. That's rarer than monthly in practice but signals to crawlers that occasional re-indexing is worthwhile.
- **Active-state via `usePathname()` and `startsWith('/tools/')`** — highlights the nav item not just on the hub but also on every tool detail page. This is the expected UX pattern for sub-navigation.
- **`aria-current="page"` attribute** — the semantically correct way to indicate the active nav item to assistive tech. `className` differences alone don't announce.
- **Lighthouse scores documented in commit message** — makes the a11y/perf pass auditable. If a future change regresses a score, the baseline is in git history.
- **`min-h-[220px]` as a layout-shift guard** — the exact value is tuned during the sweep. The point is to reserve the worst-case result pane height so the page doesn't lurch when a result appears.

### Files

| Action | File                                                                                                          |
|--------|---------------------------------------------------------------------------------------------------------------|
| MODIFY | `src/app/tools/[slug]/page.tsx`                                                                               |
| MODIFY | `src/app/tools/page.tsx`                                                                                      |
| MODIFY | `src/app/sitemap.ts`                                                                                          |
| MODIFY | `src/components/site/Header.tsx`                                                                              |
| MODIFY | `src/components/tools/ToolShell.tsx` (only if layout-shift sweep finds an issue — reserving result min-height) |

---

## Phase 3 Exit Criteria

- Per-tool `generateMetadata` produces unique, correct metadata in `view-source:` on every `/tools/{slug}` route
- `SoftwareApplication` JSON-LD validates at https://validator.schema.org for every tool
- `/sitemap.xml` lists `/tools`, `/tools/project-scoping`, `/tools/pricing`, `/tools/roi`, `/tools/discovery-timeline`
- Header nav shows a `/tools` link with correct active-state highlighting (manual visual check on `/tools` and each tool detail page)
- Lighthouse a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90 on every tool route — scores documented in `/finish` commit message
- Full keyboard walkthrough succeeds on every tool route with no dead ends
- No visible layout shift when a tool result renders for the first time
- `npm run lint` clean, `npm test` green + coverage still ≥ thresholds, `npm run build` clean

---

## Job Exit Criteria (across all phases)

Once Phase 3 ships, the `free-tools` job is complete and ready for its
`/finish` + commit cycle. At that point:

- `/tools` is a fully-working hub linked from the site header
- All four calculators work end-to-end at `/tools/{slug}`
- Each tool captures email via the existing Resend integration with `source=tool-{slug}` so the future `email-funnel` job can segment on it
- Every tool route ships per-page SEO metadata + `SoftwareApplication` JSON-LD
- The sitemap includes every new route
- Lighthouse and keyboard-only passes are green

The next `jobbuild` candidates after `free-tools` ships (per `docs/future-jobs.md`):
- `storefront-auth` — `/products` tree with auth + checkout
- `community-showcase` — "Built with Travis Gautier" showcase
- `testimonials-results` — testimonial components + results wall

None of these hard-depend on `free-tools`. Pick based on business priority
(channel launch cadence, storefront urgency, community momentum).
