# Phase 1: Catalog

**Total Size: S + M + M** (3 sections after condense: old 1.1+1.2 → new 1.1, old 1.3 → new 1.2, old 1.4+1.5 → new 1.3)
**Prerequisites: `website-foundation` has shipped through all four phases. `zod` installed (wf 1.2). MDX pipeline wired (wf 2.1). Content loader core exists (wf 2.2). Design tokens + `<Container>` + `<Header>`/`<Footer>` in place (wf 1.3/1.4). `storefront-auth` Phase 1 shipped (so the `Product` schema shape is available as a reference; the cohort schema follows the same idiom).**
**New Types: `Cohort` (plus `COHORT_STATUSES` tuple, `COHORT_STATUS_LABELS` map, `CohortSchema` Zod validator)**
**New Files: `src/content/schemas/cohort.ts`, `src/content/cohorts/{ai-delivery-2026-q3,workflow-mastery-2026-q4}.mdx`, `src/lib/content/cohorts.ts`, `src/app/cohorts/page.tsx`, `src/app/cohorts/[slug]/page.tsx`, `src/components/cohorts/{CohortCard,CohortStatusBadge,CohortDetailHero}.tsx`, plus tests**

Phase 1 delivers the **public** half of the cohort surface: the `Cohort`
content type, its validator, the loader, two seed MDX files, and the
catalog routes. No forms, no persistence, no emails, no payments — the
waitlist + apply CTAs on the detail page render as visually-disabled
placeholders until Phases 2 and 3 wire them up. This phase is shippable on
its own: even if Phases 2–4 slip, travisgautier.com gets a browsable cohort
catalog that indexes well in Google and links out to "coming soon" states.

---

## Feature 1.1: `Cohort` Schema + `CohortSchema` Zod Validator

**Complexity: S** — Merged from old 1.1 + 1.2. Content type module mirroring
`Product` (sa 1.1) PLUS the runtime Zod validator that enforces shape at
MDX load time. Merged because the validator imports the `Cohort` type +
`COHORT_STATUSES` tuple directly; neither is meaningfully testable without
the other. Two sub-parts below: **#### Cohort Type** (old 1.1) and
**#### Zod Validator** (old 1.2).

#### Cohort Type

### Problem

`docs/future-jobs.md` §7 lists the schema fields explicitly: "title, start
date, capacity, price, status: announced / open / full / closed / shipped".
There is no `Cohort` type yet. Every downstream feature — the validator,
the loader, the catalog pages, the waitlist form, the apply page, the
admin dashboard, the checkout helper, the webhook branch — needs this
type first.

### Implementation

Follow the schema file pattern from `src/content/schemas/product.ts`
(sa 1.1): `as const` tuples for enumerated values, derived union types,
label maps, and the record interface.

**NEW** `src/content/schemas/cohort.ts`:

```ts
import type { ContentPillar } from './content-pillar';

export const COHORT_STATUSES = [
  'announced',
  'open',
  'closed',
  'enrolled',
  'shipped',
] as const;

export type CohortStatus = (typeof COHORT_STATUSES)[number];

export const COHORT_STATUS_LABELS: Record<CohortStatus, string> = {
  announced: 'Announced',
  open: 'Applications open',
  closed: 'Applications closed',
  enrolled: 'Cohort full',
  shipped: 'Shipped',
};

/**
 * Short copy shown under the status badge on the detail page.
 * Drives the CTA state machine — applicants see different text for each
 * status without the page having to branch on enum values inline.
 */
export const COHORT_STATUS_DESCRIPTIONS: Record<CohortStatus, string> = {
  announced:
    'Applications open soon. Join the waitlist to be notified when they do.',
  open: 'Applications open now. Review the syllabus and apply below.',
  closed:
    'Applications are closed. Decisions go out within two weeks of the deadline.',
  enrolled:
    'This cohort is full. Future cohorts will open for applications later — join the waitlist to be notified.',
  shipped:
    'This cohort has shipped. Read the outcomes below and watch for future cohorts.',
};

export interface Cohort {
  id: string;
  slug: string;
  title: string;
  /** Series name shared across repeatable cohorts (e.g. "AI Delivery Cohort"). */
  series: string;
  /** Human-readable tagline rendered under the title in the hero. */
  tagline: string;
  /** Longer marketing summary rendered above the description MDX body. */
  summary: string;
  status: CohortStatus;
  pillar: ContentPillar;
  /** ISO-8601 date (no time component). Used to sort the index + label the detail page. */
  startDate: string;
  /** ISO-8601 date. */
  endDate: string;
  /** Duration in weeks — derived-friendly label for the detail hero. */
  durationWeeks: number;
  /** Maximum number of students accepted for this cohort run. */
  capacity: number;
  /** Price in the smallest currency unit (cents for USD). */
  priceCents: number;
  /** ISO 4217 currency code, lowercase per Stripe convention. */
  currency: string;
  /** Stripe `price_xxx` ID. Operator provisions in Stripe dashboard and pastes here. */
  stripePriceId: string;
  /** Weekly commitment hours, shown on the marketing page. */
  commitmentHoursPerWeek: number;
  /** Outbound links to related LLL entries (same convention as Episode/Case/Product). */
  lllEntryUrls: string[];
  /** IDs of episodes this cohort is rooted in, used for reverse crosslinks. */
  relatedEpisodeIds: string[];
  /** IDs of case studies this cohort is rooted in. */
  relatedCaseIds: string[];
  publishedAt: string;
}
```

