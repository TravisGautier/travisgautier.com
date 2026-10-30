import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

// styling-overhaul-7.6 — NotFound reskinned to the editorial brand system:
// Marble surface, Container width="prose", "404" eyebrow, display-1 heading
// with DropAccent "✕", oxblood return-home link.

describe('NotFound (brand reskin 7.6)', () => {
  // --- Unit ---

  it('unit_notfound_404_label', () => {
    const { container } = render(<NotFound />);
    const label = container.querySelector('.label');
    expect(label).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('unit_notfound_heading', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('unit_notfound_home_link_href', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: /return home/i });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /read the essays/i })).toHaveAttribute('href', '/writing');
  });

  // --- Integration (brand surface) ---

  it('int_notfound_marble_prose_surface', () => {
    const { container } = render(<NotFound />);
    expect(
      container.querySelector('[class*="bg-(--color-marble)"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[class*="max-w-prose"]'),
    ).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_notfound_h1_and_link_name', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1 }).tagName).toBe('H1');
    for (const link of screen.getAllByRole('link')) {
      expect(link.textContent!.trim().length).toBeGreaterThan(0);
    }
  });
});
