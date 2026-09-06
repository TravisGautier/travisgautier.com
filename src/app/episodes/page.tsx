import type { Metadata } from 'next';
import { EditorialCard, Marble, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { getAllEpisodes } from '@/lib/content/episodes';
import { toRoman } from '@/lib/format/roman';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Episodes',
  description:
    `The full ${site.name} episode archive — flagship series, playbooks, shorts, and livestreams.`,
};

export default async function EpisodesIndex() {
  const episodes = await getAllEpisodes();

  return (
    <Marble>
      <Section rhythm="md">
        <Container>
          <span className="label">Catalog</span>
          <h1 className="display-1 mt-(--space-3)">Episodes</h1>
          <p className="body-1 mt-(--space-4) text-(--color-muted) max-w-prose">
            Every episode from the channel, with full show notes, source
            materials, and outbound crosslinks to structured knowledge entries
            in The Large Language Library.
          </p>
          <ul className="mt-(--space-7) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
            {episodes.map((episode) => {
              const actRoman = toRoman(episode.meta.act);
              const epRoman = toRoman(episode.meta.episodeNumber);
              const tag = `${episode.meta.series} · ${actRoman}.${epRoman}`;
              return (
                <li key={episode.meta.id}>
                  <EditorialCard
                    tag={tag}
                    headline={episode.meta.title}
                    subtitle={episode.meta.summary}
                    accent="?"
                    href={`/episodes/${episode.slug}`}
                  />
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>
    </Marble>
  );
}
