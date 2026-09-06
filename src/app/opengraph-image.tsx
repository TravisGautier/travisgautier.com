import { ImageResponse } from 'next/og';
import { OG_SIZE, OG_CONTENT_TYPE, loadOgFonts, buildOgComposition } from '@/lib/og/og-image';
import { site } from '@/lib/site';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${site.name} — ${site.tagline}`;

export default async function Image() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    buildOgComposition({
      tag: site.heroKicker,
      titleLines: ['Build the whole', 'thing alone'],
      accent: '?',
      fontSize: 88,
    }),
    { ...size, fonts },
  );
}
