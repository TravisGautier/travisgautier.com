import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { HeaderLogo } from '../HeaderLogo';

const SOURCE = readFileSync(
  join(process.cwd(), 'src/components/site/HeaderLogo.tsx'),
  'utf8',
);

describe('HeaderLogo', () => {
  it('unit_headerlogo_renders_single_home_link', () => {
    render(<HeaderLogo />);
    const link = screen.getByRole('link', { name: 'Travis Gautier' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('a11y_headerlogo_one_combined_aria_label', () => {
    // 9.7: screen readers announce "Travis Gautier, link" once — pfp is
    // decorative (alt=""), Logo's inner parts are aria-hidden.
    render(<HeaderLogo />);
    expect(
      screen.getAllByRole('link', { name: 'Travis Gautier' }),
    ).toHaveLength(1);
  });

  it('unit_headerlogo_pfp_is_decorative', () => {
    // pfp uses alt="" → no accessible image role surfaced to AT
    render(<HeaderLogo />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('unit_headerlogo_uses_logo_size_sm', () => {
    // Composite uses the small typed Logo beside the pfp, not md/lg
    expect(SOURCE).toMatch(/<Logo\s+size=["']sm["']\s*\/>/);
  });

  it('unit_headerlogo_renders_channel_pfp', () => {
    expect(SOURCE).toMatch(/\/media\/pfp-circle-white\.jpg/);
    expect(SOURCE).toMatch(/alt=["']["']/); // decorative
  });

  it('unit_headerlogo_uses_tap_min_floor', () => {
    // 9.6 touch-target floor on the composite wrapper
    expect(SOURCE).toMatch(/min-h-\(--tap-min\)/);
  });

  it('unit_headerlogo_gap_between_pfp_and_wordmark', () => {
    // Tighter than Container padding so the parts read as one mark
    expect(SOURCE).toMatch(/gap-\(--space-2\)/);
  });

  it('infra_headerlogo_imports_logo_primitive', () => {
    expect(SOURCE).toMatch(
      /import\s*\{[^}]*\bLogo\b[^}]*\}\s*from\s*['"]@\/components\/brand\/Logo['"]/,
    );
  });
});
