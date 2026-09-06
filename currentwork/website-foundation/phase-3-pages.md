# Phase 3: Pages

**Total Size: M + L + L + S**
**Prerequisites: Phase 1 + Phase 2 complete (content loader + seed content working)**
**New Types: None**
**New Files: `src/app/episodes/page.tsx`, `src/app/episodes/[slug]/page.tsx`, `src/app/cases/page.tsx`, `src/app/cases/[slug]/page.tsx`, `src/app/about/page.tsx`**

Phase 3 builds every public route that Phase 0 + Phase 1 of the implementation
doc specifies. All four features in this phase are parallel-able once Phase 2
lands — they share the loader but not each other.

---

## Feature 3.1: `/` Homepage Rebuild

**Complexity: M** — Replace the scaffold placeholder with a real homepage: brand
statement, latest episode, section entry points, LLL callout, email capture CTA.

### Problem

The homepage is the conversion front door. Per the implementation doc:
"Communicate what Travis Gautier is in one screen, drive viewers to the latest
episode + storefront, capture email." Today it's an `<h1>`. Everything else in
this job is invisible to a first-time visitor until this page exists.

### Implementation

**MODIFY** `src/app/page.tsx`:

```tsx
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { getLatestEpisode } from '@/lib/content/episodes';

const SECTIONS = [
  { href: '/episodes', title: 'Episodes', description: 'The full channel archive — flagship series, playbooks, shorts.' },
  { href: '/cases', title: 'Case Studies', description: 'Real client projects documented end to end.' },
  { href: '/about', title: 'About', description: 'The Travis Gautier premise and the sister project.' },
];

export default async function Home() {
  const latest = await getLatestEpisode();

  return (
    <>
      <section className="border-b border-mist">
        <Container as="div" className="py-24 md:py-32">
          <p className="text-sm uppercase tracking-wide text-accent">
            Travis Gautier
          </p>
          <h1 className="mt-6 font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            One person.<br />
            An agent team.<br />
            Full SaaS delivery.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-muted">
            A documented real-world case study of using AI agent teams to run a
            legitimate software consulting business. Real clients, real money,
            real deliverables.
          </p>
          <div className="mt-10 max-w-md">
            <EmailCapture source="homepage-hero" />
          </div>
        </Container>
      </section>

      {latest && (
        <section>
          <Container as="div" className="py-20">
            <p className="text-sm uppercase tracking-wide text-muted">Latest episode</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              <Link href={`/episodes/${latest.slug}`} className="hover:text-accent">
                {latest.title}
              </Link>
            </h2>
            <p className="mt-4 max-w-2xl text-muted">{latest.summary}</p>
          </Container>
        </section>
      )}

      <section className="border-t border-mist">
        <Container as="div" className="py-20">
          <h2 className="font-display text-3xl font-semibold">Where to next</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="block rounded-lg border border-mist p-6 hover:border-accent"
                >
                  <p className="font-display text-xl font-semibold">{section.title}</p>
                  <p className="mt-2 text-sm text-muted">{section.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
```

### Design Decisions

- **Hero is three-line display copy + summary + capture** — matches the brand doc's "confident, no over-explanation" tone. The site knows what it is on first scroll.
- **Latest episode is loaded via `getLatestEpisode()`** — directly from the Phase 2 loader. No duplicate sort logic on the page.
- **Section grid hardcoded to `/episodes`, `/cases`, `/about`** — these are the three public destinations in this job. Future jobs that add `/tools`, `/products`, `/community` can extend the grid.
- **`EmailCapture source="homepage-hero"`** — the server action in Phase 4.1 receives the `source` field so we can attribute captures to the entry point.
- **No LLL callout on the homepage** — that lives in the Footer (Phase 1.4), which is already visible. Adding it here again would over-emphasize it relative to the brand doc's "acknowledged openly, not loud" directive.

### Files

| Action | File                        |
|--------|-----------------------------|
| MODIFY | `src/app/page.tsx`          |

---

## Feature 3.2: Episodes (Index + Detail) [x]

**Complexity: L** — Episodes index grid sorted by `publishedAt` desc, plus the
detail page that renders the MDX body, shows metadata, lists source materials,
and surfaces LLL crosslinks.

### Problem

Visitors from YouTube need to see the full catalogue (index), and after a video
they need show notes, the MDX body, tier/pillar badges, source-material
callouts, LLL crosslinks, a YouTube link, and contextual email capture (detail).
The SEO long-tail depends on episode titles being indexable.

### Implementation

