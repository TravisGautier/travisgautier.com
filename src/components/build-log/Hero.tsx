import { phaseLabel, isPhaseName } from '@/lib/build-log/phase-labels';
import { formatRelativeTime } from '@/lib/build-log/relative-time';
import { toEntry } from '@/lib/build-log/normalize';
import type { LiveStatus } from '@/lib/build-log/derive-live-status';
import type { SessionStatus, JobRollupEntry } from '@/content/schemas';
import type { LiveWorktree } from '@/lib/build-log/worktree-state';
import { site } from '@/lib/site';

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
        The agent-driven build process behind {site.domain}, rendered as published
        content.{' '}
        <a href="#whatisthis" className="text-link hover:text-(--color-oxblood)">
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
      const phase = isPhaseName(session?.currentAgent) ? session!.currentAgent! : null;
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
