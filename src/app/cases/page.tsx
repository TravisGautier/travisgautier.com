import type { Metadata } from 'next';
import { EditorialCard, Marble, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { getAllCases } from '@/lib/content/cases';
import { CASE_STATUS_LABELS } from '@/content/schemas';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Case Studies',
  description:
    `Full documented project histories of ${site.name} client work — the proof layer behind the channel narrative.`,
};

export default async function CasesIndex() {
  const cases = await getAllCases();

  return (
    <Marble>
      <Section rhythm="md">
        <Container>
          <span className="label">Field Notes</span>
          <h1 className="display-1 mt-(--space-3)">Case Studies</h1>
          <p className="body-1 mt-(--space-4) max-w-prose text-(--color-muted)">
            Real projects, real clients, real outcomes. The structured technical
            entries that came out of each build live in The Large Language
            Library — case studies link out directly.
          </p>
          <ul className="mt-(--space-7) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
            {cases.map((caseStudy) => (
              <li key={caseStudy.meta.id}>
                <EditorialCard
                  tag={caseStudy.meta.client}
                  headline={caseStudy.meta.title}
                  subtitle={caseStudy.meta.summary}
                  accent="."
                  href={`/cases/${caseStudy.slug}`}
                  footer={
                    <span className="label">
                      {CASE_STATUS_LABELS[caseStudy.meta.status]}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </Marble>
  );
}
