import Image from 'next/image';
import {
  Bone,
  DropAccent,
  EditorialCard,
  HeroBackdrop,
  Section,
  SectionDivider,
} from '@/components/brand';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { getLatestEpisode } from '@/lib/content/episodes';
import { site } from '@/lib/site';

const LIBRARY = [
  {
    tag: 'Catalog',
    headline: 'Episodes',
    subtitle: 'Flagship series, playbooks, shorts, livestreams.',
    href: '/episodes',
  },
  {
    tag: 'Field Notes',
    headline: 'Case Studies',
    subtitle: 'Production builds with research, decisions, outcomes.',
    href: '/cases',
  },
  {
    tag: 'In Progress',
    headline: 'Build Log',
    subtitle: "Every job's plan, phases, and post-mortem.",
    href: '/build-log',
  },
  {
    tag: 'Storefront',
    headline: 'Products',
    subtitle: 'Toolkits, templates, and cohort programs.',
    href: '/products',
  },
];

export default async function Home() {
  const latest = await getLatestEpisode();

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-(--edge-color-subtle)">
        <Image
          src="/hero/floatbg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
          className="-z-10 object-cover object-right opacity-35 mix-blend-multiply pointer-events-none select-none"
        />
        <HeroBackdrop />
        <Section rhythm="lg">
          <Container className="flex flex-col gap-(--space-5) md:max-w-prose">
            <span className="label">{site.heroKicker}</span>
            <h1 className="display-1">
              One person.<br />
              An agent team.<br />
              Full SaaS delivery.
            </h1>
            <p className="body-1 text-(--color-muted)">
              A documented real-world case study of using AI agent teams to run
              a legitimate software consulting business. Real clients, real
              money, real deliverables.
            </p>
            <EmailCapture source="homepage-hero" />
          </Container>
        </Section>
      </section>

      {latest && (
        <>
          <SectionDivider top="var(--color-marble)" bottom="var(--color-parchment)" />
          <Section rhythm="md" className="bg-(--color-parchment)">
            <Container>
              <span className="label">Latest Episode</span>
              <div className="mt-(--space-4)">
                <EditorialCard
                  tag={`${latest.meta.series} · Act ${latest.meta.act}`}
                  headline={latest.meta.title}
                  subtitle={latest.meta.summary || undefined}
                  accent="?"
                  href={`/episodes/${latest.slug}`}
                />
              </div>
            </Container>
          </Section>
          <SectionDivider top="var(--color-parchment)" bottom="var(--color-marble)" />
        </>
      )}

      <Section rhythm="md">
        <Container>
          <h2 className="display-2">The library</h2>
          <ul className="mt-(--space-5) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
            {LIBRARY.map((entry) => (
              <li key={entry.href}>
                <EditorialCard
                  tag={entry.tag}
                  headline={entry.headline}
                  subtitle={entry.subtitle}
                  href={entry.href}
                />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <SectionDivider top="var(--color-marble)" bottom="var(--color-bone)" />

      <Bone>
        <Section rhythm="md">
          <Container width="prose" className="text-center">
            <span className="label">Sister Project</span>
            <h2 className="display-2 mt-(--space-3)">
              <DropAccent glyph="→">The Large Language Library</DropAccent>
            </h2>
            <p className="body-1 mt-(--space-4) text-(--color-muted)">
              Our public, AI-optimized knowledge base. Every episode here links
              out to entries there.
            </p>
            <a
              href="https://largelanguagelibrary.ai"
              target="_blank"
              rel="noreferrer"
              className="mt-(--space-5) inline-block label text-(--color-verdigris) border-b border-(--color-verdigris) pb-(--space-1)"
            >
              largelanguagelibrary.ai →
            </a>
          </Container>
        </Section>
      </Bone>
    </>
  );
}
