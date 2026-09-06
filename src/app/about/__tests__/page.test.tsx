import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import About, { metadata } from '../page';

// styling-overhaul-7.6 — About reskinned to the editorial brand system:
// Marble surface, Section rhythm, Container width="prose", DropAccent ".",
// .build-log-prose body, LLL crosslink preserved.

describe('About (brand reskin 7.6)', () => {
  // --- Unit ---

  it('unit_about_h1_renders', () => {
    render(<About />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/travis gautier/i);
  });

  it('unit_about_eyebrow_label', () => {
    const { container } = render(<About />);
    const label = container.querySelector('.label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent(/the channel/i);
  });

  it('unit_about_premise_copy', () => {
    render(<About />);
    expect(screen.getByText(/one person/i)).toBeInTheDocument();
    expect(screen.getByText(/agent workflow/i)).toBeInTheDocument();
  });

  it('unit_about_lll_heading_and_link', () => {
    render(<About />);
    expect(
      screen.getByRole('heading', { level: 2, name: /large language library/i }),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'The Large Language Library' });
    expect(link).toHaveAttribute('href', 'https://largelanguagelibrary.ai');
  });

  // --- Integration (brand surface) ---

  it('int_about_marble_prose_surface', () => {
    const { container } = render(<About />);
    expect(
      container.querySelector('[class*="bg-(--color-marble)"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[class*="max-w-prose"]'),
    ).toBeInTheDocument();
  });

  it('int_about_build_log_prose_body', () => {
    const { container } = render(<About />);
    expect(container.querySelector('.build-log-prose')).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_about_exactly_one_h1', () => {
    render(<About />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('a11y_about_heading_hierarchy_no_skip', () => {
    const { container } = render(<About />);
    const levels = Array.from(
      container.querySelectorAll('h1, h2, h3, h4, h5, h6'),
    ).map((h) => Number(h.tagName.substring(1)));
    expect(levels).toContain(1);
    expect(levels).toContain(2);
    expect(levels.every((lv) => lv <= 2)).toBe(true);
  });

  it('a11y_about_dropaccent_decorative', () => {
    render(<About />);
    const h1 = screen.getByRole('heading', { level: 1 });
    const hidden = h1.querySelector('[aria-hidden="true"]');
    expect(hidden).toBeInTheDocument();
    expect(hidden).toHaveTextContent('.');
  });

  it('a11y_about_article_landmark', () => {
    const { container } = render(<About />);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  // --- Infrastructure (metadata) ---

  it('infra_about_metadata_title_desc', () => {
    expect(metadata.title).toBe('About');
    const desc = metadata.description as string;
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
    expect(desc).toMatch(/large language library|sister/i);
  });

  // --- Edge case ---

  it('edge_about_lll_link_absolute_https', () => {
    render(<About />);
    const href = screen
      .getByRole('link', { name: 'The Large Language Library' })
      .getAttribute('href');
    expect(href).toMatch(/^https:\/\//);
    expect(href).toContain('largelanguagelibrary.ai');
  });

  it('edge_about_sync_render', () => {
    const result = render(<About />);
    expect(result.container).toBeInstanceOf(HTMLElement);
  });

  // --- Data integrity ---

  it('data_about_metadata_shape', () => {
    expect(typeof metadata).toBe('object');
    expect(metadata).not.toBeNull();
    expect(typeof metadata.title).toBe('string');
    expect(typeof metadata.description).toBe('string');
  });
});
