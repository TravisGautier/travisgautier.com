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

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Header } from '../Header';

const mockUsePathname = vi.mocked(usePathname);

const HEADER_SOURCE = readFileSync(
  join(process.cwd(), 'src/components/site/Header.tsx'),
  'utf8',
);

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  // ─── Unit: brand mark ──────────────────────────────────────────────

  it('unit_header_renders_logo_component', () => {
    // 9.7: the mark is the HeaderLogo composite; its accessible name is
    // carried by the wrapping link, announced once as "Travis Gautier".
    render(<Header />);
    expect(
      screen.getByRole('link', { name: 'Travis Gautier' }),
    ).toBeInTheDocument();
  });

  it('unit_header_home_link_wraps_logo', () => {
    render(<Header />);
    const home = screen.getByRole('link', { name: 'Travis Gautier' });
    expect(home).toHaveAttribute('href', '/');
  });

  // ─── Unit: Marble surface ──────────────────────────────────────────

  it('unit_header_marble_surface', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    expect(banner.className).toMatch(/bg-\(--color-marble\)/);
    expect(banner.className).toMatch(/text-\(--pair-text-on-marble\)/);
  });

  it('unit_header_marble_edge_rule', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    expect(banner.className).toMatch(/border-b\s+border-\(--edge-color\)/);
    // Legacy `border-mist` rule must be gone
    expect(banner.className).not.toMatch(/border-mist/);
  });

  // ─── Unit: container & layout ──────────────────────────────────────

  it('unit_header_container_uses_space_padding', () => {
    const { container } = render(<Header />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
    expect(inner!.className).toMatch(/py-\(--space-4\)/);
    expect(inner!.className).toMatch(/flex/);
    expect(inner!.className).toMatch(/items-center/);
    expect(inner!.className).toMatch(/justify-between/);
    // Legacy fixed height is gone
    expect(inner!.className).not.toMatch(/\bh-16\b/);
  });

  it('unit_header_nav_ul_gap_token', () => {
    render(<Header />);
    const ul = screen.getByRole('navigation').querySelector('ul');
    expect(ul).not.toBeNull();
    expect(ul!.className).toMatch(/gap-\(--space-5\)/);
    expect(ul!.className).toMatch(/items-center/);
    expect(ul!.className).not.toMatch(/\bgap-8\b/);
  });

  // ─── Unit: NAV_ITEMS preservation ──────────────────────────────────

  it('unit_header_nav_items_count_preserved', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    const items = nav.querySelectorAll('li');
    expect(items).toHaveLength(6);
  });

  it('unit_header_nav_hrefs', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Episodes' })).toHaveAttribute(
      'href',
      '/episodes',
    );
    expect(screen.getByRole('link', { name: 'Cases' })).toHaveAttribute('href', '/cases');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });

  it('unit_header_has_build_log_link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('href', '/build-log');
  });

  it('unit_header_build_log_label_capitalized', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Build Log' })).toBeInTheDocument();
    // The lowercase legacy form must be gone
    expect(screen.queryByRole('link', { name: 'Build log' })).toBeNull();
  });

  it('unit_header_has_products_link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Products' });
    expect(link).toHaveAttribute('href', '/products');
  });

  it('unit_header_nav_includes_cohorts', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Cohorts' });
    expect(link).toHaveAttribute('href', '/cohorts');
  });

  // ─── Integration ───────────────────────────────────────────────────

  it('int_header_uses_container', () => {
    const { container } = render(<Header />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
  });

  it('int_header_nav_items_use_label_utility', () => {
    render(<Header />);
    const navLinks = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'));
    // Every nav link must carry the `.label` utility class (from so-2.2)
    expect(navLinks.length).toBe(6);
    navLinks.forEach((link) => {
      expect(link.className).toMatch(/\blabel\b/);
    });
  });

  it('int_header_active_on_build_log', () => {
    mockUsePathname.mockReturnValue('/build-log');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('int_header_active_on_nested_build_log', () => {
    mockUsePathname.mockReturnValue('/build-log/jobs/website-foundation');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('int_header_not_active_on_other_routes', () => {
    mockUsePathname.mockReturnValue('/episodes');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  // ─── Accessibility ─────────────────────────────────────────────────

  it('a11y_header_banner_landmark_preserved', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('a11y_header_nav_aria_label_preserved', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Primary');
  });

  it('a11y_header_logo_accessible_name', () => {
    // 9.7: exactly one accessible-named element — the home link. The pfp is
    // decorative (alt="") and Logo's inner parts are aria-hidden, so the
    // name is announced once, not duplicated.
    render(<Header />);
    expect(
      screen.getAllByRole('link', { name: 'Travis Gautier' }),
    ).toHaveLength(1);
  });

  it('a11y_header_nav_list', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    const ul = nav.querySelector('ul');
    expect(ul).toBeInTheDocument();
    const lis = ul!.querySelectorAll('li');
    expect(lis.length).toBeGreaterThanOrEqual(3);
  });

  it('a11y_header_nav_build_log_has_label', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAccessibleName('Build Log');
  });

  it('a11y_header_nav_aria_current_when_active', () => {
    mockUsePathname.mockReturnValue('/build-log/status');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  // ─── Data integrity ────────────────────────────────────────────────

  it('data_header_nav_items_shape', () => {
    render(<Header />);
    const links = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'));
    const items = links.map((link) => ({
      href: link.getAttribute('href'),
      label: link.textContent,
    }));
    expect(items).toEqual([
      { href: '/episodes', label: 'Episodes' },
      { href: '/cases', label: 'Cases' },
      { href: '/build-log', label: 'Build Log' },
      { href: '/cohorts', label: 'Cohorts' },
      { href: '/products', label: 'Products' },
      { href: '/about', label: 'About' },
    ]);
  });

  // ─── Edge ──────────────────────────────────────────────────────────

  it('edge_header_active_state_with_null_pathname', () => {
    mockUsePathname.mockReturnValue(null as unknown as string);
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  // ─── Infra ─────────────────────────────────────────────────────────

  it('infra_header_no_legacy_classes', () => {
    expect(HEADER_SOURCE).not.toMatch(/border-mist/);
    expect(HEADER_SOURCE).not.toMatch(/\btext-accent\b/);
    expect(HEADER_SOURCE).not.toMatch(/\btext-muted\b/);
    expect(HEADER_SOURCE).not.toMatch(/\btext-foreground\b/);
    expect(HEADER_SOURCE).not.toMatch(/\bh-16\b/);
  });

  it('infra_header_nav_ordering', () => {
    render(<Header />);
    const links = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'))
      .map((el) => el.getAttribute('href'));
    const buildLogIdx = links.indexOf('/build-log');
    const cohortsIdx = links.indexOf('/cohorts');
    const productsIdx = links.indexOf('/products');
    expect(cohortsIdx).toBeGreaterThan(buildLogIdx);
    expect(cohortsIdx).toBeLessThan(productsIdx);
  });

  // ─── so-4.2 ratification pins ──────────────────────────────────────
  //
  // Hybrid red-phase posture (per so-5.3 EmailCapture precedent): the
  // tests above PRESERVE behavior shipped via so-4.1/4.4/5.4 side
  // effects. The tests below add the so-4.2-specific ratifications
  // that pin each planning-doc decision so the chrome cannot silently
  // regress.

  // unit: brand-surface ratification

  it('unit_header_carries_marble_texture_utility', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    expect(banner.className).toMatch(/\bbg-marble-texture\b/);
  });

  it('unit_header_renders_headerlogo_composite', () => {
    // 9.7: Header delegates its mark to the HeaderLogo composite (pfp +
    // <Logo size="sm">), not an inline typed Logo. The composite itself is
    // locked in HeaderLogo.test.tsx.
    expect(HEADER_SOURCE).toMatch(/<HeaderLogo\s*\/>/);
    expect(HEADER_SOURCE).not.toMatch(/<Logo\b/);
  });

  it('unit_header_nav_items_exported_as_const', () => {
    // Source-grep: NAV_ITEMS declared with `as const`
    expect(HEADER_SOURCE).toMatch(/NAV_ITEMS\s*=\s*\[[\s\S]*?\]\s*as\s+const/);
  });

  it('unit_header_is_rsc_no_use_client', () => {
    // Header must be a React Server Component — no client boundary
    expect(HEADER_SOURCE).not.toMatch(/^\s*['"]use client['"]/);
  });

  it('unit_header_no_hover_underline_in_source', () => {
    expect(HEADER_SOURCE).not.toMatch(/hover:underline/);
  });

  it('unit_header_marble_edge_uses_edge_color_token', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    // Already covered at the class level by unit_header_marble_edge_rule;
    // this pin asserts the design-system token resolution path is the
    // canonical --edge-color, not an ad-hoc hex or a different token.
    expect(banner.className).toMatch(/border-\(--edge-color\)/);
    expect(banner.className).not.toMatch(/border-\(--color-ink\)/);
  });

  it('unit_header_logo_link_is_inline_flex', () => {
    render(<Header />);
    const home = screen.getByRole('link', { name: 'Travis Gautier' });
    expect(home.className).toMatch(/\binline-flex\b/);
  });

  it('unit_header_no_inline_style_attr', () => {
    // No inline style= JSX prop — every style goes through Tailwind utility
    // classes resolved against the brand token system.
    expect(HEADER_SOURCE).not.toMatch(/\sstyle\s*=\s*\{/);
  });

  // integration: per-route active-state matrix
  //
  // The existing int_header_active_on_build_log + nested + not_active tests
  // cover only the Build Log route. Every other NAV_ITEMS route is locked
  // here at the integration scope so the per-route assertion isn't trusting
  // the NavLink unit suite alone.

  it('int_header_active_on_episodes', () => {
    mockUsePathname.mockReturnValue('/episodes');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Episodes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Cases' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('int_header_active_on_cases', () => {
    mockUsePathname.mockReturnValue('/cases');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Cases' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Episodes' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('int_header_active_on_cohorts', () => {
    mockUsePathname.mockReturnValue('/cohorts');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Cohorts' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Products' }),
    ).not.toHaveAttribute('aria-current', 'page');
  });

  it('int_header_active_on_products', () => {
    mockUsePathname.mockReturnValue('/products');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Cohorts' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('int_header_active_on_about', () => {
    mockUsePathname.mockReturnValue('/about');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('int_header_active_on_nested_cohort_slug', () => {
    mockUsePathname.mockReturnValue('/cohorts/q2-agent-kickoff');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Cohorts' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('int_header_active_on_nested_product_slug', () => {
    mockUsePathname.mockReturnValue('/products/account');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('int_header_active_on_nested_episode_slug', () => {
    mockUsePathname.mockReturnValue('/episodes/intro-to-agent-loops');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Episodes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  // accessibility

  it('a11y_header_exactly_one_link_aria_current_per_route', () => {
    mockUsePathname.mockReturnValue('/cases');
    render(<Header />);
    const navLinks = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'));
    const currentLinks = navLinks.filter(
      (el) => el.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(1);
  });

  it('a11y_header_zero_aria_current_when_off_nav', () => {
    mockUsePathname.mockReturnValue('/login');
    render(<Header />);
    const navLinks = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'));
    const currentLinks = navLinks.filter(
      (el) => el.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(0);
  });

  it('a11y_header_nav_inside_banner', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    const nav = banner.querySelector('nav[aria-label="Primary"]');
    expect(nav).not.toBeNull();
  });

  // infrastructure (source-grep + globals.css resolution)

  it('infra_header_uses_brand_barrel_import', () => {
    // Marble must come from the brand barrel, not an individual file. The
    // typed Logo no longer lives in Header (9.7) — it moved into the
    // HeaderLogo composite — so Header imports Marble alone.
    expect(HEADER_SOURCE).toMatch(
      /import\s*\{[^}]*\bMarble\b[^}]*\}\s*from\s*['"]@\/components\/brand['"]/,
    );
    // Negative: no individual-file imports, and no stray Logo import here
    expect(HEADER_SOURCE).not.toMatch(/from\s+['"]@\/components\/brand\/Marble['"]/);
    expect(HEADER_SOURCE).not.toMatch(/\bLogo\b/);
  });

  it('infra_header_no_legacy_palette_tokens', () => {
    // Full placeholder-palette name set from website-foundation-1.3
    expect(HEADER_SOURCE).not.toMatch(/\b(ember|steel|mist|signal)\b/);
  });

  it('infra_header_marble_texture_class_resolves_in_globals_css', () => {
    const globalsCss = readFileSync(
      join(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(globalsCss).toMatch(/@utility\s+bg-marble-texture\b/);
  });

  it('infra_header_edge_color_resolves_in_globals_css', () => {
    const globalsCss = readFileSync(
      join(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(globalsCss).toMatch(/--edge-color:\s*[^;]+;/);
  });

  it('infra_header_label_utility_resolves', () => {
    const globalsCss = readFileSync(
      join(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    // .label utility shipped by so-2.2 type-scale
    expect(globalsCss).toMatch(/\.label\s*\{/);
  });

  it('infra_header_no_gradient_classes', () => {
    // Tailwind gradient utility families forbidden by brand discipline
    expect(HEADER_SOURCE).not.toMatch(/\bbg-gradient-/);
    expect(HEADER_SOURCE).not.toMatch(/\bfrom-(slate|gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/);
    expect(HEADER_SOURCE).not.toMatch(/\bvia-(slate|gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/);
    expect(HEADER_SOURCE).not.toMatch(/\bto-(slate|gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/);
  });

  it('infra_header_no_shadow_classes', () => {
    // Brand discipline forbids UI shadows on the chrome
    expect(HEADER_SOURCE).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner|drop-shadow)/);
    expect(HEADER_SOURCE).not.toMatch(/\bdrop-shadow-/);
    expect(HEADER_SOURCE).not.toMatch(/\bbox-shadow-/);
  });

  // edge cases

  it('edge_header_active_substring_not_match', () => {
    mockUsePathname.mockReturnValue('/products-roadmap');
    render(<Header />);
    expect(
      screen.getByRole('link', { name: 'Products' }),
    ).not.toHaveAttribute('aria-current', 'page');
  });

  it('edge_header_pathname_with_query', () => {
    // next/navigation usePathname() strips query strings — Cases activates on bare /cases
    mockUsePathname.mockReturnValue('/cases');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Cases' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('edge_header_root_pathname_no_nav_active', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Header />);
    const navLinks = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'));
    const currentLinks = navLinks.filter(
      (el) => el.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(0);
  });

  it('edge_header_deeply_nested_path', () => {
    mockUsePathname.mockReturnValue(
      '/build-log/jobs/website-foundation/phase-3',
    );
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Build Log' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  // data integrity

  it('data_header_nav_items_no_duplicate_hrefs', () => {
    render(<Header />);
    const hrefs = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'))
      .map((el) => el.getAttribute('href') as string);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('data_header_nav_items_labels_match_planning_doc_canonical_strings', () => {
    render(<Header />);
    const labels = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'))
      .map((el) => el.textContent);
    expect(new Set(labels)).toEqual(
      new Set(['Episodes', 'Cases', 'Build Log', 'Cohorts', 'Products', 'About']),
    );
  });

  it('data_header_nav_items_cohorts_position', () => {
    render(<Header />);
    const hrefs = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'))
      .map((el) => el.getAttribute('href') as string);
    const buildLog = hrefs.indexOf('/build-log');
    const cohorts = hrefs.indexOf('/cohorts');
    const products = hrefs.indexOf('/products');
    expect(buildLog).toBeGreaterThanOrEqual(0);
    expect(cohorts).toBeGreaterThan(buildLog);
    expect(products).toBeGreaterThan(cohorts);
  });
});