**MODIFY** `src/content/schemas/index.ts` — add the barrel export:

```ts
export * from './content-tier';
export * from './content-pillar';
export * from './episode';
export * from './source-material';
export * from './case';
export * from './product';
export * from './cohort';
export * from './cohort-application';
export * from './validators';
```

(Note: `cohort-application` is added in Phase 3.1. The barrel export line is
added here as a single MODIFY to avoid touching the file twice.)

### Design Decisions

- **`COHORT_STATUSES = ['announced','open','closed','enrolled','shipped']`** —
  `docs/future-jobs.md` §7 lists `announced / open / full / closed / shipped`.
  `'full'` is dropped and replaced with `'enrolled'` because the detail page
  already derives `isFull = enrolledCount >= capacity` at render time, and a
  manual `'full'` state duplicates that derivation while losing the
  distinction between "this run sold out" and "this run happened and we're
  archiving it". `'enrolled'` names the manual lock the operator flips when
  applications close and the roster is frozen; `'shipped'` names the
  post-completion archive state.
- **`priceCents: number` + `currency: string`** — matches Stripe's line-item
  convention (`unit_amount` in minor units, `currency` lowercase ISO 4217).
  Avoids floating-point price arithmetic. Frontend formats via
  `Intl.NumberFormat`.
- **`stripePriceId` on the cohort record, not a mapping file** — same
  rationale as sa's `Product.stripePriceId`. The MDX frontmatter is the
  source of truth for which Stripe Price drives this cohort. Phase 4.3's
  `createCohortCheckoutSession` helper reads it directly from the loaded
  `Cohort` record.
- **`capacity` is a number, enforced in UI not DB** — a cohort's capacity
  can change between runs (e.g., operator decides to take 20 instead of 15);
  editing the MDX + redeploying is the intended workflow. Trying to put a
  hard capacity cap at the DB level would fight the content-as-source-of-truth
  principle.
- **`durationWeeks` as a stored field, not derived** — `(endDate - startDate)`
  could compute it, but date math on ISO strings is fragile and error-prone.
  Storing the number means the operator's intent is explicit (e.g., a "6-week
  program over 8 calendar weeks with a break" stores `durationWeeks: 6`).
