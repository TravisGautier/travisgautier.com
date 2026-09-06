import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BrushstrokeSeam, DropAccent } from '@/components/brand';
import { toAccentGlyph } from './glyphs';
import { site } from '@/lib/site';

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  title: 'Build the whole thing alone',
  series: 'Zero to 10x',
  tier: 'FLAGSHIP',
  photo: '/hero/floatbg.png',
};

interface ThumbPreviewPageProps {
  searchParams: Promise<{
    title?: string;
    series?: string;
    tier?: string;
    accent?: string;
    photo?: string;
  }>;
}

export default async function ThumbPreviewPage({ searchParams }: ThumbPreviewPageProps) {
  if (process.env.NODE_ENV !== 'development') return notFound();

  const sp = await searchParams;
  const title = sp.title ?? DEFAULTS.title;
  const series = sp.series ?? DEFAULTS.series;
  const tier = sp.tier ?? DEFAULTS.tier;
  const accent = toAccentGlyph(sp.accent);
  const photo = sp.photo ?? DEFAULTS.photo;

  return (
    <div
      className="bg-(--color-shadow)"
      style={{ width: '1280px', height: '720px', overflow: 'hidden' }}
    >
      <BrushstrokeSeam
        direction="left"
        feather="12rem"
        foreground="var(--color-marble)"
        background="var(--color-shadow)"
        backgroundContent={
          <Image
            src={photo}
            alt=""
            aria-hidden="true"
            fill
            sizes="1280px"
            className="object-cover opacity-95"
          />
        }
      >
        <div
          style={{
            width: '1280px',
            height: '720px',
            padding: '72px 88px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-(--space-4)">
            <span className="label text-(--color-oxblood) text-2xl">{tier}</span>
            <span className="mono text-(--color-ink)">·</span>
            <span className="label text-(--color-ink) text-xl">{series}</span>
          </div>

          <h1
            className="display-1"
            style={{ fontSize: '120px', lineHeight: 1.02, maxWidth: '900px' }}
          >
            <DropAccent glyph={accent} size="thumbnail">
              {title}
            </DropAccent>
          </h1>

          <span className="label text-(--color-ink) opacity-70">{site.domain}</span>
        </div>
      </BrushstrokeSeam>
    </div>
  );
}
