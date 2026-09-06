import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PortalHero } from '../PortalHero';
import { buildQualityConfig } from '../quality';
import { PORTALS, TRANSITION_NAV_DELAY_MS } from '../constants';
import type { HeroEngine, HeroEngineOptions } from '../engine';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; prefetch?: boolean } & Record<string, unknown>) => {
    const { prefetch, ...anchor } = rest;
    void prefetch;
    return <a href={href} {...anchor}>{children}</a>;
  },
}));
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; fill?: boolean; priority?: boolean } & Record<string, unknown>) => {
    const { fill, priority, ...img } = rest;
    void fill; void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...img} />;
  },
}));

const env = { mobile: false, smallScreen: false, reducedMotion: false, lowCores: false, devicePixelRatio: 1 };
const q = (tier: number) => async () => buildQualityConfig(tier, env);

function fakeEngineModule() {
  const engines: Array<HeroEngine & { opts: HeroEngineOptions; disposed: boolean }> = [];
  const createHero = vi.fn((_host: HTMLElement, opts: HeroEngineOptions) => {
    const e = {
      opts,
      disposed: false,
      canvas: document.createElement('canvas'),
      renderer: {} as HeroEngine['renderer'],
      loop: {} as HeroEngine['loop'],
      controls: {} as HeroEngine['controls'],
      dispose() { e.disposed = true; },
      setActive() {},
      orbitBy() {},
      snapTo() {},
      step() {},
    };
    engines.push(e);
    queueMicrotask(() => opts.onReady?.());
    return e;
  });
  const loadEngine = async () => ({ createHero } as unknown as typeof import('../engine'));
  return { createHero, loadEngine, engines };
}

describe('PortalHero', () => {
  beforeEach(() => {
    push.mockClear();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('a11y_section_is_a_labelled_focusable_region_with_skip_link', () => {
    const { loadEngine } = fakeEngineModule();
    render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('data-hero-root');
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.getAttribute('aria-label')).toMatch(/The Work/);
    expect(screen.getByRole('link', { name: 'Skip the scene' })).toHaveAttribute('href', '#content');
  });

  it('unit_tier0_renders_fallback_still_and_links_without_loading_engine', async () => {
    const { createHero, loadEngine } = fakeEngineModule();
    render(<PortalHero quality={q(0)} loadEngine={loadEngine} />);
    await waitFor(() => expect(screen.getByTestId('hero-fallback')).toBeInTheDocument());
    expect(createHero).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: PORTALS.gold.title })).toHaveAttribute('href', '/episodes');
    expect(screen.getByRole('region')).toHaveAttribute('data-mode', 'fallback');
    expect(screen.queryByTestId('hero-loading')).toBeNull();
  });

  it('unit_tier2_shows_loading_then_creates_engine_and_fades_loading', async () => {
    const { createHero, loadEngine } = fakeEngineModule();
    render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    expect(screen.getByTestId('hero-loading')).toBeInTheDocument();
    await waitFor(() => expect(createHero).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('data-mode', 'scene'));
    expect(createHero.mock.calls[0][0]).toBe(screen.getByTestId('hero-canvas-host'));
    fireEvent.transitionEnd(screen.getByTestId('hero-loading'));
    expect(screen.queryByTestId('hero-loading')).toBeNull();
    expect(screen.getByTestId('hero-cursor')).toBeInTheDocument();
  });

  it('unit_unmount_disposes_engine', async () => {
    const { engines, loadEngine } = fakeEngineModule();
    const { unmount } = render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    await waitFor(() => expect(engines).toHaveLength(1));
    unmount();
    expect(engines[0].disposed).toBe(true);
  });

  it('err_engine_throw_falls_back_to_still', async () => {
    const loadEngine = async () => ({ createHero: () => { throw new Error('no gl'); } } as unknown as typeof import('../engine'));
    render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    await waitFor(() => expect(screen.getByTestId('hero-fallback')).toBeInTheDocument());
  });

  it('unit_context_lost_shows_restore_which_recreates_engine', async () => {
    const { engines, loadEngine, createHero } = fakeEngineModule();
    render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    await waitFor(() => expect(engines).toHaveLength(1));
    act(() => engines[0].opts.onContextLost?.());
    expect(screen.getByTestId('hero-context-lost')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    await waitFor(() => expect(createHero).toHaveBeenCalledTimes(2));
    expect(engines[0].disposed).toBe(true);
  });

  it('unit_portal_activation_shows_transition_then_navigates_gold_via_router', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { engines, loadEngine } = fakeEngineModule();
    render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    await vi.waitFor(() => expect(engines).toHaveLength(1));
    act(() => engines[0].opts.onPortalActivate?.('gold'));
    expect(screen.getByTestId('hero-transition')).toHaveTextContent(PORTALS.gold.title);
    act(() => { vi.advanceTimersByTime(TRANSITION_NAV_DELAY_MS + 10); });
    expect(push).toHaveBeenCalledWith('/episodes');
  });

  it('unit_escape_cancels_pending_navigation', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { engines, loadEngine } = fakeEngineModule();
    render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    await vi.waitFor(() => expect(engines).toHaveLength(1));
    act(() => engines[0].opts.onPortalActivate?.('gold'));
    fireEvent.keyDown(screen.getByRole('region'), { key: 'Escape' });
    expect(screen.queryByTestId('hero-transition')).toBeNull();
    act(() => { vi.advanceTimersByTime(TRANSITION_NAV_DELAY_MS + 10); });
    expect(push).not.toHaveBeenCalled();
  });

  it('unit_purple_uses_full_page_navigation_to_the_library', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    const { engines, loadEngine } = fakeEngineModule();
    render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    await vi.waitFor(() => expect(engines).toHaveLength(1));
    act(() => engines[0].opts.onPortalActivate?.('purple'));
    act(() => { vi.advanceTimersByTime(TRANSITION_NAV_DELAY_MS + 10); });
    expect(assign).toHaveBeenCalledWith(PORTALS.purple.href);
    expect(push).not.toHaveBeenCalled();
  });

  it('unit_coarse_pointer_hides_custom_cursor', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const { loadEngine } = fakeEngineModule();
    render(<PortalHero quality={q(2)} loadEngine={loadEngine} />);
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('data-mode', 'scene'));
    expect(screen.queryByTestId('hero-cursor')).toBeNull();
    expect(screen.getByRole('region')).toHaveAttribute('data-fine-pointer', 'false');
    expect(screen.getByText('Swipe to explore')).toBeInTheDocument();
  });
});
