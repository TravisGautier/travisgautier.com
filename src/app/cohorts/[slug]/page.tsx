import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bone, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { getAllCohorts, getCohortBySlug } from '@/lib/content/cohorts';
import { CohortDetailHero } from '@/components/cohorts/CohortDetailHero';
import { WaitlistForm } from '@/components/cohorts/WaitlistForm';
import { publisherJsonLd } from '@/lib/site';

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
  if (!entry) {
    notFound();
    return;
  }

  const { meta, Component: MdxBody } = entry;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: meta.title,
    description: meta.summary,
    provider: publisherJsonLd(),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      startDate: meta.startDate,
      endDate: meta.endDate,
      courseWorkload: `PT${meta.commitmentHoursPerWeek}H`,
    },
    offers: {
      '@type': 'Offer',
      price: (meta.priceCents / 100).toFixed(2),
      priceCurrency: meta.currency.toUpperCase(),
      availability:
        meta.status === 'open'
          ? 'https://schema.org/InStock'
          : meta.status === 'announced'
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/SoldOut',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CohortDetailHero cohort={meta} />
      <Section rhythm="lg" as="main">
        <Container width="prose">
          <article className="build-log-prose">
            <MdxBody />
          </article>

          <section className="mt-(--space-7)" aria-labelledby="cta-heading">
            <h2 id="cta-heading" className="display-3">
              Next step
            </h2>
            <Bone edge="subtle" className="mt-(--space-5) p-(--space-5) body-2">
              {meta.status === 'announced' ? (
                <WaitlistForm cohortSlug={meta.slug} sourceTag="cohort-detail" />
              ) : meta.status === 'open' ? (
                <div>
                  <p>
                    Applications are open. Review the cohort details above,
                    then submit yours.
                  </p>
                  <p className="mt-(--space-4)">
                    <Link
                      href={`/cohorts/${meta.slug}/apply`}
                      className="inline-flex items-center gap-(--space-2) border border-(--color-oxblood) bg-(--color-oxblood) px-(--space-4) py-(--space-3) text-(--color-bone) transition-colors hover:border-(--color-ink) hover:bg-(--color-ink)"
                    >
                      Apply to this cohort
                    </Link>
                  </p>
                </div>
              ) : meta.status === 'closed' ? (
                <p>Applications are closed. Decisions go out within two weeks.</p>
              ) : meta.status === 'enrolled' ? (
                <p>This cohort is full. Join the waitlist for the next run.</p>
              ) : (
                <p>This cohort has shipped.</p>
              )}
            </Bone>
          </section>
        </Container>
      </Section>
    </>
  );
}
