import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { site } from '@/lib/site';

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

// Brand tokens — mirror src/app/globals.css @theme. Inline hex (not CSS vars)
// because Satori resolves neither tokens nor var(). All four are warm brand
// values, never the pure black/white/red literals the brand sentinel bans.
export const OG_COLORS = {
  shadow: '#2A2520',
  marble: '#F7F4EC',
  ink: '#1C1814',
  oxblood: '#6B2020',
} as const;

// Brushstroke-seam approximation. Satori supports clip-path: polygon() but not
// mask-image or SVG filters; irregular vertices read as a torn marble edge at
// OG scale (1200x630).
export const BRUSHSTROKE_CLIP =
  'polygon(0 0, 92% 0, 100% 6%, 96% 18%, 100% 28%, 94% 42%, 100% 56%, 95% 70%, 100% 82%, 93% 94%, 100% 100%, 0 100%)';

export function scaleTitle(title: string): number {
  const len = title.length;
  if (len <= 24) return 72;
  if (len <= 40) return 60;
  if (len <= 60) return 50;
  return 42;
}

export interface OgFont {
  name: string;
  data: Buffer;
  weight: 400 | 700 | 900;
  style: 'normal';
}

export async function loadOgFonts(): Promise<OgFont[]> {
  const [cinzel, interBold, interRegular] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/Cinzel-Black.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Inter-Bold.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Inter-Regular.ttf')),
  ]);
  return [
    { name: 'Cinzel', data: cinzel, weight: 900, style: 'normal' },
    { name: 'Inter Bold', data: interBold, weight: 700, style: 'normal' },
    { name: 'Inter Regular', data: interRegular, weight: 400, style: 'normal' },
  ];
}

export interface OgComposition {
  tag: string;
  titleLines: string[];
  accent: string;
  fontSize: number;
}

export function buildOgComposition({
  tag,
  titleLines,
  accent,
  fontSize,
}: OgComposition): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: OG_COLORS.shadow,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '62%',
          height: '100%',
          background: OG_COLORS.marble,
          padding: '56px 72px',
          justifyContent: 'space-between',
          clipPath: BRUSHSTROKE_CLIP,
        }}
      >
        <span
          style={{
            fontFamily: 'Inter Bold',
            fontSize: 24,
            color: OG_COLORS.oxblood,
            letterSpacing: 5,
            textTransform: 'uppercase',
          }}
        >
          {tag}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {titleLines.map((line, i) => (
            <span
              key={i}
              style={{
                display: 'flex',
                fontFamily: 'Cinzel',
                fontSize,
                color: OG_COLORS.ink,
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                lineHeight: 1.05,
              }}
            >
              {line}
              {i === titleLines.length - 1 ? (
                <span
                  style={{
                    color: OG_COLORS.oxblood,
                    fontSize: Math.round(fontSize * 1.5),
                  }}
                >
                  {accent}
                </span>
              ) : null}
            </span>
          ))}
        </div>
        <span
          style={{
            fontFamily: 'Inter Regular',
            fontSize: 20,
            color: OG_COLORS.ink,
            opacity: 0.7,
          }}
        >
          {site.domain}
        </span>
      </div>
    </div>
  );
}
