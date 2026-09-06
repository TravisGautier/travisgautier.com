import type { Metadata } from 'next';
import Link from 'next/link';
import { Bone, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { JobsRollupTable } from '@/components/build-log/JobsRollupTable';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import {
  getSessionStatus,
  getKnowledgeFile,
  getJobsRollup,
} from '@/lib/build-log/pipeline-state';
import { getLiveWorktrees } from '@/lib/build-log/worktree-state';
import { extractSectionId } from '@/lib/build-log/normalize';
import { site } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pipeline status · Build log',
  description:
    `Live view of the ${site.name} TDD pipeline — current section, completed sections, and per-job progress, read directly from session.yaml at build time.`,
  openGraph: {
    title: `Pipeline status · ${site.name}`,
    description:
      `Live view of the ${site.name} TDD pipeline — current section, completed sections, and per-job progress.`,
    type: 'website',
    url: '/build-log/status',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Pipeline status · ${site.name}`,
    description:
      `Live view of the ${site.name} TDD pipeline — current section, completed sections, per-job progress.`,
  },
  alternates: {
    canonical: '/build-log/status',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Pipeline status',
  description:
    `Live view of the ${site.name} TDD pipeline — current section, completed sections, and per-job progress.`,
  url: `${site.url}/build-log/status`,
  isPartOf: {
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
  },
};

export default async function StatusPage() {
  const [session, knowledge, rollup, liveWorktrees] = await Promise.all([
    getSessionStatus(),
    getKnowledgeFile(),
    getJobsRollup(),
    getLiveWorktrees(),
  ]);

  return (
    <Bone>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Section rhythm="md" as="main">
        <Container width="wide">
          <nav className="mb-(--space-5)">
            <Link
              href="/build-log"
              className="label text-(--color-oxblood) hover:underline"
            >
              ← Back to build log
            </Link>
          </nav>
          <header>
            <span className="label">Pipeline</span>
            <h1 className="display-1 mt-(--space-3)">Pipeline status</h1>
            <p className="body-1 mt-(--space-4) max-w-prose text-(--color-muted)">
              Read directly from{' '}
              <code className="font-mono text-(--color-ink)">
                pipeline/active/
              </code>{' '}
              at build time. Refreshes whenever the site rebuilds.
            </p>
          </header>

          <section className="mt-(--space-8)" aria-labelledby="current-state">
            <h2 id="current-state" className="display-2">
              Current state
            </h2>
            <dl className="body-2 mt-(--space-5) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
              <div>
                <dt className="label text-(--color-muted)">Session</dt>
                <dd className="font-mono mt-(--space-1)">{session.id}</dd>
              </div>
              {session.startedAt && (
                <div>
                  <dt className="label text-(--color-muted)">Started</dt>
                  <dd className="mt-(--space-1)">{session.startedAt}</dd>
                </div>
              )}
              <div>
                <dt className="label text-(--color-muted)">Current section</dt>
                <dd className="font-mono mt-(--space-1)">
                  {session.currentSection || (
                    <span className="text-(--color-muted)">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="label text-(--color-muted)">Current agent</dt>
                <dd className="mt-(--space-1)">
                  {session.currentAgent || (
                    <span className="text-(--color-muted)">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="label text-(--color-muted)">Current stage</dt>
                <dd className="mt-(--space-1)">
                  {session.currentStage || (
                    <span className="text-(--color-muted)">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-(--space-8)" aria-labelledby="rollup">
            <h2 id="rollup" className="display-2">
              Jobs at a glance
            </h2>
            <div className="mt-(--space-5)">
              <JobsRollupTable rows={rollup} />
            </div>
          </section>

          <section className="mt-(--space-8)" aria-labelledby="live-worktrees">
            <h2 id="live-worktrees" className="display-2">
              Live worktrees
            </h2>
            {liveWorktrees.length === 0 ? (
              <p className="body-2 mt-(--space-5) italic text-(--color-muted)">
                No live pipeline sections — main repo is idle.
              </p>
            ) : (
              <ul className="body-2 mt-(--space-5) space-y-(--space-2)">
                {liveWorktrees.map((w) => (
                  <li
                    key={w.sectionId}
                    className="flex flex-wrap gap-x-(--space-4) gap-y-(--space-1) font-mono"
                  >
                    <span className="text-(--color-oxblood)">{w.sectionId}</span>
                    <span className="text-(--color-muted)">
                      phase: {w.currentPhase ?? '—'}
                    </span>
                    <span className="text-(--color-muted)">
                      pid: {w.pid ?? '—'}
                    </span>
                    <span className="text-(--color-muted) truncate">
                      {w.slotPath}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-(--space-8)" aria-labelledby="completed">
            <h2 id="completed" className="display-2">
              Completed sections
            </h2>
            {session.completedSections.length === 0 ? (
              <p className="body-2 mt-(--space-5) italic text-(--color-muted)">
                No sections shipped yet — pipeline is still warming up.
              </p>
            ) : (
              <ul className="body-2 mt-(--space-5) space-y-(--space-1) font-mono">
                {session.completedSections.map((entry, i) => (
                  <li key={i}>{extractSectionId(entry)}</li>
                ))}
              </ul>
            )}
          </section>

          {(knowledge.projectContext?.purpose || session.notes) && (
            <section className="mt-(--space-8)" aria-labelledby="notes">
              <h2 id="notes" className="display-2">
                Notes
              </h2>
              {session.notes && (
                <div className="mt-(--space-5)">
                  <MarkdownDocument body={session.notes} />
                </div>
              )}
            </section>
          )}
        </Container>
      </Section>
    </Bone>
  );
}