**NEW** `src/app/episodes/page.tsx`:

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { getAllEpisodes } from '@/lib/content/episodes';
import { CONTENT_PILLAR_QUESTIONS } from '@/content/schemas';
import { CONTENT_TIER_LABELS } from '@/content/schemas';

export const metadata: Metadata = {
  title: 'Episodes',
  description:
    'The full Travis Gautier episode archive — flagship series, playbooks, shorts, and livestreams.',
};

export default async function EpisodesIndex() {
  const episodes = await getAllEpisodes();

  return (
    <Container as="section" className="py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Episodes</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Every episode from the channel, with full show notes, source materials,
        and outbound crosslinks to structured knowledge entries in The Large
        Language Library.
      </p>
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {episodes.map((episode) => (
          <li key={episode.id}>
            <Link
              href={`/episodes/${episode.slug}`}
              className="block rounded-lg border border-mist p-6 hover:border-accent"
            >
              <p className="text-xs uppercase tracking-wide text-muted">
                {CONTENT_TIER_LABELS[episode.tier]}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold">
                {episode.title}
              </h2>
              <p className="mt-3 text-sm text-muted">{episode.summary}</p>
              <p className="mt-4 text-xs text-accent">
                Pillar: {CONTENT_PILLAR_QUESTIONS[episode.pillar]}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
```

**NEW** `src/app/episodes/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { LllCrosslinks } from '@/components/crosslinks/LllCrosslinks';
import { getAllEpisodes, getEpisodeBySlug } from '@/lib/content/episodes';
import { CONTENT_PILLAR_QUESTIONS, CONTENT_TIER_LABELS } from '@/content/schemas';

export const dynamicParams = false;

export async function generateStaticParams() {
  const episodes = await getAllEpisodes();
  return episodes.map((episode) => ({ slug: episode.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEpisodeBySlug(slug);
  if (!entry) return {};
  return {
    title: entry.meta.title,
    description: entry.meta.summary,
  };
}

export default async function EpisodeDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getEpisodeBySlug(slug);
  if (!entry) notFound();

  const { meta, Component } = entry;

  return (
    <Container as="article" className="py-16">
      <p className="text-xs uppercase tracking-wide text-muted">
        {CONTENT_TIER_LABELS[meta.tier]} · {meta.series}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
        {meta.title}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{meta.summary}</p>
      <p className="mt-4 text-sm text-accent">
        {CONTENT_PILLAR_QUESTIONS[meta.pillar]}
      </p>

      {meta.youtubeUrl && (
        <div className="mt-8">
          <Link
            href={meta.youtubeUrl}
            className="inline-block rounded-md bg-accent px-5 py-3 text-sm font-medium text-parchment hover:opacity-90"
          >
            Watch on YouTube
          </Link>
        </div>
      )}

      <div className="mt-12 prose-style">
        <Component />
      </div>

      {meta.sourceMaterialIds.length > 0 && (
        <section className="mt-12 rounded-lg border border-mist p-6">
          <h2 className="font-display text-xl font-semibold">Source materials</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {meta.sourceMaterialIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Full source-material rendering ships in a future update.
          </p>
        </section>
      )}

      {meta.lllEntryUrls.length > 0 && (
        <LllCrosslinks urls={meta.lllEntryUrls} className="mt-12" />
      )}

      <section className="mt-16 border-t border-mist pt-12">
        <p className="text-sm uppercase tracking-wide text-muted">Stay in the loop</p>
        <h2 className="mt-3 font-display text-2xl font-semibold">
          New episodes, no spam.
        </h2>
        <div className="mt-6 max-w-md">
          <EmailCapture source={`episode-${meta.slug}`} />
        </div>
      </section>
    </Container>
  );
}
```

### Design Decisions

- **Tier + pillar visible on the index card** — the four content pillars are a core brand concept ("the four questions") and surfacing them on the index is free SEO + brand reinforcement.
- **Grid of 1 / 2 columns** — no 3-column breakpoint. With relatively low episode counts expected at launch, density beyond 2 cards wide starts to look thin.
- **No pagination** — v1 of the site has low episode count. Pagination can be added when the archive crosses ~30 entries.
- **No client-side filtering** — filtering by tier/pillar is a future polish task. Keep Phase 3 static.
- **`dynamicParams = false`** — unknown slugs 404 at build time, which is correct for a static content site. New episodes ship via `git push` + rebuild.
- **`params: Promise<{...}>`** — Next.js 16 params are async; `await` is required.
- **Source materials list is a placeholder** — full rendering requires a SourceMaterial loader that's out of scope for this job. We show the IDs so the field is visible and the plumbing exists; a future job replaces the stub with real renders.
- **Contextual email capture at the bottom** — `source={'episode-${meta.slug}'}` gives the future email-funnel job per-episode attribution without extra infrastructure.
- **Primary YouTube CTA uses accent color** — the implementation doc explicitly says "Drive bidirectional traffic between YouTube and the site." The YouTube button earns the accent slot; secondary links use the muted text treatment.
- **No transcript rendering** — `transcriptPath` is in the schema but rendering transcripts is its own concern. Skip for Phase 3.

### Files

| Action | File                                      |
|--------|-------------------------------------------|
| NEW    | `src/app/episodes/page.tsx`              |
| NEW    | `src/app/episodes/[slug]/page.tsx`        |

---

## Feature 3.3: Cases (Index + Detail) [x]

**Complexity: L** — Cases index grid plus the detail page with metadata header,
MDX body, deliverables list, LLL crosslinks, and related episodes list.

### Problem

Cases are the proof layer behind the channel. Visitors need a list view (index),
and the detail page renders: overview, problem, deliverables, outcome, MDX body,
related episodes, and LLL crosslinks. The placeholder Party Masters case from
Phase 2.2 needs somewhere to live.

### Implementation

**NEW** `src/app/cases/page.tsx`:

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { getAllCases } from '@/lib/content/cases';
import { CASE_STATUS_LABELS } from '@/content/schemas';

export const metadata: Metadata = {
  title: 'Case Studies',
  description:
    'Full documented project histories of Travis Gautier client work — the proof layer behind the channel narrative.',
};

export default async function CasesIndex() {
  const cases = await getAllCases();

  return (
    <Container as="section" className="py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Case Studies</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Real projects, real clients, real outcomes. The structured technical
        entries that came out of each build live in The Large Language Library
        — case studies link out directly.
      </p>
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {cases.map((caseStudy) => (
          <li key={caseStudy.id}>
            <Link
              href={`/cases/${caseStudy.slug}`}
              className="block rounded-lg border border-mist p-6 hover:border-accent"
            >
              <p className="text-xs uppercase tracking-wide text-muted">
                {CASE_STATUS_LABELS[caseStudy.status]}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold">
                {caseStudy.title}
              </h2>
              <p className="mt-3 text-sm text-muted">{caseStudy.summary}</p>
              <p className="mt-4 text-xs text-accent">{caseStudy.client}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
```

**NEW** `src/app/cases/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { LllCrosslinks } from '@/components/crosslinks/LllCrosslinks';
import { getAllCases, getCaseBySlug } from '@/lib/content/cases';
import { getAllEpisodes } from '@/lib/content/episodes';
import { CASE_STATUS_LABELS } from '@/content/schemas';

export const dynamicParams = false;

export async function generateStaticParams() {
  const cases = await getAllCases();
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getCaseBySlug(slug);
  if (!entry) return {};
  return {
    title: entry.meta.title,
    description: entry.meta.summary,
  };
}

export default async function CaseDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getCaseBySlug(slug);
  if (!entry) notFound();

  const { meta, Component } = entry;
  const allEpisodes = await getAllEpisodes();
  const relatedEpisodes = allEpisodes.filter((ep) =>
    meta.relatedEpisodeIds.includes(ep.id),
  );

  return (
    <Container as="article" className="py-16">
      <p className="text-xs uppercase tracking-wide text-muted">
        {CASE_STATUS_LABELS[meta.status]} · {meta.client}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
        {meta.title}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{meta.summary}</p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">The problem</h2>
        <p className="mt-3 text-muted">{meta.problem}</p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Deliverables</h2>
        <ul className="mt-3 list-disc pl-6 space-y-1 text-muted">
          {meta.deliverables.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Outcome</h2>
        <p className="mt-3 text-muted">{meta.outcome}</p>
      </section>

      <div className="mt-12 prose-style">
        <Component />
      </div>

      {relatedEpisodes.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Episodes</h2>
          <ul className="mt-4 space-y-3">
            {relatedEpisodes.map((ep) => (
              <li key={ep.id}>
                <Link
                  href={`/episodes/${ep.slug}`}
                  className="text-link hover:underline underline-offset-2"
                >
                  {ep.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {meta.lllEntryUrls.length > 0 && (
        <LllCrosslinks urls={meta.lllEntryUrls} className="mt-12" />
      )}

      <section className="mt-16 border-t border-mist pt-12">
        <div className="max-w-md">
          <EmailCapture source={`case-${meta.slug}`} />
        </div>
      </section>
    </Container>
  );
}
```

### Design Decisions

- **Status label surfaced on the index card** — "Active" vs "Shipped" vs "Archived" gives visitors instant context about whether a case is complete.
- **Identical layout shape to episodes index** — consistency across the two content types reduces visual noise and implementation cost.
- **Structured sections before MDX body** — `problem`, `deliverables`, and `outcome` are on the type, so they render deterministically from metadata. The MDX body carries the long narrative (market research, discovery, technical decisions, lessons learned).
- **Related episodes resolved server-side** — `getAllEpisodes()` is cached after first call, so the lookup is cheap. Cross-referencing cases and episodes on detail pages gives visitors a clear path from case study to episode video.
- **Contextual email capture with `source={'case-${slug}'}`** — mirrors the episode detail page for consistent attribution.

### Files

| Action | File                                  |
|--------|---------------------------------------|
| NEW    | `src/app/cases/page.tsx`             |
| NEW    | `src/app/cases/[slug]/page.tsx`       |

---

## Feature 3.4: `/about` Page [x]

**Complexity: S** — Static prose page. Brand story + LLL relationship.

### Problem

The `/about` page is the explicit home for the LLL relationship. Per the
implementation doc: "acknowledged openly, not loud. The DHH/Rails to Basecamp
framing." It's also where the Travis Gautier premise gets its definitive statement.

### Implementation

**NEW** `src/app/about/page.tsx`:

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The Travis Gautier premise, the channel, and the sister project — The Large Language Library.',
};

export default function About() {
  return (
    <Container as="article" className="py-16 max-w-3xl">
      <h1 className="font-display text-4xl font-semibold tracking-tight">About</h1>
      <section className="mt-8 space-y-6 text-lg leading-relaxed">
        <p>
          Travis Gautier is the documented real-world answer to a question every
          technical freelancer is asking: what can a single person actually
          ship when they manage a team of AI agents the way a senior tech lead
          manages a dev team?
        </p>
        <p>
          The channel is the answer in progress. Real clients. Real deliverables.
          Real case studies — end to end, not demos. The site you&apos;re reading
          is itself part of the exhibit: it was built and is maintained by the
          same agent workflow being documented on the channel.
        </p>
      </section>

      <section className="mt-16 rounded-lg border border-mist p-8">
        <h2 className="font-display text-2xl font-semibold">The Large Language Library</h2>
        <p className="mt-4 leading-relaxed">
          Travis Gautier built and champions{' '}
          <Link
            href="https://largelanguagelibrary.ai"
            className="text-link underline-offset-2 hover:underline"
          >
            The Large Language Library
          </Link>
          , the open, AI-optimized knowledge base of solved technical problems
          that comes out of every client engagement. Travis Gautier is the brand;
          LLL is the infrastructure. The tool is bigger than the brand that
          built it — that&apos;s intentional.
        </p>
      </section>
    </Container>
  );
}
```

### Design Decisions

- **Two sections only** — the premise, and the LLL callout. Nothing else on this page earns its space yet.
- **LLL section in a bordered card** — visually distinct from the prose but not the primary element. Matches the brand doc's "acknowledged, not loud".
- **No team section, no credentials section** — Travis Gautier is explicitly a "one person + agents" story. A staff list would contradict the brand.

### Files

| Action | File                          |
|--------|-------------------------------|
| NEW    | `src/app/about/page.tsx`      |

---

## Phase 3 Exit Criteria

- `npm run dev` serves `/`, `/episodes`, `/episodes/pilot-party-masters-discovery`, `/cases`, `/cases/party-masters`, `/about`
- Every new route is navigable from the Header nav and renders inside the site shell
- `generateStaticParams` produces `pilot-party-masters-discovery` and `party-masters` at build time; unknown slugs 404
- Episode and case detail pages render their MDX bodies via `mdx-components.tsx`
- Homepage displays the seed episode as "Latest episode"
- Case detail page shows a resolved related-episode link
- `EmailCapture` and `LllCrosslinks` imports resolve to stubs until Phase 4 lands (placeholder components are fine; they get their real implementations in Phase 4)
- `npm run build` clean, `npm run lint` clean, `npm test` green

> **Note on the forward reference to Phase 4 components**: `EmailCapture` and
> `LllCrosslinks` are imported by Phase 3 pages but formally delivered in
> Feature 4.1. The section order was chosen for parallelism. If the
> TDD pipeline runs Phase 3 before Phase 4, those two components must exist as
> minimal stubs (a plain form and an empty crosslink list) at the end of
> Phase 3 so `npm run build` passes — the real implementations replace the
> stubs in Phase 4.
