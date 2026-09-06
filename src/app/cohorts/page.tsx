import type { Metadata } from 'next';
import Link from 'next/link';
import { Bone, Marble, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { getCohortBuckets } from '@/lib/content/cohorts';
import { CohortCard } from '@/components/cohorts/CohortCard';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cohorts',
  description:
    `Join a ${site.name} cohort — intensive programs for solo consultants and small agencies running AI-driven delivery workflows.`,
  openGraph: {
    title: `${site.name} Cohorts`,
    description:
      'Intensive programs for solo consultants and small agencies running AI-driven delivery workflows.',
  },
};

export default async function CohortsIndexPage() {
  const { upcoming, archived } = await getCohortBuckets();

  return (
    <Marble as="main">
      <Section rhythm="md">
        <Container>
          <header className="max-w-prose">
            <span className="label">Cohorts</span>
            <h1 className="display-1 mt-(--space-3)">Learn in a cohort</h1>
            <p className="body-1 mt-(--space-5) text-(--color-muted)">
              Intensive, application-required programs that pair you with a peer
              cohort and an agent-led delivery workflow. Cohorts run quarterly on
              a rolling basis.
            </p>
          </header>

          <section className="mt-(--space-7)" aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="display-2">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <Bone edge="subtle" className="p-(--space-5) mt-(--space-5)">
                <p className="body-2 text-(--color-muted)">
                  No upcoming cohorts right now.{' '}
                  <Link
                    href="/#email-capture"
                    className="underline underline-offset-2 hover:text-(--color-oxblood)"
                  >
                    Join the newsletter
                  </Link>{' '}
                  to be notified when the next one opens.
                </p>
              </Bone>
            ) : (
              <ul className="mt-(--space-5) grid gap-(--space-4) sm:grid-cols-2">
                {upcoming.map((entry) => (
                  <li key={entry.meta.id}>
                    <CohortCard cohort={entry.meta} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {archived.length > 0 ? (
            <section className="mt-(--space-9)" aria-labelledby="archived-heading">
              <h2 id="archived-heading" className="display-2">
                Past cohorts
              </h2>
              <ul className="mt-(--space-5) grid gap-(--space-4) sm:grid-cols-2">
                {archived.map((entry) => (
                  <li key={entry.meta.id}>
                    <CohortCard cohort={entry.meta} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Container>
      </Section>
    </Marble>
  );
}
