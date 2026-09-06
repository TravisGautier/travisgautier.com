import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Bone, Section, Parchment } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import { PhaseNav } from '@/components/build-log/PhaseNav';
import { getAllJobs, getJobBySlug, getJobPhase } from '@/lib/build-log/jobs';
import { site, publisherJsonLd } from '@/lib/site';

export const dynamicParams = false;

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  const tuples: { slug: string; phase: string }[] = [];
  for (const job of jobs) {
    for (const phase of job.phases) {
      tuples.push({ slug: job.slug, phase: phase.slug });
    }
  }
  return tuples;
}

function phaseTitleOf(ph: {
  slug: string;
  header: { title?: string; phaseNumber?: number };
}): string {
  return ph.header.title && ph.header.phaseNumber !== undefined
    ? `Phase ${ph.header.phaseNumber}: ${ph.header.title}`
    : ph.slug;
}

function phaseDescription(
  ph: { header: { totalSize?: string } },
  jobTitle: string,
): string {
  return ph.header.totalSize ?? `Phase document for ${jobTitle}.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; phase: string }>;
}): Promise<Metadata> {
  const { slug, phase } = await params;
  const job = await getJobBySlug(slug);
  const ph = job?.phases.find((p) => p.slug === phase);
  if (!job || !ph) return {};
  const phaseTitle = phaseTitleOf(ph);
  const title = `${phaseTitle} · ${job.title}`;
  const description = phaseDescription(ph, job.title);
  const url = `/build-log/jobs/${slug}/${phase}`;
  return {
    title,
    description,
    openGraph: {
      title: phaseTitle,
      description,
      type: 'article',
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: phaseTitle,
      description,
    },
    alternates: { canonical: url },
  };
}

export default async function PhasePage({
  params,
}: {
  params: Promise<{ slug: string; phase: string }>;
}) {
  const { slug, phase } = await params;
  const [job, ph] = await Promise.all([
    getJobBySlug(slug),
    getJobPhase(slug, phase),
  ]);
  if (!job || !ph) {
    notFound();
    return;
  }

  const phaseTitle = phaseTitleOf(ph);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${phaseTitle} · ${job.title}`,
    description: phaseDescription(ph, job.title),
    url: `${site.url}/build-log/jobs/${slug}/${phase}`,
    author: publisherJsonLd(),
    isPartOf: {
      '@type': 'TechArticle',
      name: job.title,
      url: `${site.url}/build-log/jobs/${slug}`,
    },
  };

  return (
    <Bone>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Section rhythm="lg" as="main">
        <Container width="prose">
          <nav className="mb-(--space-5)">
            <Link
              href="/build-log"
              className="label text-(--color-oxblood) hover:underline"
            >
              Build log
            </Link>
            {' · '}
            <Link
              href={`/build-log/jobs/${job.slug}`}
              className="label text-(--color-oxblood) hover:underline"
            >
              {job.title}
            </Link>
          </nav>
          <header>
            <span className="label">Phase</span>
            <h1 className="display-1 mt-(--space-3)">{phaseTitle}</h1>
            {(ph.header.totalSize || ph.header.prerequisites) && (
              <dl className="body-2 mt-(--space-4) text-(--color-muted) space-y-(--space-1)">
                {ph.header.totalSize && (
                  <div>
                    <dt className="inline label text-(--color-ink)">
                      Total size{' '}
                    </dt>
                    <dd className="inline">{ph.header.totalSize}</dd>
                  </div>
                )}
                {ph.header.prerequisites && (
                  <div>
                    <dt className="inline label text-(--color-ink)">
                      Prerequisites{' '}
                    </dt>
                    <dd className="inline">{ph.header.prerequisites}</dd>
                  </div>
                )}
              </dl>
            )}
          </header>
          <div className="mt-(--space-7)">
            <PhaseNav
              jobSlug={job.slug}
              phases={job.phases}
              activePhaseSlug={ph.slug}
            />
          </div>
          <Parchment edge="strong" className="mt-(--space-7) p-(--space-6)">
            <MarkdownDocument body={ph.body} />
          </Parchment>
        </Container>
      </Section>
    </Bone>
  );
}
