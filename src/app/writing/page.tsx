import type { Metadata } from 'next';
import { EditorialCard, Marble, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { formatEssayDate, getEssays } from '@/lib/substack/feed';
import { personJsonLd, site, substackLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Writing',
  description:
    `${site.substackName}: essays on running an agent team for real clients, the pipeline behind it, and the business of forward deployed freelance work.`,
  alternates: { canonical: '/writing' },
  openGraph: {
    title: `Writing · ${site.name}`,
    description: `${site.substackName}, the essays behind the channel.`,
    type: 'website',
    url: '/writing',
  },
};

export default async function WritingIndex() {
  const essays = await getEssays();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: site.substackName,
    url: site.substackPublicationUrl,
    author: personJsonLd(),
    blogPost: essays.map((e) => ({
      '@type': 'BlogPosting',
      headline: e.title,
      description: e.subtitle,
      url: e.url,
      datePublished: e.publishedAt,
      author: personJsonLd(),
    })),
  };

  return (
    <Marble>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Section rhythm="md">
        <Container>
          <span className="label">Essays</span>
          <h1 className="display-1 mt-(--space-3)">Writing</h1>
          <p className="body-1 mt-(--space-4) max-w-prose text-(--color-muted)">
            {site.substackName} is the long form behind the channel: how the
            agent team runs on real client work, what each piece of the pipeline
            does and why it exists, and what the business side of this looks like
            when you are the whole company. Free, in your inbox, every few days.
          </p>
          <div className="mt-(--space-5) max-w-lg">
            <EmailCapture source="writing-index" />
          </div>

          {essays.length === 0 ? (
            <p className="body-2 mt-(--space-7) text-(--color-muted)">
              The essay list is loading from Substack.{' '}
              <a
                className="underline"
                href={substackLink('/archive', { medium: 'site', content: 'writing-empty' })}
              >
                Read the archive there
              </a>
              .
            </p>
          ) : (
            <ul className="mt-(--space-7) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
              {essays.map((essay) => (
                <li key={essay.url}>
                  <EditorialCard
                    tag={formatEssayDate(essay.publishedAt) || 'Essay'}
                    headline={essay.title}
                    subtitle={essay.subtitle || undefined}
                    accent="."
                    href={substackLink(`/p/${essay.slug}`, {
                      medium: 'site',
                      campaign: 'writing-index',
                      content: essay.slug,
                    })}
                  />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </Marble>
  );
}
