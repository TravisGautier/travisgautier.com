import Link from 'next/link';
import type { Metadata } from 'next';
import { Marble, Section, DropAccent } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { personJsonLd, site, substackLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    `The ${site.name} premise, the channel, the essays, and the sister project — The Large Language Library.`,
  alternates: { canonical: '/about' },
};

export default function About() {
  const jsonLd = { '@context': 'https://schema.org', ...personJsonLd() };

  return (
    <Marble as="article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Section rhythm="lg">
        <Container width="prose">
          <span className="label">The Channel</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph=".">{site.name}</DropAccent>
          </h1>
          <div className="mt-(--space-7) build-log-prose">
            <p>
              This channel is the documented real-world answer to a question every
              technical freelancer is asking: what can one person actually ship
              when they manage a team of AI agents the way a senior tech lead
              manages a dev team?
            </p>
            <p>
              The channel is the answer in progress. Real clients. Real
              deliverables. Real case studies — end to end, not demos. The site
              you&apos;re reading is itself part of the exhibit: it was built and
              is maintained by the same agent workflow being documented on the
              channel.
            </p>
            <h2>The essays</h2>
            <p>
              The long form lives at{' '}
              <a href={substackLink('/', { medium: 'site', content: 'about-essays' })}>
                {site.substackName}
              </a>
              : how the agent team runs on real client work, what each piece of
              the pipeline does and why it exists, and what the business side
              looks like when you are the whole company. The index is at{' '}
              <Link href="/writing">/writing</Link>.
            </p>
            <h2>The Large Language Library</h2>
            <p>
              {site.name} built and champions{' '}
              <Link href="https://largelanguagelibrary.ai">
                The Large Language Library
              </Link>
              , the open, AI-optimized knowledge base of solved technical
              problems that comes out of every client engagement. {site.name} is
              the brand; LLL is the infrastructure. The tool is bigger than the
              brand that built it — that&apos;s intentional.
            </p>
          </div>
          <div className="mt-(--space-7)">
            <EmailCapture source="about-cta" />
          </div>
        </Container>
      </Section>
    </Marble>
  );
}
