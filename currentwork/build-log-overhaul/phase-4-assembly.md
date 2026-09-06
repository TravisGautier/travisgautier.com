# Phase 4: Page assembly + cleanup

**Total Size: M + S + S**
**Prerequisites:** All Phase 3 blocks shipped (`<Hero>`, `<PipelineExplainer>`, `<RecentActivity>`, `<LiveWorktreesPanel>`, `<KnowledgeDigest>`). Phase 2's enriched `<JobCard>` consumed by JobsAtAGlance.
**New Types:** None.
**New Files:** None — only existing files modified or deleted.

Phase 4 is the visible payoff. After this phase ships, `/build-log` is the
single consolidated page; `/build-log/status` redirects to it; the obsolete
`<JobsRollupTable>` is gone.

The three sections must run in this order: 4.1 first (everything composes
into the page), then 4.2 and 4.3 in parallel after 4.1 (the redirect target
exists only after 4.1 mounts the `id="current"` anchor in `<Hero>`, and
`<JobsRollupTable>`'s last caller is `/status` which 4.2 deletes).

---

## Feature 4.1: /build-log page rewrite

**Complexity: M** — Replace the existing index page with a single composed page mounting all Phase 3 blocks. Enrich the job-card composition with per-job `liveWorktreeCount` + `lastActivityIso`. Merge the JSON-LD from both old pages into one `CollectionPage` blob.

### Problem

The existing `/build-log` is a thin index that groups `JobCard`s by status and
links out to `/build-log/status` for live state. The user request is to
consolidate everything onto one page. 4.1 does exactly that — composes the
five Phase 3 blocks, computes the per-job enrichment data the new `<JobCard>`
needs, and emits a single merged JSON-LD blob covering both old descriptions.

### Implementation

**REWRITE** `src/app/build-log/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { JobCard } from '@/components/build-log/JobCard';
import { Hero } from '@/components/build-log/Hero';
import { PipelineExplainer } from '@/components/build-log/PipelineExplainer';
import { RecentActivity } from '@/components/build-log/RecentActivity';
import { LiveWorktreesPanel } from '@/components/build-log/LiveWorktreesPanel';
import { KnowledgeDigest } from '@/components/build-log/KnowledgeDigest';
import { getAllJobs } from '@/lib/build-log/jobs';
import {
  getSessionStatus,
  getKnowledgeFile,
  getJobsRollup,
} from '@/lib/build-log/pipeline-state';
import { getLiveWorktrees } from '@/lib/build-log/worktree-state';
import { deriveLiveStatus } from '@/lib/build-log/derive-live-status';
import { toEntry } from '@/lib/build-log/normalize';
import { resolveGithubRepoUrl } from '@/lib/build-log/repo-url';
import type { Job, JobRollupEntry } from '@/content/schemas';
import type { LiveWorktree } from '@/lib/build-log/worktree-state';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Build log',
  description:
    'A live, narrated view of the agent-driven build process behind travisgautier.com — current activity, every shipped section, every job plan, and the live worktrees the agents are working in.',
  openGraph: {
    title: 'Build log · travisgautier',
    description:
      'The agent-driven build process behind travisgautier.com, narrated for both technical and non-technical viewers.',
    type: 'website',
    url: '/build-log',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build log · travisgautier',
    description:
      'The agent-driven build process behind travisgautier.com, narrated for both technical and non-technical viewers.',
  },
  alternates: { canonical: '/build-log' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Build log',
  description:
    'A live, narrated view of the agent-driven build process behind travisgautier.com — current activity, every shipped section, every job plan, and the live worktrees the agents are working in.',
  url: 'https://travisgautier.com/build-log',
  isPartOf: {
    '@type': 'WebSite',
    name: 'travisgautier',
    url: 'https://travisgautier.com',
  },
};

export default async function BuildLogPage() {
  const nowIso = new Date().toISOString();

  const [jobs, rollup, session, knowledge, worktrees] = await Promise.all([
    getAllJobs(),
    getJobsRollup(),
    getSessionStatus(),
    getKnowledgeFile(),
    getLiveWorktrees(),
  ]);

  const completedSections = session?.completedSections ?? [];
  const liveStatus = deriveLiveStatus({
    session,
    worktrees,
    completedSections,
    nowIso,
  });

  const githubRepoUrl = resolveGithubRepoUrl();
  const enrichment = computeEnrichment(rollup, worktrees, completedSections);
  const groups = groupJobs(jobs, rollup, enrichment);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container as="main" className="py-12">
        <Hero
          liveStatus={liveStatus}
          session={session}
          worktrees={worktrees}
          rollup={rollup}
          nowIso={nowIso}
        />

        <PipelineExplainer />

        <section aria-labelledby="jobs-heading" className="mb-12">
          <h2 id="jobs-heading" className="text-2xl font-display mb-4">
            Jobs at a glance
          </h2>
          {groups.length === 0 ? (
            <p className="text-(--color-muted) italic">
              No jobs have been planned yet. Initializing…
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="mb-8">
                <header className="mb-4 border-b border-bone pb-2 flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-display">{g.heading}</h3>
                  <span className="text-xs text-(--color-muted) tabular-nums">
                    {g.items.length} {g.items.length === 1 ? 'job' : 'jobs'}
                  </span>
                </header>
                <p className="text-sm text-(--color-muted) mb-4">{g.blurb}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {g.items.map(({ job, rollup, excerpt, liveWorktreeCount, lastActivityIso }) => (
                    <JobCard
                      key={job.slug}
                      rollup={rollup}
                      excerpt={excerpt}
                      liveWorktreeCount={liveWorktreeCount}
                      lastActivityIso={lastActivityIso}
                      nowIso={nowIso}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <RecentActivity
          entries={completedSections}
          rollup={rollup}
          nowIso={nowIso}
          githubRepoUrl={githubRepoUrl}
        />

        <LiveWorktreesPanel
          worktrees={worktrees}
          session={session}
          nowIso={nowIso}
        />

        <KnowledgeDigest knowledge={knowledge} />

        <footer className="mt-12 pt-6 border-t border-bone text-xs text-(--color-muted)">
          Rebuilt at <time dateTime={nowIso}>{nowIso}</time>. Raw chronology:{' '}
          <a
            href="https://github.com/travisgautier/travisgautier/blob/main/pipeline/IMPLEMENTATION-LOG.md"
            className="text-link hover:text-(--color-oxblood)"
          >
            IMPLEMENTATION-LOG.md
          </a>
          .
        </footer>
      </Container>
    </>
  );
}

interface JobEnrichment {
  liveWorktreeCount: number;
  lastActivityIso: string | null;
}

function computeEnrichment(
  rollup: readonly JobRollupEntry[],
  worktrees: readonly LiveWorktree[],
  completedSections: readonly unknown[],
): Map<string, JobEnrichment> {
  const out = new Map<string, JobEnrichment>();
  for (const job of rollup) {
    const liveWorktreeCount = worktrees.filter((w) =>
      w.sectionId.startsWith(`${job.slug}-`),
    ).length;

    let lastActivityIso: string | null = null;
    for (const raw of completedSections) {
      const e = toEntry(raw as never);
      if (e.kind !== 'detailed' || !e.completedAt) continue;
      if (!e.id.startsWith(`${job.slug}-`)) continue;
      if (!lastActivityIso || e.completedAt > lastActivityIso) {
        lastActivityIso = e.completedAt;
      }
    }
    out.set(job.slug, { liveWorktreeCount, lastActivityIso });
  }
  return out;
}

interface JobWithEnrichment {
  job: Job;
  rollup: JobRollupEntry;
  excerpt: string;
  liveWorktreeCount: number;
  lastActivityIso: string | null;
}

interface JobGroup {
  id: string;
  heading: string;
  blurb: string;
  items: JobWithEnrichment[];
}

function groupJobs(
  jobs: readonly Job[],
  rollup: readonly JobRollupEntry[],
  enrichment: Map<string, JobEnrichment>,
): JobGroup[] {
  const rollupBySlug = new Map(rollup.map((r) => [r.slug, r]));
  const withEnrichment: JobWithEnrichment[] = jobs
    .map((job) => {
      const r = rollupBySlug.get(job.slug);
      if (!r) return null;
      const enr = enrichment.get(job.slug) ?? { liveWorktreeCount: 0, lastActivityIso: null };
      return {
        job,
        rollup: r,
        excerpt: firstParagraph(job.context),
        liveWorktreeCount: enr.liveWorktreeCount,
        lastActivityIso: enr.lastActivityIso,
      };
    })
    .filter((x): x is JobWithEnrichment => x !== null);

  return [
    {
      id: 'in-progress',
      heading: 'In progress',
      blurb: 'Jobs the TDD pipeline is actively shipping features for.',
      items: withEnrichment.filter((x) => x.rollup.status === 'in-progress'),
    },
    {
      id: 'planned',
      heading: 'Planned',
      blurb: 'Jobs with a plan but no shipped features yet.',
      items: withEnrichment.filter(
        (x) => x.rollup.status === 'planned' || x.rollup.status === 'unknown',
      ),
    },
    {
      id: 'complete',
      heading: 'Complete',
      blurb: 'Jobs whose features have all shipped to main.',
      items: withEnrichment.filter((x) => x.rollup.status === 'complete'),
    },
  ].filter((g) => g.items.length > 0);
}

function firstParagraph(context: string): string {
  const para = context.split(/\n\s*\n/)[0] ?? '';
  return para.replace(/\s+/g, ' ').trim();
}
```

**NEW** `src/lib/build-log/repo-url.ts` — small helper that reads
`package.json`'s `repository.url` and normalizes the GitHub web URL. (One file
under 30 lines; not split into its own pipeline section.)

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot } from './repo-root';

