import type { CSSProperties } from 'react';
import { site } from '@/lib/site';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  mono?: boolean;
  className?: string;
}

const sizeScale: Record<NonNullable<LogoProps['size']>, { wordmark: string; mark: string; gap: string }> = {
  sm: { wordmark: '1rem',   mark: '0.875rem', gap: '0.25rem' },
  md: { wordmark: '1.5rem', mark: '1.25rem',  gap: '0.375rem' },
  lg: { wordmark: '2.5rem', mark: '2rem',     gap: '0.5rem' },
};

export function Logo({ size = 'md', mono = false, className = '' }: LogoProps) {
  const s = sizeScale[size];
  const wordmarkColor = mono ? 'currentColor' : 'var(--color-ink)';
  const markColor = mono ? 'currentColor' : 'var(--color-oxblood)';

  const wordmarkStyle: CSSProperties = {
    fontFamily: 'var(--font-display), serif',
    fontWeight: 900,
    fontSize: s.wordmark,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: wordmarkColor,
    lineHeight: 1,
  };

  const markStyle: CSSProperties = {
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    fontWeight: 500,
    fontSize: s.mark,
    color: markColor,
    lineHeight: 1,
  };

  return (
    <span
      className={`inline-flex items-baseline ${className}`}
      style={{ gap: s.gap }}
      aria-label={site.name}
    >
      <span style={wordmarkStyle} aria-hidden="true">TRAVIS GAUTIER</span>
      <span style={markStyle} aria-hidden="true">{'{tg}'}</span>
    </span>
  );
}