- **`series` field** — cohorts will be repeatable (e.g., "AI Delivery
  Cohort" runs every quarter). The series name lets the index group runs
  even when each cohort has a distinct slug.
- **`pillar: ContentPillar`** — cohorts inherit the four-pillars vocabulary
  from wf (`delivery | workflow | business | future`). Applicants self-select
  their pillar interest on the form, and the admin dashboard can filter by
  pillar alignment.
- **No `status: 'draft'`** — if a cohort isn't ready, don't commit the MDX
  file. Every file in `src/content/cohorts/` is implicitly live.
- **`publishedAt` required** — enables `generateStaticParams` filtering and
  stable sort order on the index page.

### Files — Cohort Type

| Action | File                             |
|--------|----------------------------------|
| NEW    | `src/content/schemas/cohort.ts`  |
| MODIFY | `src/content/schemas/index.ts`   |

---

#### Zod Validator

(Merged from old Feature 1.2 — size S. Zod schema mirroring `Cohort` at
runtime, with unit tests appended to the existing
`schemas/__tests__/validators.test.ts` that wf 1.2 established.)

### Problem — Zod Validator

Seed cohorts come from MDX files authored by humans (or agents) who will
typo fields, forget required ones, or paste a placeholder `stripePriceId`
and forget to replace it before shipping. Without runtime validation, the
first sign of trouble is a cryptic render error deep in a server component
or — worse — a live Apply button that creates a Checkout Session against
the wrong price. The loader needs a validator at the content boundary so
bad content fails loudly and immediately with an actionable error message.

### Implementation — Zod Validator

Append `CohortSchema` to the existing `validators.ts` file from wf 1.2,
following the same pattern as `CaseSchema` / `ProductSchema`.

**MODIFY** `src/content/schemas/validators.ts` — append:

```ts
import { z } from 'zod';
import { COHORT_STATUSES, type Cohort } from './cohort';
import { CONTENT_PILLARS } from './content-pillar';

export const CohortSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  title: z.string().min(1).max(200),
  series: z.string().min(1).max(120),
  tagline: z.string().min(1).max(200),
  summary: z.string().min(20).max(800),
  status: z.enum(COHORT_STATUSES),
  pillar: z.enum(CONTENT_PILLARS),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  durationWeeks: z.number().int().min(1).max(52),
  capacity: z.number().int().min(1).max(500),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).regex(/^[a-z]+$/, 'currency must be lowercase ISO 4217'),
  stripePriceId: z
    .string()
    .regex(
      /^(price_[A-Za-z0-9]+|price_REPLACE_ME_[A-Za-z0-9_-]+)$/,
      'stripePriceId must look like price_xxx (or the placeholder price_REPLACE_ME_...)',
    ),
  commitmentHoursPerWeek: z.number().int().min(1).max(60),
  lllEntryUrls: z.array(z.string().url()).default([]),
  relatedEpisodeIds: z.array(z.string()).default([]),
  relatedCaseIds: z.array(z.string()).default([]),
  publishedAt: z.string().datetime(),
}) satisfies z.ZodType<Cohort>;

export type CohortInput = z.input<typeof CohortSchema>;
```

### Tests — Zod Validator (part of `cohort-enrollment-1.1` red phase)

**MODIFY** `src/content/schemas/__tests__/validators.test.ts` — append:

- A valid minimal `Cohort` object (every required field) passes validation
  and the parsed value is strictly-typed as `Cohort`.
- Missing `stripePriceId` → error mentioning `stripePriceId`.
- `startDate` in non-`YYYY-MM-DD` shape → error mentioning `startDate`.
- `currency` in uppercase (`'USD'`) → error mentioning lowercase.
- `durationWeeks = 0` → error (min 1).
- `durationWeeks = 60` → error (max 52).
- `capacity = 0` → error (min 1).
- `pillar = 'marketing'` → error (not in `CONTENT_PILLARS`).
- `status = 'full'` → error (not in `COHORT_STATUSES`; `'full'` was
  intentionally dropped in favour of derived + `'enrolled'`).
- `stripePriceId = 'price_REPLACE_ME_ai-delivery-2026-q3'` → PASSES (the
  placeholder regex is allowed at the validator level; the checkout helper
  is the one that rejects placeholders at call time, same as sa's
  `resolveStripePriceId`).
- `summary` of 5 characters → error (min 20).
- `lllEntryUrls` defaults to `[]` when omitted.
- Round-trip: `CohortSchema.parse(raw)` → object matches `raw` with
  defaults applied.

### Design Decisions — Zod Validator

- **Placeholder `stripePriceId` passes validation** — same rule as sa:
  content-time validation catches shape, checkout-time validation catches
  semantics. The placeholder regex means the seed files ship without an
  immediate runtime error, and Phase 4.3's `createCohortCheckoutSession`
  throws a clear "this cohort has a placeholder price" error at the moment
  an admin tries to create a checkout session.
- **`startDate` + `endDate` as regex-validated strings, not `z.date()`** —
  MDX frontmatter is parsed as JS literals at import time; `new Date('2026-09-15')`
  produces a `Date` object, but we keep the ISO string format end-to-end
  (same as Episode's `publishedAt`) because it round-trips through JSON and
  is trivially sortable lexicographically for `YYYY-MM-DD` values.
- **`summary` min 20 / max 800** — matches `CaseSchema.summary` so the
  index card component from 1.4 can share copy-length assumptions.
- **No `durationWeeks = endDate - startDate` invariant check** — the two
  fields can legitimately disagree (off-weeks, holidays), so cross-field
  validation would force operator pain with no safety benefit.
- **`satisfies z.ZodType<Cohort>`** — same structural-compatibility check
  sa uses. Compile-time guarantee that the Zod schema covers every field of
  the TypeScript interface.

### Files — Zod Validator

| Action | File                                                      |
|--------|-----------------------------------------------------------|
| MODIFY | `src/content/schemas/validators.ts`                       |
| MODIFY | `src/content/schemas/__tests__/validators.test.ts`        |

### Combined Files Summary — `cohort-enrollment-1.1`

| Action | File                                                      |
|--------|-----------------------------------------------------------|
| NEW    | `src/content/schemas/cohort.ts`                           |
| MODIFY | `src/content/schemas/index.ts`                            |
| MODIFY | `src/content/schemas/validators.ts`                       |
| MODIFY | `src/content/schemas/__tests__/validators.test.ts`        |

---

## Feature 1.2: Cohort Loader + Seed MDX

**(Renumbered from old 1.3 — content unchanged.)**

**Complexity: M** — Build the cohort loader on top of wf's `loadContent<T>()`
core and ship two seed MDX files covering the two primary status states
(`announced`, `open`) so downstream features can exercise both branches.

### Problem

Every Phase 1 page — index, detail — needs a server-side function that
reads `src/content/cohorts/*.mdx`, validates against `CohortSchema`, and
returns strictly-typed records. The loader also needs to expose
`getCohortBySlug()` for the detail page + checkout helper. Without the
loader there is no catalog, and without at least two seed MDX files there
is no way to exercise the `announced` vs `open` branches of the detail
page's CTA state machine.

### Implementation

Follow the loader pattern from `src/lib/content/episodes.ts` /
`src/lib/content/products.ts`: thin wrapper over `loadContent<Cohort>()`,
module-level cache, sorted by `startDate` ascending (so the next upcoming
cohort always appears first on the index).

**NEW** `src/lib/content/cohorts.ts`:

```ts
import { CohortSchema, type Cohort } from '@/content/schemas';
import { loadContent, type LoadedEntry } from './loader';

const COHORTS_DIRECTORY = 'src/content/cohorts';

let cache: Promise<LoadedEntry<Cohort>[]> | null = null;

function loadAll(): Promise<LoadedEntry<Cohort>[]> {
  if (!cache) {
    cache = loadContent<Cohort>({
      directory: COHORTS_DIRECTORY,
      schema: CohortSchema,
    }).then((entries) =>
      entries.slice().sort((a, b) => a.meta.startDate.localeCompare(b.meta.startDate)),
    );
  }
  return cache;
}

export async function getAllCohorts(): Promise<LoadedEntry<Cohort>[]> {
  return loadAll();
}

export async function getCohortBySlug(
  slug: string,
): Promise<LoadedEntry<Cohort> | null> {
  const all = await loadAll();
  return all.find((entry) => entry.meta.slug === slug) ?? null;
}

/**
 * Partition cohorts into the buckets the catalog page renders separately.
 * Callers can render upcoming and archived sections without re-filtering.
 */
export async function getCohortBuckets(): Promise<{
  upcoming: LoadedEntry<Cohort>[];
  archived: LoadedEntry<Cohort>[];
}> {
  const all = await loadAll();
  const upcoming = all.filter((entry) =>
    ['announced', 'open', 'closed'].includes(entry.meta.status),
  );
  const archived = all.filter((entry) =>
    ['enrolled', 'shipped'].includes(entry.meta.status),
  );
  return { upcoming, archived };
}
```

**NEW** `src/content/cohorts/ai-delivery-2026-q3.mdx`:

```mdx
export const meta = {
  id: 'cohort-ai-delivery-2026-q3',
  slug: 'ai-delivery-2026-q3',
  title: 'AI Delivery Cohort — Fall 2026',
  series: 'AI Delivery Cohort',
  tagline: 'Ship a real client project with an agent team in six weeks.',
  summary:
    'Six-week intensive for solo consultants and small agencies ready to run real client work with an agent-led delivery workflow. You bring a real project; we pair you with the tooling, rituals, and peer review to deliver it end-to-end.',
  status: 'announced',
  pillar: 'delivery',
  startDate: '2026-09-14',
  endDate: '2026-10-26',
  durationWeeks: 6,
  capacity: 20,
  priceCents: 299900,
  currency: 'usd',
  stripePriceId: 'price_REPLACE_ME_ai_delivery_2026_q3',
  commitmentHoursPerWeek: 10,
  lllEntryUrls: [],
  relatedEpisodeIds: [],
  relatedCaseIds: ['party-masters'],
  publishedAt: '2026-04-15T00:00:00Z',
} as const;

# AI Delivery Cohort — Fall 2026

Placeholder body copy. Real cohort description lands with the first real run.

## Who this is for

- Solo consultants running agency-scale client projects
- Small agencies curious about agent-led delivery
- Independent builders who want a structured accountability container

## Syllabus (placeholder)

1. Week 1 — Discovery mechanics
2. Week 2 — Scoping + estimation
3. Week 3 — Delivery cadence
4. Week 4 — Mid-project review
5. Week 5 — QA + handoff
6. Week 6 — Outcomes + retro
```

**NEW** `src/content/cohorts/workflow-mastery-2026-q4.mdx`:

```mdx
export const meta = {
  id: 'cohort-workflow-mastery-2026-q4',
  slug: 'workflow-mastery-2026-q4',
  title: 'Workflow Mastery Cohort — Winter 2026',
  series: 'Workflow Mastery Cohort',
  tagline: 'Rebuild your development workflow around an agent team.',
  summary:
    'Four-week program focused on the meta-workflow of AI-driven engineering: TDD pipelines, agent harnesses, code review loops, and the rituals that keep a small team shipping fast without drifting. Application-required.',
  status: 'open',
  pillar: 'workflow',
  startDate: '2026-11-02',
  endDate: '2026-11-30',
  durationWeeks: 4,
  capacity: 15,
  priceCents: 249900,
  currency: 'usd',
  stripePriceId: 'price_REPLACE_ME_workflow_mastery_2026_q4',
  commitmentHoursPerWeek: 8,
  lllEntryUrls: [],
  relatedEpisodeIds: [],
  relatedCaseIds: [],
  publishedAt: '2026-04-15T00:00:00Z',
} as const;

# Workflow Mastery Cohort — Winter 2026

Placeholder body copy. Real cohort description lands with the first real run.

## What you will build

- A reproducible TDD pipeline tuned to your stack
- An agent harness wired to your day-to-day editor
- A code-review + retro cadence that fits your team

## Schedule (placeholder)

Weekly 90-minute live session + asynchronous work + pair review.
```

### Tests (red phase of section `cohort-enrollment-1.2`)

**NEW** `src/lib/content/__tests__/cohorts.test.ts`:

- `getAllCohorts()` returns exactly 2 entries from the seed directory.
- Entries are sorted by `startDate` ascending (the `announced` Fall cohort
  appears before the `open` Winter cohort even though the Winter cohort was
  published later — start date sort dominates).
- Each entry passes `CohortSchema.parse` at load time.
- `getCohortBySlug('ai-delivery-2026-q3')` returns the `announced` cohort.
- `getCohortBySlug('workflow-mastery-2026-q4')` returns the `open` cohort.
- `getCohortBySlug('bogus')` returns `null`.
- `getCohortBuckets()` returns `upcoming` of length 2 (one `announced`,
  one `open`) and `archived` of length 0. After mutating the seed's status
  to `shipped` in a fixture test, the same function returns `upcoming` 1
  and `archived` 1.
- `loadContent` is called once per process (module-level cache) —
  verified by spying on the underlying core.

### Design Decisions

- **Module-level cache** — same pattern as `getAllEpisodes` / `getAllProducts`.
  Server components re-render frequently in dev; re-reading the filesystem
  per render would be wasteful. The cache is cleared on process restart, so
  content edits still apply in dev via Next.js's own HMR.
- **Sort by `startDate` ascending, NOT by `publishedAt` desc** — users
  browsing `/cohorts` want "when is the next cohort I can join" as the
  primary signal. Publication date is immaterial to an applicant.
- **`getCohortBuckets` partitions `upcoming` vs `archived`** — both the
  index page (1.4) and the account cohorts list (4.5) render these two
  groups separately. Centralizing the partition in the loader keeps both
  consumers in sync if the status-to-bucket mapping changes later.
- **`['enrolled', 'shipped']` is the "archived" bucket** — `enrolled`
  means "roster locked, can't join", which is identical from a catalog
  visitor's perspective to `shipped`. The detail page still renders
  distinct copy per status via `COHORT_STATUS_DESCRIPTIONS`.
- **Seed cohort #1 in `announced`, seed #2 in `open`** — exercises both
  states on the live catalog during Phase 1 manual verification. Phases 2
  and 3 respectively hydrate the waitlist form on the `announced` cohort
  and the apply form on the `open` cohort.
- **`stripePriceId: 'price_REPLACE_ME_...'`** — the validator regex
  permits the placeholder; Phase 4.3 checkout helper rejects it. This lets
  Phase 1 ship without a Stripe account provisioned.

### Files

| Action | File                                                |
|--------|-----------------------------------------------------|
| NEW    | `src/lib/content/cohorts.ts`                        |
| NEW    | `src/lib/content/__tests__/cohorts.test.ts`         |
| NEW    | `src/content/cohorts/ai-delivery-2026-q3.mdx`       |
| NEW    | `src/content/cohorts/workflow-mastery-2026-q4.mdx`  |

---

## Feature 1.3: `/cohorts` Index + `/cohorts/[slug]` Detail Pages

**Complexity: M** — Merged from old 1.4 + 1.5. Same-entity views (index +
detail) for the cohort content type. Mirrors the merged shipping pattern
of `wf-3.2` (Episodes Index + Detail, 43 tests) and `wf-3.3` (Cases Index
+ Detail, 40 tests) — both pages call the same loader, share
`<CohortCard>` / `<CohortStatusBadge>` / `<CohortDetailHero>` components,
and are co-designed. Two sub-parts below: **#### Index Page** (old 1.4)
and **#### Detail Page** (old 1.5).

#### Index Page

(Old Feature 1.4 — Complexity S on its own.) Server-rendered index page
listing upcoming + archived cohorts in two sections, each rendered via
`<CohortCard>`.

### Problem — Index Page

`/cohorts` is the landing point every outbound crosslink from episodes,
case studies, and the homepage will point at. It's also the SEO entry
point for anyone searching for "AI delivery cohort" or similar queries.
The page has to exist before the detail page can be cross-linked, and
before the nav link can land in Phase 4.6.

### Implementation — Index Page

**NEW** `src/app/cohorts/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { getCohortBuckets } from '@/lib/content/cohorts';
import { CohortCard } from '@/components/cohorts/CohortCard';

export const metadata: Metadata = {
  title: 'Cohorts',
  description:
    'Join a Travis Gautier cohort — intensive programs for solo consultants and small agencies running AI-driven delivery workflows.',
  openGraph: {
    title: 'Travis Gautier Cohorts',
    description:
      'Intensive programs for solo consultants and small agencies running AI-driven delivery workflows.',
  },
};

export default async function CohortsIndexPage() {
  const { upcoming, archived } = await getCohortBuckets();

  return (
    <Container as="main" className="py-16">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted">Cohorts</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Learn in a cohort
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Intensive, application-required programs that pair you with a peer
          cohort and an agent-led delivery workflow. Cohorts run quarterly on
          a rolling basis.
        </p>
      </header>

      <section className="mt-12" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="font-display text-2xl font-semibold">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-6 rounded-md border border-mist p-6 text-sm text-muted">
            No upcoming cohorts right now.{' '}
            <Link href="/#email-capture" className="text-link underline-offset-2 hover:underline">
              Join the newsletter
            </Link>{' '}
            to be notified when the next one opens.
          </p>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {upcoming.map((entry) => (
              <li key={entry.meta.id}>
                <CohortCard cohort={entry.meta} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 ? (
        <section className="mt-20" aria-labelledby="archived-heading">
          <h2 id="archived-heading" className="font-display text-2xl font-semibold">
            Past cohorts
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {archived.map((entry) => (
              <li key={entry.meta.id}>
                <CohortCard cohort={entry.meta} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
```

**NEW** `src/components/cohorts/CohortCard.tsx`:

```tsx
import Link from 'next/link';
import type { Cohort } from '@/content/schemas';
import { CohortStatusBadge } from './CohortStatusBadge';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface CohortCardProps {
  cohort: Cohort;
}

export function CohortCard({ cohort }: CohortCardProps) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-mist bg-parchment/40 p-6 transition hover:border-accent/60">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-muted">{cohort.series}</p>
        <CohortStatusBadge status={cohort.status} />
      </div>
      <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
        <Link href={`/cohorts/${cohort.slug}`} className="hover:text-accent">
          {cohort.title}
        </Link>
      </h3>
      <p className="mt-3 text-sm text-muted">{cohort.tagline}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted">
        <div>
          <dt className="uppercase tracking-wide">Starts</dt>
          <dd className="mt-1 font-medium text-foreground">{formatDate(cohort.startDate)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Duration</dt>
          <dd className="mt-1 font-medium text-foreground">{cohort.durationWeeks} weeks</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Seats</dt>
          <dd className="mt-1 font-medium text-foreground">{cohort.capacity}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Price</dt>
          <dd className="mt-1 font-medium text-foreground">{formatPrice(cohort.priceCents, cohort.currency)}</dd>
        </div>
      </dl>
    </article>
  );
}
```

**NEW** `src/components/cohorts/CohortStatusBadge.tsx`:

```tsx
import type { CohortStatus } from '@/content/schemas';
import { COHORT_STATUS_LABELS } from '@/content/schemas';

const STATUS_STYLES: Record<CohortStatus, string> = {
  announced: 'bg-signal/10 text-signal ring-signal/20',
  open: 'bg-accent/10 text-accent ring-accent/30',
  closed: 'bg-muted/10 text-muted ring-muted/30',
  enrolled: 'bg-steel/10 text-steel ring-steel/30',
  shipped: 'bg-ink/5 text-ink ring-ink/20',
};

interface CohortStatusBadgeProps {
  status: CohortStatus;
}

export function CohortStatusBadge({ status }: CohortStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {COHORT_STATUS_LABELS[status]}
    </span>
  );
}
```

### Tests — Index Page (part of `cohort-enrollment-1.3` red phase)

**NEW** `src/app/cohorts/__tests__/page.test.tsx`:

- Page renders `h1` "Learn in a cohort".
- Upcoming section renders 2 cards (from seed fixtures).
- Archived section does NOT render when all seeds are upcoming.
- Each card links to `/cohorts/{slug}`.
- Empty upcoming bucket renders the newsletter fallback message.
- `<CohortStatusBadge>` renders the correct label for each status
  (`announced` → "Announced", `open` → "Applications open", etc.).
- Metadata `title` is "Cohorts".

### Design Decisions — Index Page

- **Two-section layout (upcoming / past)** — matches the mental model of
  someone visiting the page: "what can I sign up for now" vs "what's
  happened before". `getCohortBuckets` centralizes the partition so the
  account cohorts view in Phase 4.5 uses the same grouping.
- **Empty upcoming fallback links to newsletter** — if no cohorts are
  currently scheduled, the page still offers a conversion path instead of
  dead-ending. The link anchors to the homepage's `#email-capture` section
  rather than pretending to have a cohort-specific waitlist with nothing to
  put on it.
- **`<CohortCard>` is server-rendered, not client** — no interactivity, no
  React state, nothing that would push it to a client component. Smaller
  bundle, faster TTFB.
- **Card grid is `sm:grid-cols-2`** — two-column on tablet+, single-column
  on mobile. Matches the product card layout from sa 1.4 for visual
  consistency across catalog pages.
- **Status-colored badge** — the five statuses each get a distinct visual
  treatment using the brand tokens (`signal`, `accent`, `muted`, `steel`,
  `ink`). Colors chosen so every state is still readable against
  `bg-parchment/40`; accessibility check is in Phase 4.6.

### Files — Index Page

| Action | File                                                 |
|--------|------------------------------------------------------|
| NEW    | `src/app/cohorts/page.tsx`                           |
| NEW    | `src/app/cohorts/__tests__/page.test.tsx`            |
| NEW    | `src/components/cohorts/CohortCard.tsx`              |
| NEW    | `src/components/cohorts/CohortStatusBadge.tsx`       |

---

#### Detail Page

(Old Feature 1.5 — Complexity M on its own.) Dynamic route with
`generateStaticParams`, `dynamicParams = false`, `generateMetadata`,
`Course` + `Offer` JSON-LD (added in Phase 4.6 but the placeholder block
lands here), and a status-driven CTA slot that Phases 2 and 3 hydrate
with the real waitlist / apply forms.

### Problem — Detail Page

Every cohort needs a detail page that renders the full description, the
logistics (dates, duration, price, commitment hours), and a context-aware
call to action whose behaviour depends on the cohort's status. A future
applicant landing on `/cohorts/workflow-mastery-2026-q4` needs to see
"Applications open — Apply now"; someone landing on `/cohorts/ai-delivery-2026-q3`
(currently `announced`) needs to see "Applications open soon — Join the
waitlist". The CTA component itself doesn't need to work yet — Phase 2
and Phase 3 fill in the forms — but the page has to render the right
empty slot for each state.

### Implementation — Detail Page

**NEW** `src/app/cohorts/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/site/Container';
import { getAllCohorts, getCohortBySlug } from '@/lib/content/cohorts';
import { CohortDetailHero } from '@/components/cohorts/CohortDetailHero';

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const all = await getAllCohorts();
  return all.map((entry) => ({ slug: entry.meta.slug }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getCohortBySlug(slug);
  if (!entry) return { title: 'Cohort not found' };
  return {
    title: entry.meta.title,
    description: entry.meta.summary,
    openGraph: {
      title: entry.meta.title,
      description: entry.meta.summary,
      type: 'website',
    },
  };
}

export default async function CohortDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  const entry = await getCohortBySlug(slug);
  if (!entry) notFound();

  const { meta, default: MdxBody } = entry;

  return (
    <Container as="main" className="py-16">
      <CohortDetailHero cohort={meta} />

      <article className="prose mt-16 max-w-2xl">
        <MdxBody />
      </article>

      <section className="mt-16" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="font-display text-2xl font-semibold">
          Next step
        </h2>
        {/* Phase 2.2 hydrates this slot with <WaitlistForm> for `announced`; */}
        {/* Phase 3 renders a link to /cohorts/[slug]/apply for `open`.       */}
        <div className="mt-6 rounded-md border border-mist p-6 text-sm text-muted">
          {meta.status === 'announced' ? (
            <p>
              Waitlist form coming online soon. This cohort's applications
              open in Phase 2 of the build.
            </p>
          ) : meta.status === 'open' ? (
            <p>
              Application form coming online in Phase 3. Signed-in applicants
              will fill out background, goals, and commitment here.
            </p>
          ) : meta.status === 'closed' ? (
            <p>Applications are closed. Decisions go out within two weeks.</p>
          ) : meta.status === 'enrolled' ? (
            <p>This cohort is full. Join the waitlist for the next run.</p>
          ) : (
            <p>This cohort has shipped.</p>
          )}
        </div>
      </section>
    </Container>
  );
}
```

**NEW** `src/components/cohorts/CohortDetailHero.tsx`:

```tsx
import type { Cohort } from '@/content/schemas';
import { COHORT_STATUS_DESCRIPTIONS } from '@/content/schemas';
import { CohortStatusBadge } from './CohortStatusBadge';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface CohortDetailHeroProps {
  cohort: Cohort;
}

export function CohortDetailHero({ cohort }: CohortDetailHeroProps) {
  return (
    <header className="border-b border-mist pb-12">
      <div className="flex items-center gap-4">
        <p className="text-sm uppercase tracking-wide text-muted">{cohort.series}</p>
        <CohortStatusBadge status={cohort.status} />
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
        {cohort.title}
      </h1>
      <p className="mt-5 max-w-3xl text-lg text-muted">{cohort.tagline}</p>
      <p className="mt-4 max-w-3xl text-sm text-muted">
        {COHORT_STATUS_DESCRIPTIONS[cohort.status]}
      </p>
      <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Starts</dt>
          <dd className="mt-1 font-semibold">{formatDate(cohort.startDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Ends</dt>
          <dd className="mt-1 font-semibold">{formatDate(cohort.endDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Duration</dt>
          <dd className="mt-1 font-semibold">
            {cohort.durationWeeks} weeks · {cohort.commitmentHoursPerWeek}h/wk
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Tuition</dt>
          <dd className="mt-1 font-semibold">
            {formatPrice(cohort.priceCents, cohort.currency)}
          </dd>
        </div>
      </dl>
    </header>
  );
}
```

### Tests — Detail Page (part of `cohort-enrollment-1.3` red phase)

**NEW** `src/app/cohorts/[slug]/__tests__/page.test.tsx`:

- `generateStaticParams` returns two params: `{ slug: 'ai-delivery-2026-q3' }` and `{ slug: 'workflow-mastery-2026-q4' }`.
- `generateMetadata({ params: 'ai-delivery-2026-q3' })` returns the cohort
  title + summary as metadata.
- `generateMetadata({ params: 'bogus' })` returns `{ title: 'Cohort not found' }`.
- Default export for a known slug renders the hero, the MDX body, and the
  "Next step" section with the placeholder CTA copy for the cohort's status.
- Status `announced` → placeholder CTA copy mentions "Waitlist form coming online".
- Status `open` → placeholder CTA copy mentions "Application form coming online".
- Default export for an unknown slug calls `notFound()` (asserted via mocked
  `next/navigation`).

### Design Decisions — Detail Page

- **`dynamicParams = false`** — every cohort is known at build time from
  the MDX directory. Unknown slugs 404 at build rather than attempting to
  server-render a missing record. Matches sa's product detail page.
- **CTA slot is a plain conditional on status, not a component** — the slot
  will be replaced in Phase 2.2 (with `<WaitlistForm>`) and Phase 3.2 (with
  a link into `/cohorts/[slug]/apply`). Putting it behind a component in
  Phase 1 would invite premature abstraction; the current inline branch is
  self-documenting and the next two phases MODIFY this file directly.
- **No JSON-LD yet** — the `Course` + `Offer` structured data ships in
  Phase 4.6's SEO sweep alongside sitemap/robots updates. Adding it here
  would split the SEO work across phases for no benefit.
- **`CohortDetailHero` as a reusable component** — Phase 4.5's
  `/products/account/cohorts` page reuses the same hero in a compressed form
  for the "you're applying to" banner; keeping it separate from the page
  avoids duplicating the dates/price formatting.
- **MDX body renders inside `.prose` container** — same class wf 3.3 used
  for episode detail pages, so cohort bodies inherit the same typographic
  treatment without reinventing it.
- **`new Date(``${iso}T00:00:00Z``)` for display formatting** — anchoring
  the parse to UTC prevents the "September 14 renders as September 13 in
  California" timezone bug that bit sa during discovery.

### Files — Detail Page

| Action | File                                                         |
|--------|--------------------------------------------------------------|
| NEW    | `src/app/cohorts/[slug]/page.tsx`                            |
| NEW    | `src/app/cohorts/[slug]/__tests__/page.test.tsx`             |
| NEW    | `src/components/cohorts/CohortDetailHero.tsx`                |

### Combined Files Summary — `cohort-enrollment-1.3`

| Action | File                                                         |
|--------|--------------------------------------------------------------|
| NEW    | `src/app/cohorts/page.tsx`                                   |
| NEW    | `src/app/cohorts/__tests__/page.test.tsx`                    |
| NEW    | `src/components/cohorts/CohortCard.tsx`                      |
| NEW    | `src/components/cohorts/CohortStatusBadge.tsx`               |
| NEW    | `src/app/cohorts/[slug]/page.tsx`                            |
| NEW    | `src/app/cohorts/[slug]/__tests__/page.test.tsx`             |
| NEW    | `src/components/cohorts/CohortDetailHero.tsx`                |
