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
import { Footer } from '../Footer';

const FOOTER_SOURCE = readFileSync(
  join(process.cwd(), 'src/components/site/Footer.tsx'),
  'utf8',
);

describe('Footer', () => {
  // ─── Unit: Parchment surface + top edge rule ─────────────────────────

  it('unit_footer_parchment_surface', () => {
    render(<Footer />);
    const ci = screen.getByRole('contentinfo');
    expect(ci.className).toMatch(/bg-\(--color-parchment\)/);
    expect(ci.className).toMatch(/text-\(--pair-text-on-parchment\)/);
  });

  it('unit_footer_top_edge_rule', () => {
    render(<Footer />);
    const ci = screen.getByRole('contentinfo');
    expect(ci.className).toMatch(/border-t\s+border-\(--edge-color\)/);
    // Legacy `border-mist` rule must be gone
    expect(ci.className).not.toMatch(/border-mist/);
  });

  // ─── Unit: container layout ──────────────────────────────────────────

  it('unit_footer_container_layout_classes', () => {
    const { container } = render(<Footer />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
    expect(inner!.className).toMatch(/py-\(--space-6\)/);
    expect(inner!.className).toMatch(/\bflex\b/);
    expect(inner!.className).toMatch(/\bflex-col\b/);
    expect(inner!.className).toMatch(/gap-\(--space-4\)/);
    expect(inner!.className).toMatch(/md:flex-row/);
    expect(inner!.className).toMatch(/md:items-end/);
    expect(inner!.className).toMatch(/md:justify-between/);
    // Legacy paddings/margins must be gone
    expect(inner!.className).not.toMatch(/\bpy-12\b/);
    expect(inner!.className).not.toMatch(/\bgap-8\b/);
  });

  // ─── Unit: Logo + Home link ──────────────────────────────────────────

  it('unit_footer_renders_logo_component', () => {
    render(<Footer />);
    expect(screen.getByLabelText('Travis Gautier')).toBeInTheDocument();
  });

  it('unit_footer_home_link_wraps_logo', () => {
    render(<Footer />);
    const home = screen.getByRole('link', { name: 'Travis Gautier' });
    expect(home).toHaveAttribute('href', '/');
    expect(home.className).toMatch(/inline-flex/);
  });

  it('unit_footer_logo_size_sm', () => {
    render(<Footer />);
    // size='sm' → wordmark fontSize is 1rem (per Logo's sizeScale.sm.wordmark)
    const wordmark = screen.getByText('TRAVIS GAUTIER');
    expect(wordmark).toBeInTheDocument();
    const style = (wordmark as HTMLElement).style;
    expect(style.fontSize).toBe('1rem');
  });

  // ─── Unit: Left column layout ────────────────────────────────────────

  it('unit_footer_left_column_layout', () => {
    render(<Footer />);
    const tagline = screen.getByText(
      'One person. An agent team. Full SaaS delivery.',
    );
    const leftCol = tagline.parentElement;
    expect(leftCol).not.toBeNull();
    expect(leftCol!.className).toMatch(/\bflex\b/);
    expect(leftCol!.className).toMatch(/\bflex-col\b/);
    expect(leftCol!.className).toMatch(/gap-\(--space-2\)/);
  });

  // ─── Unit: Tagline ───────────────────────────────────────────────────

  it('unit_footer_tagline_uses_body_3_utility', () => {
    render(<Footer />);
    const tagline = screen.getByText(
      'One person. An agent team. Full SaaS delivery.',
    );
    expect(tagline.className).toMatch(/\bbody-3\b/);
    expect(tagline.className).not.toMatch(/text-muted/);
    expect(tagline.className).not.toMatch(/\btext-sm\b/);
  });

  it('unit_footer_tagline_text_preserved', () => {
    render(<Footer />);
    expect(
      screen.getByText('One person. An agent team. Full SaaS delivery.'),
    ).toBeInTheDocument();
  });

  // ─── Unit: Right column layout ───────────────────────────────────────

  it('unit_footer_right_column_layout', () => {
    render(<Footer />);
    const label = screen.getByText('Sister Project');
    const rightCol = label.parentElement;
    expect(rightCol).not.toBeNull();
    expect(rightCol!.className).toMatch(/\bflex\b/);
    expect(rightCol!.className).toMatch(/\bflex-col\b/);
    expect(rightCol!.className).toMatch(/items-start/);
    expect(rightCol!.className).toMatch(/md:items-end/);
    expect(rightCol!.className).toMatch(/gap-\(--space-1\)/);
  });

  // ─── Unit: Sister Project label ──────────────────────────────────────

  it('unit_footer_sister_project_label', () => {
    render(<Footer />);
    const label = screen.getByText('Sister Project');
    expect(label.tagName).toBe('SPAN');
    expect(label.className).toMatch(/\blabel\b/);
  });

  // ─── Unit: LLL link classes (default, layout, hover) ─────────────────

  it('unit_footer_lll_link_default_colors', () => {
    render(<Footer />);
    const lll = screen.getByRole('link', { name: /largelanguagelibrary\.ai/i });
    expect(lll.className).toMatch(/bg-\(--color-bone\)/);
    expect(lll.className).toMatch(/text-\(--color-verdigris\)/);
    expect(lll.className).toMatch(/\bborder\b/);
    expect(lll.className).toMatch(/border-\(--edge-color-subtle\)/);
  });

  it('unit_footer_lll_link_padding_and_flex', () => {
    render(<Footer />);
    const lll = screen.getByRole('link', { name: /largelanguagelibrary\.ai/i });
    expect(lll.className).toMatch(/inline-flex/);
    expect(lll.className).toMatch(/items-center/);
    expect(lll.className).toMatch(/gap-\(--space-2\)/);
    expect(lll.className).toMatch(/px-\(--space-3\)/);
    expect(lll.className).toMatch(/py-\(--space-1\)/);
  });

  it('unit_footer_lll_link_hover_inversion', () => {
    render(<Footer />);
    const lll = screen.getByRole('link', { name: /largelanguagelibrary\.ai/i });
    expect(lll.className).toMatch(/transition-colors/);
    expect(lll.className).toMatch(/duration-150/);
    expect(lll.className).toMatch(/hover:bg-\(--color-verdigris\)/);
    expect(lll.className).toMatch(/hover:text-\(--color-bone\)/);
  });

  // ─── Unit: LLL link content (arrow glyph + text) ─────────────────────

  it('unit_footer_lll_link_arrow_glyph', () => {
    render(<Footer />);
    const lll = screen.getByRole('link', { name: /largelanguagelibrary\.ai/i });
    const arrow = lll.querySelector('span[aria-hidden="true"]');
    expect(arrow).not.toBeNull();
    expect(arrow!.textContent).toBe('→');
  });

  it('unit_footer_lll_link_text', () => {
    render(<Footer />);
    expect(screen.getByText('largelanguagelibrary.ai')).toBeInTheDocument();
  });

  // ─── Integration ─────────────────────────────────────────────────────

  it('int_footer_uses_container', () => {
    const { container } = render(<Footer />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
  });

  it('int_footer_uses_parchment_via_role', () => {
    render(<Footer />);
    // The contentinfo landmark element IS the Parchment surface — confirms
    // <Parchment as="footer"> was composed (not adjacent / not nested).
    const ci = screen.getByRole('contentinfo');
    expect(ci.tagName).toBe('FOOTER');
    expect(ci.className).toMatch(/bg-\(--color-parchment\)/);
  });

  it('int_footer_left_column_contains_logo_link_and_tagline', () => {
    render(<Footer />);
    const tagline = screen.getByText(
      'One person. An agent team. Full SaaS delivery.',
    );
    const leftCol = tagline.parentElement!;
    // Both the home link and the tagline live under the same wrapper
    const homeLink = leftCol.querySelector('a[href="/"]');
    expect(homeLink).not.toBeNull();
    expect(leftCol.contains(tagline)).toBe(true);
  });

  it('int_footer_right_column_contains_label_and_lll_link', () => {
    render(<Footer />);
    const label = screen.getByText('Sister Project');
    const rightCol = label.parentElement!;
    const lll = rightCol.querySelector(
      'a[href="https://largelanguagelibrary.ai"]',
    );
    expect(lll).not.toBeNull();
    expect(rightCol.contains(label)).toBe(true);
  });

  // ─── Accessibility ───────────────────────────────────────────────────

  it('a11y_footer_contentinfo_landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('a11y_footer_logo_accessible_name', () => {
    render(<Footer />);
    expect(screen.getByLabelText('Travis Gautier')).toBeInTheDocument();
  });

  it('a11y_footer_home_link_accessible_name', () => {
    render(<Footer />);
    const home = screen.getByRole('link', { name: 'Travis Gautier' });
    expect(home).toHaveAccessibleName('Travis Gautier');
  });

  it('a11y_footer_arrow_glyph_aria_hidden', () => {
    render(<Footer />);
    const lll = screen.getByRole('link', { name: /largelanguagelibrary\.ai/i });
    const arrow = lll.querySelector('span[aria-hidden="true"]');
    expect(arrow).not.toBeNull();
    expect(arrow!.getAttribute('aria-hidden')).toBe('true');
  });

  it('a11y_footer_external_link_rel', () => {
    render(<Footer />);
    const lll = screen.getByRole('link', { name: /largelanguagelibrary\.ai/i });
    expect(lll).toHaveAttribute('target', '_blank');
    expect(lll).toHaveAttribute('rel', 'noreferrer');
  });

  // ─── Edge ────────────────────────────────────────────────────────────

  it('edge_footer_renders_without_props', () => {
    const first = render(<Footer />);
    const firstHtml = first.container.innerHTML;
    first.unmount();
    const second = render(<Footer />);
    expect(second.container.innerHTML).toBe(firstHtml);
  });

  it('edge_footer_single_lll_link_only', () => {
    render(<Footer />);
    const ci = screen.getByRole('contentinfo');
    const lllLinks = ci.querySelectorAll(
      'a[href="https://largelanguagelibrary.ai"]',
    );
    expect(lllLinks.length).toBe(1);
  });

  // ─── Data integrity ──────────────────────────────────────────────────

  it('data_footer_lll_url_stable', () => {
    render(<Footer />);
    const lll = screen.getByRole('link', { name: /largelanguagelibrary\.ai/i });
    expect(lll.getAttribute('href')).toBe('https://largelanguagelibrary.ai');
  });

  it('data_footer_lll_external_link_attrs', () => {
    render(<Footer />);
    const lll = screen.getByRole('link', { name: /largelanguagelibrary\.ai/i });
    expect(lll).toHaveAttribute('target', '_blank');
    expect(lll).toHaveAttribute('rel', 'noreferrer');
  });

  // ─── Infrastructure (source assertions) ──────────────────────────────

  it('infra_footer_no_legacy_classes_in_source', () => {
    expect(FOOTER_SOURCE).not.toMatch(/\bmt-24\b/);
    expect(FOOTER_SOURCE).not.toMatch(/\bborder-mist\b/);
    expect(FOOTER_SOURCE).not.toMatch(/\bpy-12\b/);
    expect(FOOTER_SOURCE).not.toMatch(/\btext-accent\b/);
    expect(FOOTER_SOURCE).not.toMatch(/\btext-muted\b/);
    expect(FOOTER_SOURCE).not.toMatch(/\btext-foreground\b/);
    expect(FOOTER_SOURCE).not.toMatch(/\bfont-display\b/);
    expect(FOOTER_SOURCE).not.toMatch(/\btext-lg\b/);
    expect(FOOTER_SOURCE).not.toMatch(/\bfont-semibold\b/);
    expect(FOOTER_SOURCE).not.toMatch(/hover:underline/);
    expect(FOOTER_SOURCE).not.toMatch(/underline-offset-2/);
  });

  it('infra_footer_no_legacy_brand_mark_string', () => {
    // The legacy inline brand mark string used 'fabled<span ...>10x</span>'.
    // The restyle uses the Logo component — the source should NOT contain
    // these literal substrings anymore.
    expect(FOOTER_SOURCE).not.toMatch(/fabled<span/);
    expect(FOOTER_SOURCE).not.toMatch(/>10x</);
  });

  it('infra_footer_imports_brand_components', () => {
    expect(FOOTER_SOURCE).toMatch(
      /import\s*\{\s*Parchment\s*\}\s*from\s*['"]@\/components\/brand\/Parchment['"]/,
    );
    expect(FOOTER_SOURCE).toMatch(
      /import\s*\{\s*Logo\s*\}\s*from\s*['"]@\/components\/brand\/Logo['"]/,
    );
  });
});
