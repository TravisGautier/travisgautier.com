import { Bone } from '@/components/brand/Bone';

import { sourceToPillar } from './sourceToPillar';
import { site } from '@/lib/site';

interface EmailCaptureProps {
  source: string;
}

const PROFILE_URL = site.substackProfileUrl;

export function EmailCapture({ source }: EmailCaptureProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SUBSTACK_EMBED_URL;
  const pillar = sourceToPillar(source);

  if (!baseUrl) {
    return (
      <Bone edge="subtle" className="p-(--space-5)">
        <p className="body-3">
          Email signups live on{' '}
          <a
            className="underline"
            href={PROFILE_URL}
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
    <Bone edge="subtle" className="p-(--space-5)">
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
