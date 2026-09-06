import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Bone, Section, Parchment } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import { PhaseNav } from '@/components/build-log/PhaseNav';
import { getAllJobs, getJobBySlug } from '@/lib/build-log/jobs';
import { site, publisherJsonLd } from '@/lib/site';

export const dynamicParams = false;

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  return jobs.map((j) => ({ slug: j.slug }));
}

function jobDescription(job: { context: string; title: string }): string {
  const firstLine = job.context.split('\n')[0] ?? '';
  return firstLine.slice(0, 160) || job.title;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};
  const description = jobDescription(job);
  const url = `/build-log/jobs/${slug}`;
  return {
    title: `${job.title} · Build log`,
    description,
    openGraph: {
      title: job.title,
      description,
      type: 'article',
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: job.title,
      description,
    },
    alternates: { canonical: url },
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) {
    notFound();
    return;
  }

  const description = jobDescription(job);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: job.title,
    description,
    url: `${site.url}/build-log/jobs/${slug}`,
    author: publisherJsonLd(),
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'Build log',
      url: `${site.url}/build-log`,
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
              ← Back to build log
            </Link>
          </nav>
          <header>
            <span className="label">Build Log</span>
            <h1 className="display-1 mt-(--space-3)">{job.title}</h1>
            {job.alias && (
              <p className="body-2 mt-(--space-3) text-(--color-muted)">
                Alias{' '}
                <code className="font-mono text-(--color-ink)">{job.alias}</code>
              </p>
            )}
          </header>
          <div className="mt-(--space-7)">
            <PhaseNav jobSlug={job.slug} phases={job.phases} />
          </div>
          <Parchment edge="strong" className="mt-(--space-7) p-(--space-6)">
            <MarkdownDocument body={job.readmeBody} />
          </Parchment>
        </Container>
      </Section>
    </Bone>
  );
}
