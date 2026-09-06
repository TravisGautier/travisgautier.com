import { ImageResponse } from 'next/og';
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  loadOgFonts,
  buildOgComposition,
  scaleTitle,
} from '@/lib/og/og-image';
import { getCaseBySlug } from '@/lib/content/cases';
import { site } from '@/lib/site';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getCaseBySlug(slug);
  const fonts = await loadOgFonts();

  if (!entry) {
    return new ImageResponse(
      buildOgComposition({
        tag: 'Case',
        titleLines: [site.name],
        accent: '.',
        fontSize: 72,
      }),
      { ...size, fonts },
    );
  }

  const { meta } = entry;
  return new ImageResponse(
    buildOgComposition({
      tag: `Case · ${meta.client}`,
      titleLines: [meta.title],
      accent: '.',
      fontSize: scaleTitle(meta.title),
    }),
    { ...size, fonts },
  );
}
