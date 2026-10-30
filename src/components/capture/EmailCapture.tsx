import { Bone } from '@/components/brand/Bone';

import { sourceToPillar } from './sourceToPillar';
import { site, substackLink } from '@/lib/site';

interface EmailCaptureProps {
  source: string;
  /** One line above the form naming what the reader gets. Pass null to omit. */
  blurb?: string | null;
}

export const DEFAULT_BLURB =
  `${site.substackName}: the essays behind the channel, free, every few days.`;

/** Set NEXT_PUBLIC_SUBSTACK_EMBED_URL=off to fall back to a plain link. */
export function resolveEmbedUrl(): string | null {
  const env = process.env.NEXT_PUBLIC_SUBSTACK_EMBED_URL;
  if (env === 'off') return null;
  return env || site.substackEmbedUrl;
}

export function EmailCapture({ source, blurb = DEFAULT_BLURB }: EmailCaptureProps) {
  const baseUrl = resolveEmbedUrl();
  const pillar = sourceToPillar(source);

  if (!baseUrl) {
    return (
      <Bone edge="subtle" className="p-(--space-5)">
        <p className="body-3">
          {blurb ? `${blurb} ` : ''}Subscribe on{' '}
          <a
            className="underline"
            href={substackLink('/subscribe', {
              medium: 'site',
              campaign: `pillar:${pillar}`,
              content: source,
            })}
            target="_blank"
            rel="noopener noreferrer"
            data-source={source}
            data-pillar={pillar}
          >
            Substack
          </a>
          .
        </p>
      </Bone>
    );
  }

  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', site.domain);
  url.searchParams.set('utm_medium', 'embed');
  url.searchParams.set('utm_campaign', `pillar:${pillar}`);
  url.searchParams.set('utm_content', source);

  return (
    <Bone edge="subtle" className="p-(--space-5) flex flex-col gap-(--space-3)">
      {blurb && <p className="body-3 text-(--color-muted)">{blurb}</p>}
      <iframe
        src={url.toString()}
        title={`Subscribe to ${site.name} on Substack`}
        loading="lazy"
        className="block w-full min-h-[150px] bg-(--color-bone) border-0"
        data-source={source}
        data-pillar={pillar}
      />
    </Bone>
  );
}
