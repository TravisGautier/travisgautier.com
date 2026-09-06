import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { HeroOverlay, labelOpacity } from '../HeroOverlay';
import { createHeroStore } from '../heroStore';
import { PORTALS } from '../constants';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; prefetch?: boolean } & Record<string, unknown>) => {
    const { prefetch, ...anchor } = rest;
    void prefetch;
    return <a href={href} {...anchor}>{children}</a>;
  },
}));

describe('HeroOverlay', () => {
  let store: ReturnType<typeof createHeroStore>;
  beforeEach(() => { store = createHeroStore(); });

  it('unit_labelOpacity_crossfades_between_35_and_65_percent', () => {
    expect(labelOpacity(0, 'gold')).toBe(1);
    expect(labelOpacity(0, 'purple')).toBe(0);
    expect(labelOpacity(1, 'gold')).toBe(0);
    expect(labelOpacity(1, 'purple')).toBe(1);
    expect(labelOpacity(0.5, 'gold')).toBeCloseTo(0.5);
    expect(labelOpacity(0.3, 'gold')).toBe(1);
  });

  it('unit_renders_both_destinations_with_correct_hrefs', () => {
    render(<HeroOverlay store={store} onEnter={() => {}} />);
    const work = screen.getByRole('link', { name: PORTALS.gold.title });
    expect(work).toHaveAttribute('href', '/episodes');
    const lib = screen.getByText(PORTALS.purple.title);
    expect(lib.tagName).toBe('A');
    expect(lib).toHaveAttribute('href', PORTALS.purple.href);
    expect(lib).toHaveAttribute('rel', 'noreferrer');
    expect(lib).not.toHaveAttribute('target');
  });

  it('a11y_hidden_side_is_removed_from_tab_order', () => {
    render(<HeroOverlay store={store} onEnter={() => {}} />);
    const lib = screen.getByText(PORTALS.purple.title);
    expect(lib).toHaveAttribute('tabindex', '-1');
    expect(lib).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link', { name: PORTALS.gold.title })).toHaveAttribute('tabindex', '0');
  });

  it('unit_progress_flips_labels_hint_fill_and_announcer', () => {
    render(<HeroOverlay store={store} onEnter={() => {}} />);
    expect(screen.getByTestId('hero-announcer').textContent).toBe(PORTALS.gold.announce);
    act(() => store.set({ p: 1, side: 'purple', snappedTo: 'purple' }));
    expect(screen.getByTestId('hero-announcer').textContent).toBe(PORTALS.purple.announce);
    expect(screen.getByTestId('hero-label-gold').style.opacity).toBe('0');
    expect(screen.getByTestId('hero-label-purple').style.opacity).toBe('1');
    const fill = screen.getByTestId('hero-overlay').querySelector('span[style*="width"]') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('unit_enter_affordance_only_when_dwelling_on_that_side', () => {
    render(<HeroOverlay store={store} onEnter={() => {}} />);
    const enters = screen.getAllByText('Enter →');
    expect(enters.every((e) => e.getAttribute('aria-hidden') === 'true')).toBe(true);
    act(() => store.set({ dwellReady: true, snappedTo: 'gold' }));
    const gold = screen.getByTestId('hero-label-gold').querySelector('span[aria-hidden="false"]');
    expect(gold?.textContent).toBe('Enter →');
    expect(screen.getByTestId('hero-label-purple').querySelector('span[aria-hidden="false"]')).toBeNull();
  });

  it('unit_hint_fades_after_engagement_and_swaps_copy_for_touch', () => {
    const { rerender } = render(<HeroOverlay store={store} onEnter={() => {}} />);
    expect(screen.getByText('Drag to explore')).toBeInTheDocument();
    rerender(<HeroOverlay store={store} onEnter={() => {}} coarsePointer />);
    expect(screen.getByText('Swipe to explore')).toBeInTheDocument();
    act(() => store.set({ engaged: true }));
    const hint = screen.getByText('Swipe to explore').closest('p') as HTMLElement;
    expect(hint.style.opacity).toBe('0');
    expect(hint).toHaveAttribute('aria-hidden', 'true');
  });

  it('unit_clicking_a_destination_calls_onEnter_with_side', () => {
    const onEnter = vi.fn((_side: string, e?: { preventDefault(): void }) => e?.preventDefault());
    render(<HeroOverlay store={store} onEnter={onEnter} />);
    fireEvent.click(screen.getByRole('link', { name: PORTALS.gold.title }));
    expect(onEnter).toHaveBeenCalledWith('gold', expect.anything());
  });

  it('brand_overlay_uses_site_type_utilities', () => {
    render(<HeroOverlay store={store} onEnter={() => {}} />);
    expect(screen.getByRole('link', { name: PORTALS.gold.title }).className).toMatch(/\bdisplay-3\b/);
    expect(screen.getByText(PORTALS.gold.num).className).toMatch(/\blabel\b/);
    expect(screen.getByText(PORTALS.gold.subtitle).className).toMatch(/\bbody-3\b/);
  });
});
