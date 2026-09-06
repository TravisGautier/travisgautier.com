# Phase 3: Composed UI blocks

**Total Size: M + S + L + M + S**
**Prerequisites:** Phase 2 complete — `<PhaseStepper>` (used by 3.2 and 3.4), enriched `<JobCard>` (consumed by 4.1's JobsAtAGlance composition but not directly by Phase 3 blocks), `normalize` lib (used by 3.3). Phase 1's `phase-labels`, `relative-time`, and `derive-live-status` are direct dependencies of 3.1; `LiveStatus` type used by 3.1's prop shape.
**New Types:** None — all types defined in Phase 1.
**New Files:** `src/components/build-log/Hero.tsx`, `PipelineExplainer.tsx`, `RecentActivity.tsx`, `LiveWorktreesPanel.tsx`, `KnowledgeDigest.tsx` (each with co-located tests).

Phase 3 is the five visible blocks the consolidated page composes. After this
phase ships, every block is independently renderable against fixture data,
fully tested for its rendering matrix, and axe-clean in jsdom. None are yet
mounted in the page — Phase 4 assembles them.

The five sections run in parallel. They share zero state and don't depend on
each other for compilation; they only share their position in the eventual
page composition.

---

## Feature 3.1: Hero block

**Complexity: M** — The "right now" hero at the top of the page. Pure renderer of a derived `LiveStatus` plus three stat tiles plus the anchor that `/build-log/status` redirects to.

### Problem

The current `/build-log` page opens with a static header and a paragraph of
copy. A first-time viewer has no idea what's happening *right now*. The hero
must answer that question in one sentence at the top of the page, in language
a layperson can parse, with a friendly tone that doesn't oversell ("the AI is
hard at work") or undersell ("nothing happening"). Beyond the live-status
sentence, three numeric tiles establish trust signals (the project has
shipped real, measurable work).

The five `LiveStatus` variants from 1.3 each map to a different copy template:

- `active` — "Right now an AI agent is {phaseLabel} for `{sectionId}`."
  - Plural variant when `worktrees.length > 1`: "Right now {n} AI agents are
    working — see live worktrees below."
- `paused` — "The pipeline is paused between phases on `{sectionId}`."
- `idle` — "The pipeline is idle. Last shipped {relativeTime}."
- `stale` — "The pipeline last shipped {relativeTime}; site is up-to-date."
- `unknown` — "Pipeline state unavailable. Site is up-to-date with the last
  shipped commit."

### Implementation

**NEW** `src/components/build-log/Hero.tsx`:

```tsx
import { phaseLabel, isPhaseName } from '@/lib/build-log/phase-labels';
import { formatRelativeTime } from '@/lib/build-log/relative-time';
import { toEntry } from '@/lib/build-log/normalize';
import type { LiveStatus, SessionStatus, JobRollupEntry } from '@/content/schemas';
import type { LiveWorktree } from '@/lib/build-log/worktree-state';

export interface HeroProps {
  liveStatus: LiveStatus;
  session: SessionStatus | null;
  worktrees: readonly LiveWorktree[];
  rollup: readonly JobRollupEntry[];
  nowIso: string;
}

export function Hero({ liveStatus, session, worktrees, rollup, nowIso }: HeroProps) {
  const completedSections = session?.completedSections ?? [];
  const sentence = buildSentence({ liveStatus, session, worktrees, nowIso });

  // Stat tiles
  const shipped = completedSections.length;
  const testsWritten = completedSections.reduce((sum, raw) => {
    const e = toEntry(raw);
    return sum + (e.kind === 'detailed' && typeof e.tests === 'number' ? e.tests : 0);
  }, 0);
  const inProgress = rollup.filter((r) => r.status === 'in-progress').length;

  return (
    <section
      id="current"
      aria-labelledby="hero-heading"
      className="mb-12"
      data-live-status={liveStatus}
    >
      <h1 id="hero-heading" className="text-4xl font-display mb-3">
        Build log
      </h1>
      <p className="text-lg text-(--color-ink) max-w-2xl mb-2">{sentence}</p>
      <p className="text-sm text-(--color-muted) max-w-2xl mb-6">
        The agent-driven build process behind travisgautier.com, rendered as published
        content. <a href="#whatisthis" className="text-link hover:text-(--color-oxblood)">
          What is this?
        </a>
      </p>

      <dl className="grid grid-cols-3 gap-4 max-w-md">
        <StatTile label="Sections shipped" value={shipped} />
        <StatTile label="Tests written" value={testsWritten} />
        <StatTile label="Jobs in progress" value={inProgress} />
      </dl>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-bone p-3">
      <dt className="text-xs text-(--color-muted) uppercase tracking-wide">{label}</dt>
      <dd className="font-display text-2xl tabular-nums mt-1">{value.toLocaleString()}</dd>
    </div>
  );
}

interface SentenceInput {
  liveStatus: LiveStatus;
  session: SessionStatus | null;
  worktrees: readonly LiveWorktree[];
  nowIso: string;
}

function buildSentence({ liveStatus, session, worktrees, nowIso }: SentenceInput): string {
  switch (liveStatus) {
    case 'active': {
      if (worktrees.length > 1) {
        return `Right now ${worktrees.length} AI agents are working — see live worktrees below.`;
      }
      const sectionId = session?.currentSection ?? '';
      const phase = isPhaseName(session?.currentAgent)
        ? session!.currentAgent!
        : null;
      const labelLower = phase ? phaseLabel(phase).toLowerCase() : 'working';
      return `Right now an AI agent is ${labelLower} for ${sectionId}.`;
    }
    case 'paused': {
      const sectionId = session?.currentSection ?? '';
      return sectionId
        ? `The pipeline is paused between phases on ${sectionId}.`
        : 'The pipeline is paused between phases.';
    }
    case 'idle': {
      const last = mostRecentTimestamp(session, nowIso);
      return last
        ? `The pipeline is idle. Last shipped ${last}.`
        : 'The pipeline is idle.';
    }
    case 'stale': {
      const last = mostRecentTimestamp(session, nowIso);
      return last
        ? `The pipeline last shipped ${last}; site is up-to-date.`
        : 'The pipeline has not shipped anything yet.';
    }
    case 'unknown':
    default:
      return 'Pipeline state unavailable. Site is up-to-date with the last shipped commit.';
  }
}

function mostRecentTimestamp(session: SessionStatus | null, nowIso: string): string {
  if (!session) return '';
  let mostRecent: string | null = null;
  for (const raw of session.completedSections) {
    const e = toEntry(raw);
    if (e.kind === 'detailed' && e.completedAt) {
      if (!mostRecent || e.completedAt > mostRecent) mostRecent = e.completedAt;
    }
  }
  if (!mostRecent) return '';
  return formatRelativeTime(mostRecent, nowIso);
}
```

**NEW** `src/components/build-log/__tests__/Hero.test.tsx` — five fixtures
covering every `LiveStatus`, plus plural-agent and zero-stats edge cases.

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../Hero';
import type { LiveWorktree } from '@/lib/build-log/worktree-state';

const NOW = '2026-06-07T12:00:00Z';
const base = {
  rollup: [],
  worktrees: [] as readonly LiveWorktree[],
  nowIso: NOW,
};

describe('Hero', () => {
  it('renders id="current" anchor', () => {
    const { container } = render(
      <Hero liveStatus="unknown" session={null} {...base} />,
    );
    expect(container.querySelector('#current')).toBeInTheDocument();
  });

  it('active variant — single agent', () => {
    render(
      <Hero
        liveStatus="active"
        session={{
          id: 's',
          currentSection: 'build-log-overhaul-1.2',
          currentAgent: 'green',
          completedSections: [],
        }}
        rollup={[]}
        worktrees={[{ sectionId: 'build-log-overhaul-1.2' } as never]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/making the tests pass/i)).toBeInTheDocument();
    expect(screen.getByText(/build-log-overhaul-1\.2/)).toBeInTheDocument();
  });

  it('active variant — plural agents', () => {
    render(
      <Hero
        liveStatus="active"
        session={{ id: 's', completedSections: [] }}
        rollup={[]}
        worktrees={[
          { sectionId: 'a-1.1' } as never,
          { sectionId: 'b-1.1' } as never,
        ]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/2 AI agents are working/i)).toBeInTheDocument();
  });

  it('paused variant', () => {
    render(
      <Hero
        liveStatus="paused"
        session={{
          id: 's',
          currentSection: 'foo-1.1',
          currentAgent: 'pending',
          completedSections: [],
        }}
        {...base}
      />,
    );
    expect(screen.getByText(/paused between phases on foo-1\.1/i)).toBeInTheDocument();
  });

  it('idle variant', () => {
    render(
      <Hero
        liveStatus="idle"
        session={{
          id: 's',
          completedSections: [
            { section: 'foo-1.1', completedAt: '2026-06-07T09:00:00Z' },
          ],
        }}
        {...base}
      />,
    );
    expect(screen.getByText(/pipeline is idle.*3h ago/i)).toBeInTheDocument();
  });

  it('stale variant', () => {
    render(
      <Hero
        liveStatus="stale"
        session={{
          id: 's',
          completedSections: [
            { section: 'foo-1.1', completedAt: '2026-06-01T00:00:00Z' },
          ],
        }}
        {...base}
      />,
    );
    expect(screen.getByText(/last shipped.*site is up-to-date/i)).toBeInTheDocument();
  });

  it('unknown variant', () => {
    render(<Hero liveStatus="unknown" session={null} {...base} />);
    expect(screen.getByText(/state unavailable/i)).toBeInTheDocument();
  });

  it('stat tiles compute correctly', () => {
    render(
      <Hero
        liveStatus="active"
        session={{
          id: 's',
          currentSection: 'x',
          currentAgent: 'green',
          completedSections: [
            { section: 'a', tests: 10 },
            { section: 'b', tests: 20 },
            'c-string-form',
          ],
        }}
        rollup={[
          { slug: 'a', title: 'A', totalFeatures: 1, completedFeatures: 0, liveFeatures: 1, percentComplete: 0, status: 'in-progress' },
          { slug: 'b', title: 'B', totalFeatures: 1, completedFeatures: 1, liveFeatures: 0, percentComplete: 100, status: 'complete' },
        ]}
        worktrees={[{ sectionId: 'x' } as never]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText('3')).toBeInTheDocument(); // shipped
    expect(screen.getByText('30')).toBeInTheDocument(); // tests
    expect(screen.getByText('1')).toBeInTheDocument(); // in-progress
  });
});
```

### Design Decisions

- **`liveStatus` is a required prop, not computed internally.** Keeps the
  Hero pure-renderer; the page calls `deriveLiveStatus()` once and passes the
  result down. Makes every variant testable against a one-line input.
- **`data-live-status` attribute on the section.** Surface for stable
  test-selector + opt-in CSS hooks (e.g. a different background-color per
  variant if the brand calls for it later).
- **`id="current"` anchor.** The 4.2 redirect lands at `/build-log#current`.
  The Hero is the obvious landing target.
- **"What is this?" jumps to `#whatisthis`.** PipelineExplainer (3.2) carries
  that id. Inline jump rather than a smooth-scroll JS handler keeps the link
  no-JS-friendly.
- **Stat tile values via `toLocaleString()`.** Adds the thousands separator
  once "tests written" gets past 1000. Locale-default is fine here because the
  number itself is the message — the formatting differences across locales are
  cosmetic.
- **`mostRecentTimestamp` re-iterates `completedSections`.** Looks O(2N) but
  the array is bounded (~100 entries). A shared computation is over-engineering
  for one render.
- **No prop for "show stat tiles".** All variants render tiles. Empty pipeline
  ships zeros across the board; that's still a meaningful display ("nothing
  shipped yet"). Conditional rendering would just produce more code paths.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/components/build-log/Hero.tsx`                        |
| NEW    | `src/components/build-log/__tests__/Hero.test.tsx`         |

---

## Feature 3.2: PipelineExplainer block

**Complexity: S** — Static explainer copy plus a `<PhaseStepper currentPhase={null}>` legend, wrapped in `<details open>` so viewers can collapse it on returning visits without JS.

### Problem

A new viewer needs ~30 seconds of context: every feature on this site is built
by an AI agent following a strict TDD pipeline; the page is a live readout of
that work, rebuilt at deploy time, generated by reading repo state. The
explainer carries that context once and gets out of the way. Native `<details
open>` is the right primitive: no client component, no localStorage, but
collapsible on demand.

### Implementation

**NEW** `src/components/build-log/PipelineExplainer.tsx`:

```tsx
import { PhaseStepper } from './PhaseStepper';

export function PipelineExplainer() {
  return (
    <details id="whatisthis" open className="mb-10 border border-bone p-5">
      <summary className="cursor-pointer font-display text-xl">
        What is this?
      </summary>

      <div className="mt-4 max-w-3xl space-y-3 text-sm text-(--color-ink)">
        <p>
          Every feature on this site is built by an AI agent following a strict
          test-first pipeline. The agent researches the change, writes the tests
          that describe what should happen, makes them pass, polishes the code,
          then ships it as a single commit.
        </p>
        <p>
          This page is a live readout of that work. It reads the same files the
          agents read — <code className="font-mono text-(--color-oxblood)">pipeline/active/session.yaml</code>,
          live <code className="font-mono text-(--color-oxblood)">git worktree</code> state,
          and every job's plan tree under <code className="font-mono text-(--color-oxblood)">currentwork/</code>
          — and renders them in plain English. It rebuilds whenever the site
          deploys.
        </p>
        <p className="text-(--color-muted)">
          The seven phases an agent moves through, in order:
        </p>
        <div className="pt-2">
          <PhaseStepper currentPhase={null} size="md" />
        </div>
      </div>
    </details>
  );
}
```

**NEW** `src/components/build-log/__tests__/PipelineExplainer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PipelineExplainer } from '../PipelineExplainer';

describe('PipelineExplainer', () => {
  it('renders the "What is this?" summary', () => {
    render(<PipelineExplainer />);
    expect(screen.getByText('What is this?')).toBeInTheDocument();
  });

  it('opens by default', () => {
    const { container } = render(<PipelineExplainer />);
    const details = container.querySelector('details');
    expect(details).toHaveAttribute('open');
  });

  it('carries id="whatisthis" so Hero can link to it', () => {
    const { container } = render(<PipelineExplainer />);
    expect(container.querySelector('#whatisthis')).toBeInTheDocument();
  });

  it('mounts the PhaseStepper legend with all 7 phases', () => {
    render(<PipelineExplainer />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(7);
  });
});
```

### Design Decisions

- **`<details open>` not `<dialog>` or a stateful disclosure.** Native, no JS,
  collapsible by viewer click. Open-by-default ensures first-time viewers see
  the context; returning viewers can collapse and the browser remembers per
  session.
- **Static copy, hand-written.** This is brand voice copy that should be
  reviewed for tone in /discovery 3.2 — not generated from a template.
- **Code references use brand Oxblood.** Establishes the "code = oxblood
  monospace" pattern that the rest of the page will inherit on commit hashes
  and section ids.
- **Three paragraphs, not five.** Brevity wins. The viewer who wants to go
  deeper can scroll into the live blocks below.
- **PhaseStepper in legend mode.** No `currentPhase` highlight — this is a
  reference, not a position indicator.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/components/build-log/PipelineExplainer.tsx`           |
| NEW    | `src/components/build-log/__tests__/PipelineExplainer.test.tsx` |

---

## Feature 3.3: RecentActivity block

**Complexity: L** — Reverse-chronological feed of completed sections. Top 5 rendered as expanded cards with commit links + collapsed notes preview; entries 6–25 as a compact list; entries beyond 25 inside a `<details>` "show older" wrapper. Notes prose is NEVER auto-expanded — they can be 40KB.

### Problem

Today's `/build-log/status` renders `completedSections` as a flat
`<ul>` of section IDs. Rich data exists per entry (commit hash, commit
message, test count, files-new/files-modified, notes prose) but none of it
reaches the viewer. A recent-activity feed surfaces "what shipped recently"
with enough context to feel alive without overwhelming the page — the trick is
correctly bounding how much data renders by default (notes are too big to
auto-show; the long-tail is too noisy to enumerate).

### Implementation

**NEW** `src/components/build-log/RecentActivity.tsx`:

```tsx
import { toEntry } from '@/lib/build-log/normalize';
import { formatRelativeTime } from '@/lib/build-log/relative-time';
import { MarkdownDocument } from './MarkdownDocument';
import type {
  SessionStatus,
  JobRollupEntry,
  CompletedSectionEntry,
} from '@/content/schemas';

const TOP_N_EXPANDED = 5;
const COMPACT_TAIL_CAP = 25;
const NOTES_PREVIEW_CHARS = 1000;

export interface RecentActivityProps {
  entries: SessionStatus['completedSections'];
  rollup: readonly JobRollupEntry[];
  nowIso: string;
  /** GitHub org/repo for commit links. Optional — falls back to plain text. */
  githubRepoUrl?: string;
}

export function RecentActivity({
  entries,
  rollup,
  nowIso,
  githubRepoUrl,
}: RecentActivityProps) {
  if (!entries.length) {
    return (
      <section className="mb-10" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-2xl font-display mb-4">
          Recent activity
        </h2>
        <p className="text-(--color-muted) italic">
          No sections shipped yet — pipeline is still warming up.
        </p>
      </section>
    );
  }

  const normalized = entries.map(toEntry).reverse();
  const top = normalized.slice(0, TOP_N_EXPANDED);
  const middle = normalized.slice(TOP_N_EXPANDED, COMPACT_TAIL_CAP);
  const older = normalized.slice(COMPACT_TAIL_CAP);

  return (
    <section className="mb-10" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="text-2xl font-display mb-4">
        Recent activity
      </h2>

      <ul className="space-y-4 mb-6">
        {top.map((entry, i) => (
          <li key={`top-${i}`}>
            <ActivityCard
              entry={entry}
              rollup={rollup}
              nowIso={nowIso}
              githubRepoUrl={githubRepoUrl}
            />
          </li>
        ))}
      </ul>

      {middle.length > 0 && (
        <ul className="space-y-1 text-sm font-mono mb-4 text-(--color-muted)">
          {middle.map((entry, i) => (
            <li key={`mid-${i}`}>
              <CompactRow entry={entry} nowIso={nowIso} />
            </li>
          ))}
        </ul>
      )}

      {older.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-link hover:text-(--color-oxblood)">
            Show {older.length} older
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-(--color-muted)">
            {older.map((entry, i) => (
              <li key={`old-${i}`}>
                <CompactRow entry={entry} nowIso={nowIso} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

interface ActivityCardProps {
  entry: CompletedSectionEntry;
  rollup: readonly JobRollupEntry[];
  nowIso: string;
  githubRepoUrl?: string;
}

function ActivityCard({ entry, rollup, nowIso, githubRepoUrl }: ActivityCardProps) {
  if (entry.kind === 'minimal') {
    return (
      <article className="border border-bone p-4">
        <p className="font-mono text-sm">{entry.id}</p>
        <p className="text-xs text-(--color-muted) mt-1">
          Shipped earlier (no detail recorded).
        </p>
      </article>
    );
  }

  const jobName = resolveJobName(entry.id, rollup);
  const relative = entry.completedAt ? formatRelativeTime(entry.completedAt, nowIso) : '';
  const commitLink = entry.commitHash && githubRepoUrl
    ? `${githubRepoUrl}/commit/${entry.commitHash}`
    : null;

  return (
    <article className="border border-bone p-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="font-mono text-sm text-(--color-oxblood)">
          {entry.id}
          {jobName && (
            <span className="ml-2 text-(--color-muted) font-sans">from {jobName}</span>
          )}
        </h3>
        <span className="text-xs text-(--color-muted) tabular-nums">
          {relative}
          {entry.completedAt && relative && (
            <span className="ml-2 font-mono">{entry.completedAt.slice(0, 10)}</span>
          )}
        </span>
      </header>

      <dl className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <Stat label="Tests" value={entry.tests} />
        <Stat label="New files" value={entry.filesNew} />
        <Stat label="Files changed" value={entry.filesModified} />
      </dl>

      {entry.commitHash && (
        <p className="mt-2 text-xs font-mono">
          Commit:{' '}
          {commitLink ? (
            <a href={commitLink} className="text-link hover:text-(--color-oxblood)">
              {entry.commitHash.slice(0, 7)}
            </a>
          ) : (
            <span>{entry.commitHash.slice(0, 7)}</span>
          )}
        </p>
      )}

      {entry.notes && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-link hover:text-(--color-oxblood)">
            Notes ({Math.round(entry.notes.length / 1000)}KB) —{' '}
            <span className="text-(--color-muted) font-normal">
              {entry.notes.slice(0, NOTES_PREVIEW_CHARS).replace(/\s+/g, ' ')}
              {entry.notes.length > NOTES_PREVIEW_CHARS && '…'}
            </span>
          </summary>
          <div className="mt-2 build-log-prose">
            <MarkdownDocument body={entry.notes} />
          </div>
        </details>
      )}
    </article>
  );
}

function CompactRow({
  entry,
  nowIso,
}: {
  entry: CompletedSectionEntry;
  nowIso: string;
}) {
  if (entry.kind === 'minimal') {
    return <span>{entry.id}</span>;
  }
  const relative = entry.completedAt ? formatRelativeTime(entry.completedAt, nowIso) : '';
  return (
    <span>
      {entry.id}
      {relative && <span className="ml-2">· {relative}</span>}
      {entry.commitHash && <span className="ml-2">· {entry.commitHash.slice(0, 7)}</span>}
    </span>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <dt className="text-(--color-muted) uppercase tracking-wide">{label}</dt>
      <dd className="font-mono tabular-nums mt-0.5">
        {typeof value === 'number' ? value : '—'}
      </dd>
    </div>
  );
}

function resolveJobName(
  sectionId: string,
  rollup: readonly JobRollupEntry[],
): string | null {
  const match = rollup.find((r) => sectionId.startsWith(`${r.slug}-`));
  return match ? match.title : null;
}
```

**NEW** `src/components/build-log/__tests__/RecentActivity.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentActivity } from '../RecentActivity';

const NOW = '2026-06-07T12:00:00Z';
const ROLLUP = [
  { slug: 'foo', title: 'Foo job', totalFeatures: 5, completedFeatures: 3, liveFeatures: 0, percentComplete: 60, status: 'in-progress' as const },
];

describe('RecentActivity', () => {
  it('renders empty state when no entries', () => {
    render(<RecentActivity entries={[]} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getByText(/no sections shipped yet/i)).toBeInTheDocument();
  });

  it('renders top-5 as expanded cards', () => {
    const entries = Array.from({ length: 3 }, (_, i) => ({
      section: `foo-1.${i + 1}`,
      completedAt: '2026-06-07T08:00:00Z',
      tests: 10 * (i + 1),
      commit_hash: `abc${i}`.padEnd(7, '0'),
    }));
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getByText('foo-1.3')).toBeInTheDocument();
    expect(screen.getAllByText(/tests/i).length).toBeGreaterThan(0);
  });

  it('splits 6-25 into compact tail', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      section: `foo-1.${i + 1}`,
      completedAt: '2026-06-07T08:00:00Z',
      tests: 5,
    }));
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    // 5 expanded + 5 compact = 10 total rows; "Tests" appears 5x for expanded
    expect(screen.getAllByText('Tests')).toHaveLength(5);
  });

  it('hides entries beyond 25 inside "show older" details', () => {
    const entries = Array.from({ length: 30 }, (_, i) => ({
      section: `foo-1.${i + 1}`,
      completedAt: '2026-06-07T08:00:00Z',
    }));
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getByText('Show 5 older')).toBeInTheDocument();
  });

  it('renders minimal/string-form entries with "no detail recorded"', () => {
    render(
      <RecentActivity
        entries={['legacy-1.1']}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/no detail recorded/i)).toBeInTheDocument();
  });

  it('links commit hash to GitHub when repo URL provided', () => {
    render(
      <RecentActivity
        entries={[{
          section: 'foo-1.1',
          commit_hash: 'abcdef1234567',
          completedAt: '2026-06-07T08:00:00Z',
        }]}
        rollup={ROLLUP}
        nowIso={NOW}
        githubRepoUrl="https://github.com/x/y"
      />,
    );
    const link = screen.getByRole('link', { name: /abcdef1/ });
    expect(link).toHaveAttribute('href', 'https://github.com/x/y/commit/abcdef1234567');
  });

  it('renders commit hash as plain text when no repo URL', () => {
    render(
      <RecentActivity
        entries={[{
          section: 'foo-1.1',
          commit_hash: 'abcdef1234567',
          completedAt: '2026-06-07T08:00:00Z',
        }]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    expect(screen.queryByRole('link', { name: /abcdef1/ })).toBeNull();
  });

  it('keeps notes inside a closed <details> by default', () => {
    const longNotes = 'a'.repeat(20000);
    const { container } = render(
      <RecentActivity
        entries={[{ section: 'foo-1.1', notes: longNotes, completedAt: '2026-06-07T00:00:00Z' }]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    const detailsList = container.querySelectorAll('details');
    const notesDetails = Array.from(detailsList).find((d) =>
      d.textContent?.includes('Notes ('),
    );
    expect(notesDetails).toBeDefined();
    expect(notesDetails!.hasAttribute('open')).toBe(false);
  });

  it('joins job name when slug matches', () => {
    render(
      <RecentActivity
        entries={[{ section: 'foo-1.1', completedAt: '2026-06-07T08:00:00Z' }]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/from Foo job/i)).toBeInTheDocument();
  });
});
```

### Design Decisions

- **Reverse the entries array.** `session.yaml.completed_sections` is
  chronological (oldest first); the feed reads newest-first.
- **Top-5 expanded, 6–25 compact, 25+ hidden.** Empirical sweet spot: the
  expanded cards convey rich detail without overwhelming the page; the compact
  tail keeps the feed feeling complete; the hidden bucket avoids exploding the
  DOM on long-running projects (the existing session.yaml already has 100+
  entries).
- **`MarkdownDocument` reused for notes.** Notes are stored as markdown in
  `session.yaml`; the existing renderer handles them with `.build-log-prose`
  styling. Nesting `<details>` works fine — the parent has no interaction.
- **1000-char preview inside `<summary>`.** Gives viewers a sense of what
  they'd be opening without rendering the full 40KB. `replace(/\s+/g, ' ')`
  flattens line breaks so the preview stays one paragraph.
- **`githubRepoUrl` injected from page.** The page reads `package.json` once
  at build time and passes the resolved URL down. Component stays pure.
- **`resolveJobName` is `startsWith` not exact match.** Section IDs are
  `{slug}-{N.M}`; the slug can contain hyphens. `startsWith(slug + '-')` is
  the cheapest correct match.
- **String-form entries render NO commit/test data.** They never had it. The
  "Shipped earlier (no detail recorded)" line tells the viewer why the card
  looks sparse.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/components/build-log/RecentActivity.tsx`              |
| NEW    | `src/components/build-log/__tests__/RecentActivity.test.tsx` |

---

## Feature 3.4: LiveWorktreesPanel block

**Complexity: M** — Per-worktree cards showing the section id, friendly phase label, agent name, started-at, slot path, and a per-worktree `<PhaseStepper>`. Entire block hidden when no worktrees and no current section.

### Problem

When agents are working concurrently (or even just one is working), viewers
want to see "what's happening right now" with enough detail to follow along:
which section, which phase, in which worktree on disk. The current status page
renders this as a flat `<ul>` of mono text; a per-worktree card with a stepper
graphic conveys the same data far more glanceably and supports the plural-agent
case the Hero refers to.

### Implementation

**NEW** `src/components/build-log/LiveWorktreesPanel.tsx`:

```tsx
import { PhaseStepper } from './PhaseStepper';
import { phaseLabel, isPhaseName } from '@/lib/build-log/phase-labels';
import { formatRelativeTime } from '@/lib/build-log/relative-time';
import type { SessionStatus } from '@/content/schemas';
import type { LiveWorktree } from '@/lib/build-log/worktree-state';

export interface LiveWorktreesPanelProps {
  worktrees: readonly LiveWorktree[];
  session: SessionStatus | null;
  nowIso: string;
}

export function LiveWorktreesPanel({
  worktrees,
  session,
  nowIso,
}: LiveWorktreesPanelProps) {
  if (worktrees.length === 0 && !session?.currentSection) {
    return null;
  }

  return (
    <section className="mb-10" aria-labelledby="live-worktrees-heading">
      <h2 id="live-worktrees-heading" className="text-2xl font-display mb-1">
        Live work
      </h2>
      <p className="text-sm text-(--color-muted) mb-4">
        {worktrees.length === 0
          ? 'A section is checked out but no worktree is currently active.'
          : worktrees.length === 1
          ? 'One section is in active development right now.'
          : `${worktrees.length} sections are in active development right now.`}
      </p>

      {worktrees.length === 0 ? (
        <p className="text-(--color-muted) italic">
          Current section: <span className="font-mono">{session?.currentSection}</span>
        </p>
      ) : (
        <ul className="space-y-4">
          {worktrees.map((w) => (
            <li key={w.sectionId}>
              <WorktreeCard worktree={w} nowIso={nowIso} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WorktreeCard({
  worktree,
  nowIso,
}: {
  worktree: LiveWorktree;
  nowIso: string;
}) {
  const phase = isPhaseName(worktree.currentPhase) ? worktree.currentPhase : null;
  const startedRelative = worktree.startedAt
    ? formatRelativeTime(worktree.startedAt, nowIso)
    : '';
  const isOrphan = worktree.pid === null || worktree.pid === undefined;

  return (
    <article className="border border-bone p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-sm text-(--color-oxblood)">
          {worktree.sectionId}
        </h3>
        {isOrphan ? (
          <span className="text-xs px-2 py-0.5 border border-bone bg-bone text-(--color-muted) font-mono">
            orphan slot
          </span>
        ) : (
          <span className="text-xs text-(--color-muted) font-mono">
            pid {worktree.pid}
          </span>
        )}
      </header>

      {phase && (
        <p className="mt-2 text-sm">
          <span className="text-(--color-muted)">Phase:</span>{' '}
          <span className="text-(--color-ink)">{phaseLabel(phase)}</span>
        </p>
      )}

      {worktree.agentName && (
        <p className="mt-1 text-sm text-(--color-muted)">
          Agent: <span className="font-mono">{worktree.agentName}</span>
        </p>
      )}

      {startedRelative && (
        <p className="mt-1 text-xs text-(--color-muted)">
          Started {startedRelative}
        </p>
      )}

      {worktree.slotPath && (
        <p className="mt-1 text-xs text-(--color-muted) truncate font-mono">
          {worktree.slotPath}
        </p>
      )}

      <div className="mt-3">
        <PhaseStepper currentPhase={phase} size="sm" />
      </div>
    </article>
  );
}
```

**NEW** `src/components/build-log/__tests__/LiveWorktreesPanel.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveWorktreesPanel } from '../LiveWorktreesPanel';

const NOW = '2026-06-07T12:00:00Z';

describe('LiveWorktreesPanel', () => {
  it('returns null when no worktrees and no current section', () => {
    const { container } = render(
      <LiveWorktreesPanel worktrees={[]} session={null} nowIso={NOW} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "current section but no worktree" text when worktrees empty but session has currentSection', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[]}
        session={{ id: 's', currentSection: 'foo-1.1', completedSections: [] }}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/checked out but no worktree/i)).toBeInTheDocument();
    expect(screen.getByText('foo-1.1')).toBeInTheDocument();
  });

  it('singular label for 1 worktree', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: 1234, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/one section is in active development/i)).toBeInTheDocument();
  });

  it('plural label for >1 worktrees', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[
          { sectionId: 'a-1.1', currentPhase: 'green', pid: 1, slotPath: '/x' } as never,
          { sectionId: 'b-1.1', currentPhase: 'red', pid: 2, slotPath: '/y' } as never,
        ]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/2 sections are in active development/i)).toBeInTheDocument();
  });

  it('renders orphan-slot badge when pid is null', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: null, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText('orphan slot')).toBeInTheDocument();
    expect(screen.queryByText(/pid/i)).toBeNull();
  });

  it('renders friendly phase label, not internal name', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: 1, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText('Making the tests pass')).toBeInTheDocument();
  });
});
```

### Design Decisions

- **Hide the entire section when irrelevant.** An empty panel is visual noise.
  Returning `null` when both `worktrees.length === 0` and `session.currentSection`
  is empty keeps the page from showing a "Live work" header above nothing.
- **Per-worktree `<PhaseStepper size="sm">`.** Reinforces the phase-position
  visualization the legend established. `sm` mode hides labels — the friendly
  phase name appears in the prose row above, no duplication.
- **`isOrphan` check on `pid`.** A worktree directory existing but the
  agent process gone (crash, kill -9) is a real state in the project. Showing
  "pid: —" would lie; the orphan-slot badge tells the viewer this slot is
  dormant.
- **`slotPath` `truncate` for long paths.** Worktree paths can be deep
  (`/var/lib/.../some/deeply/nested/path`). The path is shown for technical
  viewers; truncating with CSS keeps the card height stable.
- **No "kill this worktree" button.** This is a public read-only page. The
  page must never write to repo state.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/components/build-log/LiveWorktreesPanel.tsx`          |
| NEW    | `src/components/build-log/__tests__/LiveWorktreesPanel.test.tsx` |

---

## Feature 3.5: KnowledgeDigest block

**Complexity: S** — Collapsed `<details>` summarizing `knowledge.patterns[]` and `knowledge.deferredFollowups[]` titles. Entire block hidden when both arrays are empty or knowledge.yaml failed to parse.

### Problem

`pipeline/active/knowledge.yaml` carries reusable cross-section patterns the
agents have established and deferred-followups (technical debt the agents
have queued for future sections). This is genuinely interesting reference
material — for a technical viewer, it's a window into "what the agents have
learned." Today the status page renders only the `session.notes` markdown; the
knowledge file is unused. A collapsed `<details>` block surfaces this for the
technical audience without front-loading them.

### Implementation

**NEW** `src/components/build-log/KnowledgeDigest.tsx`:

```tsx
import type { KnowledgeFile } from '@/content/schemas';

interface NamedItem {
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
}

export interface KnowledgeDigestProps {
  knowledge: KnowledgeFile | null;
}

export function KnowledgeDigest({ knowledge }: KnowledgeDigestProps) {
  const patterns = extractItems(knowledge?.patterns);
  const followups = extractItems(
    (knowledge as KnowledgeFile & { deferredFollowups?: readonly unknown[] })?.deferredFollowups,
  );

  if (!patterns.length && !followups.length) return null;

  return (
    <section className="mb-10" aria-labelledby="knowledge-heading">
      <h2 id="knowledge-heading" className="text-2xl font-display mb-1">
        Patterns the agents have learned
      </h2>
      <p className="text-sm text-(--color-muted) mb-4">
        Reusable patterns established across sections and deferred follow-ups
        queued for future work, pulled directly from{' '}
        <code className="font-mono text-(--color-oxblood)">
          pipeline/active/knowledge.yaml
        </code>
        .
      </p>

      <details className="border border-bone p-4">
        <summary className="cursor-pointer font-display text-lg">
          {patterns.length} patterns · {followups.length} deferred follow-ups
        </summary>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {patterns.length > 0 && (
            <div>
              <h3 className="font-display text-base mb-2">Patterns</h3>
              <ul className="space-y-2 text-sm">
                {patterns.map((p, i) => (
                  <li key={`p-${i}`}>
                    <p className="font-mono text-(--color-oxblood) text-xs">
                      {p.name ?? p.title ?? '(untitled)'}
                    </p>
                    {(p.summary ?? p.description) && (
                      <p className="text-(--color-muted) mt-0.5">
                        {p.summary ?? p.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {followups.length > 0 && (
            <div>
              <h3 className="font-display text-base mb-2">Deferred follow-ups</h3>
              <ul className="space-y-2 text-sm">
                {followups.map((f, i) => (
                  <li key={`f-${i}`}>
                    <p className="font-mono text-(--color-oxblood) text-xs">
                      {f.name ?? f.title ?? '(untitled)'}
                    </p>
                    {(f.summary ?? f.description) && (
                      <p className="text-(--color-muted) mt-0.5">
                        {f.summary ?? f.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

function extractItems(raw: readonly unknown[] | undefined): NamedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is NamedItem => typeof x === 'object' && x !== null)
    .map((x) => ({
      name: typeof (x as NamedItem).name === 'string' ? (x as NamedItem).name : undefined,
      title: typeof (x as NamedItem).title === 'string' ? (x as NamedItem).title : undefined,
      summary: typeof (x as NamedItem).summary === 'string' ? (x as NamedItem).summary : undefined,
      description: typeof (x as NamedItem).description === 'string'
        ? (x as NamedItem).description
        : undefined,
    }));
}
```

**NEW** `src/components/build-log/__tests__/KnowledgeDigest.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KnowledgeDigest } from '../KnowledgeDigest';

describe('KnowledgeDigest', () => {
  it('returns null when knowledge is null', () => {
    const { container } = render(<KnowledgeDigest knowledge={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when both arrays are empty', () => {
    const { container } = render(
      <KnowledgeDigest knowledge={{ patterns: [], deferredFollowups: [] } as never} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders patterns when populated', () => {
    render(
      <KnowledgeDigest
        knowledge={{
          patterns: [{ name: 'brand-token-system', summary: 'inline @theme blocks' }],
        } as never}
      />,
    );
    expect(screen.getByText('brand-token-system')).toBeInTheDocument();
    expect(screen.getByText('inline @theme blocks')).toBeInTheDocument();
  });

  it('renders deferred follow-ups when populated', () => {
    render(
      <KnowledgeDigest
        knowledge={{
          deferredFollowups: [{ name: 'polymorphic-primitive-factory' }],
        } as never}
      />,
    );
    expect(screen.getByText('polymorphic-primitive-factory')).toBeInTheDocument();
  });

  it('renders summary count in <summary>', () => {
    render(
      <KnowledgeDigest
        knowledge={{
          patterns: [{ name: 'p1' }, { name: 'p2' }],
          deferredFollowups: [{ name: 'f1' }],
        } as never}
      />,
    );
    expect(screen.getByText(/2 patterns · 1 deferred/i)).toBeInTheDocument();
  });

  it('collapsed by default', () => {
    const { container } = render(
      <KnowledgeDigest
        knowledge={{ patterns: [{ name: 'p1' }] } as never}
      />,
    );
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });
});
```

### Design Decisions

- **Untyped `patterns[]`/`deferredFollowups[]` source.** The `KnowledgeFile`
  schema in `build-log.ts` declares `patterns` as `readonly unknown[]` because
  the YAML shape varies across sections (some patterns have `name`+`summary`,
  others `title`+`description`). The `extractItems` helper coerces to a
  pragmatic shape with best-effort field access.
- **Two-column layout on `md:`.** Each list is naturally short (10–30 items);
  side-by-side reads better than a long vertical scroll.
- **Hidden entirely when empty.** No "no patterns yet" copy; this is technical
  reference material and absence of it is a non-event.
- **Patterns first, follow-ups second.** Patterns are "what works"; follow-ups
  are "what's still to do." The positive-then-deferred ordering matches the
  brand voice.
- **`deferredFollowups` access via cast.** The Zod schema doesn't formally
  declare this field yet (`KnowledgeFile` only declares `patterns` and
  `openQuestions`). A loose cast covers the in-the-wild YAML; tightening the
  schema is out of scope.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/components/build-log/KnowledgeDigest.tsx`             |
| NEW    | `src/components/build-log/__tests__/KnowledgeDigest.test.tsx` |
