import type { Metadata } from 'next';
import type { Job, JobRollupEntry } from '@/content/schemas';
import { Bone, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { JobCard } from '@/components/build-log/JobCard';
import { JobsRollupTable } from '@/components/build-log/JobsRollupTable';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getJobsRollup } from '@/lib/build-log/pipeline-state';
import { site } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Build log',
  description:
    `A live view of the agent-driven build process behind ${site.domain} — every job plan, every phase, every section the TDD pipeline has shipped or is about to ship.`,
  openGraph: {
    title: `Build log · ${site.name}`,
    description:
      `The agent-driven build process behind ${site.domain}, rendered as published content.`,
    type: 'website',
    url: '/build-log',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Build log · ${site.name}`,
    description:
      `The agent-driven build process behind ${site.domain}, rendered as published content.`,
  },
  alternates: {
    canonical: '/build-log',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Build log',
  description:
    `The agent-driven build process behind ${site.domain}, rendered as published content.`,
  url: `${site.url}/build-log`,
  isPartOf: {
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
  },
};

function firstParagraph(context: string): string {
  const para = context.split(/\n\s*\n/)[0] ?? '';
  return para.replace(/\s+/g, ' ').trim();
}

interface JobWithRollup {
  job: Job;
  rollup: JobRollupEntry;
  excerpt: string;
}

interface JobGroup {
  id: string;
  heading: string;
  blurb: string;
  items: JobWithRollup[];
}

function groupJobs(jobs: readonly Job[], rollup: readonly JobRollupEntry[]): JobGroup[] {
  const rollupBySlug = new Map(rollup.map((r) => [r.slug, r]));
  const withRollup: JobWithRollup[] = jobs
    .map((job) => {
      const r = rollupBySlug.get(job.slug);
      if (!r) return null;
      return { job, rollup: r, excerpt: firstParagraph(job.context) };
    })
    .filter((x): x is JobWithRollup => x !== null);

  const inProgress = withRollup.filter((x) => x.rollup.status === 'in-progress');
  const planned = withRollup.filter(
    (x) => x.rollup.status === 'planned' || x.rollup.status === 'unknown',
  );
  const complete = withRollup.filter((x) => x.rollup.status === 'complete');

  return [
    {
      id: 'in-progress',
      heading: 'In progress',
      blurb: 'Jobs the TDD pipeline is actively shipping features for.',
      items: inProgress,
    },
    {
      id: 'planned',
      heading: 'Planned',
      blurb: 'Jobs with a plan but no shipped features yet.',
      items: planned,
    },
    {
      id: 'complete',
      heading: 'Complete',
      blurb: 'Jobs whose features have all shipped to main.',
      items: complete,
    },
  ].filter((g) => g.items.length > 0);
}

export default async function BuildLogIndexPage() {
  const [jobs, rollup] = await Promise.all([getAllJobs(), getJobsRollup()]);
  const groups = groupJobs(jobs, rollup);

  return (
    <Bone>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Section rhythm="md" as="main">
        <Container width="wide">
          <header>
            <span className="label">Build Log</span>
            <h1 className="display-1 mt-(--space-3)">Build log</h1>
            <p className="body-1 mt-(--space-4) max-w-prose text-(--color-muted)">
              The agent-driven build process behind {site.domain}, rendered as
              published content. Every job has a plan, every plan has phases,
              every phase has features the TDD pipeline ships through.
            </p>
            <p className="mt-(--space-4)">
              <a
                href="/build-log/status"
                className="text-(--color-oxblood) underline"
              >
                See live pipeline status →
              </a>
            </p>
          </header>

          {rollup.length > 0 && (
            <div className="mt-(--space-7)">
              <JobsRollupTable rows={rollup} />
            </div>
          )}

          {groups.length === 0 ? (
            <p className="body-2 mt-(--space-7) italic text-(--color-muted)">
              No jobs have been planned yet. Initializing…
            </p>
          ) : (
            groups.map((group) => (
              <section
                key={group.id}
                aria-labelledby={`group-${group.id}`}
                className="mt-(--space-8)"
              >
                <header className="flex items-baseline justify-between gap-(--space-4) border-b border-(--edge-color) pb-(--space-2)">
                  <h2 id={`group-${group.id}`} className="display-2">
                    {group.heading}
                  </h2>
                  <span className="label tabular-nums text-(--color-muted)">
                    {group.items.length} {group.items.length === 1 ? 'job' : 'jobs'}
                  </span>
                </header>
                <p className="body-2 mt-(--space-3) text-(--color-muted)">
                  {group.blurb}
                </p>
                <ul className="mt-(--space-5) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
                  {group.items.map(({ job, rollup, excerpt }) => (
                    <li key={job.slug}>
                      <JobCard rollup={rollup} excerpt={excerpt} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </Container>
      </Section>
    </Bone>
  );
}