let cached: string | null | undefined;

/**
 * Reads package.json's repository.url and returns the GitHub web URL
 * (e.g. https://github.com/org/repo) or null if unavailable. Cached.
 */
export function resolveGithubRepoUrl(): string | undefined {
  if (cached !== undefined) return cached ?? undefined;
  try {
    const pkgPath = join(getRepoRoot(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      repository?: string | { url?: string };
    };
    const raw = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    if (!raw) {
      cached = null;
      return undefined;
    }
    const normalized = raw
      .replace(/^git\+/, '')
      .replace(/\.git$/, '')
      .replace(/^git@github\.com:/, 'https://github.com/');
    if (!normalized.startsWith('https://github.com/')) {
      cached = null;
      return undefined;
    }
    cached = normalized;
    return normalized;
  } catch {
    cached = null;
    return undefined;
  }
}
```

**MODIFY** `src/app/build-log/__tests__/page.test.tsx` — extend coverage:

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BuildLogPage from '../page';

vi.mock('@/lib/build-log/jobs');
vi.mock('@/lib/build-log/pipeline-state');
vi.mock('@/lib/build-log/worktree-state');
vi.mock('@/lib/build-log/repo-url', () => ({
  resolveGithubRepoUrl: () => 'https://github.com/travisgautier/travisgautier',
}));

describe('BuildLogPage', () => {
  it('renders Hero with id="current"', async () => {
    // ... setup mock loaders returning a populated session
    const Page = await BuildLogPage();
    const { container } = render(Page);
    expect(container.querySelector('#current')).toBeInTheDocument();
  });

  it('renders PipelineExplainer with id="whatisthis"', async () => { /* ... */ });
  it('renders Jobs at a glance header', async () => { /* ... */ });
  it('renders Recent activity feed', async () => { /* ... */ });
  it('hides LiveWorktreesPanel when empty', async () => { /* ... */ });
  it('hides KnowledgeDigest when knowledge.yaml is empty', async () => { /* ... */ });
  it('emits a single CollectionPage JSON-LD <script>', async () => { /* ... */ });
  it('renders the IMPLEMENTATION-LOG.md footer link', async () => { /* ... */ });
});
```

### Design Decisions

- **One `Promise.all` for all five loaders.** Same pattern the old status page
  used; minimizes wall-clock during render.
- **`nowIso` computed once at the top.** Every component receives the same
  reference; relative timestamps render consistently.
- **`computeEnrichment` is page-local.** The function joins `rollup` ×
  `worktrees` × `completedSections` to compute per-job `liveWorktreeCount` and
  `lastActivityIso`. It's a small page-internal helper; doesn't deserve its own
  lib module.
- **`repo-url.ts` as a tiny new helper.** Bundled into 4.1 because (a) it's
  trivial and (b) only `<RecentActivity>` consumes it, only the page reads it.
  Splitting into a separate section would over-fragment.
- **JSON-LD merged into one `CollectionPage`.** Old `/build-log` and
  `/build-log/status` each had their own; the new page replaces both with one
  blob whose description combines their phrasing.
- **`dynamic = 'force-dynamic'`.** Preserved from both old pages — the page
  reads filesystem state at request time, not build time.
- **Footer link to `IMPLEMENTATION-LOG.md`.** Public GitHub URL because the
  log is meant to be read in browsers; the local file is empty today and the
  GitHub link survives even when the file content evolves.

### Files

| Action  | File                                                       |
|---------|------------------------------------------------------------|
| REWRITE | `src/app/build-log/page.tsx`                               |
| MODIFY  | `src/app/build-log/__tests__/page.test.tsx`                |
| NEW     | `src/lib/build-log/repo-url.ts`                            |
| NEW     | `src/lib/build-log/__tests__/repo-url.test.ts`             |

---

## Feature 4.2: /status → /build-log#current redirect

**Complexity: S** — Replace `src/app/build-log/status/page.tsx` with a one-line server-side `redirect()`. One test asserts the redirect call.

### Problem

Removing `/build-log/status` outright would break inbound links (the old
`/build-log` page's "See live pipeline status →" link, any external bookmarks,
the old sitemap entries). A server-side redirect preserves those URLs for one
release cycle; the route can be deleted in a follow-up after the redirects
have aged out.

### Implementation

**REWRITE** `src/app/build-log/status/page.tsx`:

```tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function StatusRedirect(): never {
  redirect('/build-log#current');
}
```

**MODIFY** `src/app/build-log/status/__tests__/page.test.tsx`:

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

import { redirect } from 'next/navigation';
import StatusRedirect from '../page';

describe('StatusRedirect', () => {
  it('calls redirect("/build-log#current")', () => {
    expect(() => StatusRedirect()).toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/build-log#current');
  });
});
```

### Design Decisions

- **`redirect()` from `next/navigation`, not a `<meta>` refresh.** Server-side
  307 is the correct semantic; viewer doesn't see the old page flash.
- **`#current` anchor in redirect target.** Lands viewers at the Hero rather
  than the page top — preserves the "I was looking at live state" intent of
  the old URL.
- **Default-export function returns `never`.** Next.js `redirect` throws to
  unwind the render; TS understands the function never returns.
- **Throw "NEXT_REDIRECT" in the test mock.** Matches Next.js's real behavior;
  ensures the test verifies the throw-after-redirect contract.
- **No metadata.** A 307 redirect's body is never seen; metadata adds nothing.
- **Keep `dynamic = 'force-dynamic'`.** Avoids the page being statically
  pre-rendered to a redirect HTML that browsers cache incorrectly.

### Files

| Action  | File                                                       |
|---------|------------------------------------------------------------|
| REWRITE | `src/app/build-log/status/page.tsx`                        |
| MODIFY  | `src/app/build-log/status/__tests__/page.test.tsx`         |

---

## Feature 4.3: Delete JobsRollupTable + cleanup

**Complexity: S** — Delete `<JobsRollupTable>` and its test, remove the barrel re-export. The new `<JobCard>` carries the same data inline; the table view is redundant.

### Problem

`<JobsRollupTable>` was used only by `/build-log/status`. After 4.1 + 4.2,
the only path to the table was via the redirect — which goes nowhere near the
component. Leaving it as dead code invites drift; deleting it now closes the
loop on this job.

### Implementation

**DELETE** `src/components/build-log/JobsRollupTable.tsx`.
**DELETE** `src/components/build-log/__tests__/JobsRollupTable.test.tsx`.

**MODIFY** `src/components/build-log/index.ts` — remove the
`JobsRollupTable` export. (If the file doesn't already exist as a barrel,
this step is a no-op; verify during `/discovery 4.3`.)

**Verification step** — `grep -r 'JobsRollupTable' src/` must return zero
matches. If it returns any, the migration in 4.1 missed a caller; that caller
is migrated as part of 4.3 (small expansion of scope).

### Design Decisions

- **Delete now, not later.** The component is small (one table). Keeping it
  "in case" we want the table view back is YAGNI; if the table view is needed
  later, re-creating it from the new JobCard markup is a short job.
- **Explicit grep verification.** Saves a future contributor from importing
  the table by autocomplete and seeing a stale type.
- **Tests deleted with the component.** No reason to retain test-only
  coverage of code that doesn't exist.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| DELETE | `src/components/build-log/JobsRollupTable.tsx`             |
| DELETE | `src/components/build-log/__tests__/JobsRollupTable.test.tsx` |
| MODIFY | `src/components/build-log/index.ts` (if present)           |
