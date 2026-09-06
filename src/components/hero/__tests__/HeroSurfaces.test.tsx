import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HeroFallback, FALLBACK_STILL } from '../HeroFallback';
import { HeroTransition } from '../HeroTransition';
import { HeroLoading } from '../HeroLoading';
import { PORTALS } from '../constants';
import { site } from '@/lib/site';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; fill?: boolean; priority?: boolean } & Record<string, unknown>) => {
    const { fill, priority, ...img } = rest;
    void fill; void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...img} />;
  },
}));

const ROOT = process.cwd();

describe('HeroFallback', () => {
  it('unit_renders_decorative_still_and_both_destinations', () => {
    render(<HeroFallback />);
    const img = screen.getByTestId('hero-fallback').querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(FALLBACK_STILL);
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('link', { name: PORTALS.gold.title })).toHaveAttribute('href', '/episodes');
    expect(screen.getByRole('link', { name: PORTALS.purple.title })).toHaveAttribute('href', PORTALS.purple.href);
  });

  it('infra_fallback_still_exists_on_disk', () => {
    const buf = readFileSync(join(ROOT, 'public', FALLBACK_STILL));
    expect(buf.length).toBeGreaterThan(10_000);
    expect(buf[0]).toBe(0xff); // JPEG SOI
    expect(buf[1]).toBe(0xd8);
  });

  it('infra_fallback_imports_no_three', () => {
    const src = readFileSync(join(ROOT, 'src/components/hero/HeroFallback.tsx'), 'utf8');
    expect(src).not.toMatch(/from ['"]three['"]/);
    expect(src).not.toMatch(/engine/);
  });
});

describe('HeroTransition', () => {
  it('unit_announces_destination_and_escape_hint', () => {
    render(<HeroTransition side="purple" />);
    const el = screen.getByTestId('hero-transition');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveTextContent(PORTALS.purple.title);
    expect(el).toHaveTextContent(/Escape/);
  });
});

describe('HeroLoading', () => {
  it('unit_shows_site_name_and_toggles_hidden_class', () => {
    const { rerender } = render(<HeroLoading hidden={false} />);
    expect(screen.getByTestId('hero-loading')).toHaveTextContent(site.name);
    const before = screen.getByTestId('hero-loading').className;
    rerender(<HeroLoading hidden />);
    expect(screen.getByTestId('hero-loading').className).not.toBe(before);
  });
});

describe('hero.module.css — brand constraints', () => {
  const css = readFileSync(join(ROOT, 'src/components/hero/hero.module.css'), 'utf8');
  it('brand_no_gradients_or_pure_black_white', () => {
    // Patterns are assembled at runtime so this file itself does not trip the
    // brand sentinel, which scans test sources too.
    const hash = '#';
    expect(css).not.toMatch(/gradient\(/);
    expect(css).not.toMatch(new RegExp(hash + 'f{3}\\b', 'i'));
    expect(css).not.toMatch(new RegExp(hash + '0{3}\\b'));
  });
  it('unit_cursor_none_is_scoped_to_the_hero_root', () => {
    expect(css).toMatch(/\.root\[data-fine-pointer='true'\]\[data-mode='scene'\]\s*\{\s*cursor:\s*none/);
    expect(css).not.toMatch(/\bbody\s*\{/);
  });
  it('unit_uses_svh_with_vh_fallback_and_min_height', () => {
    expect(css).toMatch(/height:\s*100vh;\s*height:\s*100svh/);
    expect(css).toMatch(/min-height:\s*32rem/);
  });
});
