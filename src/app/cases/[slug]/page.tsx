import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { DropAccent, Marble, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { LllCrosslinks } from '@/components/crosslinks/LllCrosslinks';
import { getAllCases, getCaseBySlug } from '@/lib/content/cases';
import { getAllEpisodes } from '@/lib/content/episodes';
import { CASE_STATUS_LABELS } from '@/content/schemas';
import { publisherJsonLd } from '@/lib/site';

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
  const { meta } = entry;
  return {
    title: meta.title,
    description: meta.summary,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      images: meta.heroImageUrl ? [meta.heroImageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.summary,
    },
  };
}

function formatIsoDate(iso: string | undefined): string {
  if (!iso) return '';
  const slice = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : '';
}

function formatEngagement(
  startedAt: string | undefined,
  shippedAt: string | undefined,
): string {
  const start = formatIsoDate(startedAt);
  const end = formatIsoDate(shippedAt);
  if (start && end) return `${start} → ${end}`;
  if (start) return `${start} → Ongoing`;
  if (end) return end;
  return 'Ongoing';
}

export default async function CaseDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getCaseBySlug(slug);
  if (!entry) {
    notFound();
    return;
  }

  const { meta, Component } = entry;
  const allEpisodes = await getAllEpisodes();
  const relatedEpisodes = allEpisodes.filter((ep) =>
    meta.relatedEpisodeIds.includes(ep.meta.id),
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: meta.title,
    description: meta.summary,
    creator: publisherJsonLd(),
    about: meta.client,
  };

  return (
    <Marble>
      <Section rhythm="lg">
        <Container as="article" width="prose">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <span className="label">
            {CASE_STATUS_LABELS[meta.status]} · {meta.client}
          </span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="." size="large">
              {meta.title}
            </DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">
            {meta.summary}
          </p>

          <aside className="mt-(--space-6) border-t border-b border-(--edge-color) py-(--space-4)">
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-(--space-4)">
              <div>
                <dt className="label">Client</dt>
                <dd className="body-2 mt-(--space-1)">{meta.client}</dd>
              </div>
              <div>
                <dt className="label">Engagement</dt>
                <dd className="body-2 mt-(--space-1)">
                  {formatEngagement(meta.startedAt, meta.shippedAt)}
                </dd>
              </div>
              <div>
                <dt className="label">Status</dt>
                <dd className="label mt-(--space-1)">
                  {CASE_STATUS_LABELS[meta.status]}
                </dd>
              </div>
            </dl>
          </aside>

          <section className="mt-(--space-7) border-t border-(--edge-color) pt-(--space-5)">
            <h2 className="display-3">The problem</h2>
            <p className="body-1 mt-(--space-3) text-(--color-muted)">
              {meta.problem}
            </p>
          </section>

          <section className="mt-(--space-7) border-t border-(--edge-color) pt-(--space-5)">
            <h2 className="display-3">Deliverables</h2>
            <ul className="body-1 mt-(--space-3) list-disc pl-(--space-6) text-(--color-muted)">
              {meta.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-(--space-7) border-t border-(--edge-color) pt-(--space-5)">
            <h2 className="display-3">Outcome</h2>
            <p className="body-1 mt-(--space-3) text-(--color-muted)">
              {meta.outcome}
            </p>
          </section>

          <div className="build-log-prose mt-(--space-7) border-t border-(--edge-color) pt-(--space-7)">
            <Component />
          </div>

          {relatedEpisodes.length > 0 && (
            <section className="mt-(--space-8) border-t border-(--edge-color) pt-(--space-5)">
              <h2 className="display-3">Episodes</h2>
              <ul className="body-2 mt-(--space-4)">
                {relatedEpisodes.map((ep) => (
                  <li key={ep.meta.id} className="mt-(--space-2)">
                    <Link
                      href={`/episodes/${ep.slug}`}
                      className="border-b border-(--color-oxblood) pb-(--space-1) text-(--color-oxblood)"
                    >
                      {ep.meta.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {meta.lllEntryUrls.length > 0 && (
            <LllCrosslinks
              urls={meta.lllEntryUrls}
              className="mt-(--space-8) border-t border-(--edge-color) pt-(--space-5)"
            />
          )}

          <section className="mt-(--space-8) border-t border-(--edge-color) pt-(--space-5)">
            <span className="label">Stay in the loop</span>
            <h2 className="display-3 mt-(--space-3)">New work, no spam.</h2>
            <div className="mt-(--space-5)">
              <EmailCapture source={`case-${meta.slug}`} />
            </div>
          </section>
        </Container>
      </Section>
    </Marble>
  );
}
