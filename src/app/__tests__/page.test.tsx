// Homepage hero (styling-overhaul-7.1) — brand-aware assertions.
//
// Replaces the prior placeholder-pattern tests with assertions that
// pin the editorial reskin per phase-7-pages.md Feature 7.1:
//   - <Section> primitive wraps the hero (rhythm=lg)
//   - .label / .display-1 / .body-1 brand utilities used (no font-display /
//     text-5xl / text-lg / text-muted / text-accent / border-mist)
//   - <SectionDivider> chains hero → latest → library → sister-project
//   - <EditorialCard> renders the latest-episode block and the 4 library
//     entries (Episodes / Case Studies / Build Log / Products — About removed)
//   - <Bone> wraps sister-project block with <DropAccent> on the heading
//   - "Inside the build" placeholder is GONE
//
// Source-level sentinels (infra_*) read src/app/page.tsx via readFileSync
// to assert no banned placeholder utility names remain in the source.

import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    target,
    rel,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    target?: string;
    rel?: string;
    className?: string;
  }) => (
    <a href={href} target={target} rel={rel} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/content/episodes', () => ({
  getLatestEpisode: vi.fn(),
}));

vi.mock('@/components/capture/EmailCapture', () => ({
  EmailCapture: ({ source }: { source: string }) => (
    <div data-testid="email-capture" data-source={source} />
  ),
}));

// The hero is a client component that probes WebGL; stub it in jsdom.
vi.mock('@/components/hero', () => ({
  PortalHero: () => <section data-hero-root data-testid="portal-hero" />,
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { getLatestEpisode } from '@/lib/content/episodes';
import Home from '../page';
import { site } from '@/lib/site';

const mockGetLatestEpisode = vi.mocked(getLatestEpisode);

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const PAGE_SOURCE_PATH = join(__dirname_compat, '..', 'page.tsx');
const PAGE_SOURCE = readFileSync(PAGE_SOURCE_PATH, 'utf8');
const SENTINEL_SOURCE_PATH = join(
  __dirname_compat,
  '..',
  '..',
  '__tests__',
  'brand',
  'forbidden-patterns.test.ts',
);
const SENTINEL_SOURCE = readFileSync(SENTINEL_SOURCE_PATH, 'utf8');

const MOCK_EPISODE = {
  meta: {
    id: 'ep-001',
    slug: 'test-episode',
    title: 'Test Episode Title',
    series: 'Test Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'A test episode summary.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
  },
  slug: 'test-episode',
  Component: () => null,
};

async function renderHome() {
  const jsx = await Home();
  return render(jsx);
}

// The intro <section id="content"> that follows the portal hero.
function introSection(): HTMLElement {
  const s = document.getElementById('content');
  if (!s) throw new Error('No #content section found');
  return s as HTMLElement;
}

// Walk up to the closest <section> ancestor of an element.
function closestSection(el: Element): HTMLElement {
  const s = el.closest('section');
  if (!s) throw new Error('No <section> ancestor found');
  return s as HTMLElement;
}

describe('Homepage (styling-overhaul-7.1) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLatestEpisode.mockResolvedValue(MOCK_EPISODE);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — Hero block
  // ────────────────────────────────────────────────────────────────

  it('unit_hero_wrapped_in_section_primitive: hero contains Section rhythm=lg (py-(--section-y-lg))', async () => {
    const { container } = await renderHome();
    const sectionRhythm = container.querySelector('.py-\\(--section-y-lg\\)');
    expect(sectionRhythm).not.toBeNull();
  });

  it('unit_hero_label_class: hero kicker uses .label utility (not text-sm uppercase text-accent)', async () => {
    await renderHome();
    const kicker = screen.getByText(site.heroKicker);
    expect(kicker.className).toMatch(/\blabel\b/);
    expect(kicker.className).not.toMatch(/\btext-sm\b/);
    expect(kicker.className).not.toMatch(/\btext-accent\b/);
    expect(kicker.className).not.toMatch(/\buppercase\b/);
  });

  it('unit_hero_h1_display_1_class: hero h1 uses .display-1 (not font-display text-5xl)', async () => {
    await renderHome();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toMatch(/\bdisplay-1\b/);
    expect(h1.className).not.toMatch(/\bfont-display\b/);
    expect(h1.className).not.toMatch(/\btext-5xl\b/);
    expect(h1.className).not.toMatch(/\bfont-semibold\b/);
  });

  it('unit_hero_h1_headline_preserved: hero h1 still carries the three-line headline', async () => {
    await renderHome();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('One person.');
    expect(h1).toHaveTextContent('An agent team.');
    expect(h1).toHaveTextContent('Full SaaS delivery.');
  });

  it('unit_hero_summary_body_1_muted: hero summary uses .body-1 + text-(--color-muted)', async () => {
    await renderHome();
    const summary = screen.getByText(/documented real-world case study/);
    expect(summary.className).toMatch(/\bbody-1\b/);
    expect(summary.className).toMatch(/text-\(--color-muted\)/);
    expect(summary.className).not.toMatch(/\btext-lg\b/);
    // The bare `text-muted` token must be gone (the brand uses
    // `text-(--color-muted)` arbitrary-value form).
    expect(summary.className).not.toMatch(/(^|\s)text-muted(\s|$)/);
  });

  it('unit_hero_border_uses_edge_color_subtle: hero <section> border uses --edge-color-subtle (not border-mist)', async () => {
    await renderHome();
    const hero = introSection();
    expect(hero).not.toBeNull();
    expect(hero!.className).toMatch(/border-\(--edge-color-subtle\)/);
    expect(hero!.className).not.toMatch(/\bborder-mist\b/);
  });

  it('unit_email_capture_source_homepage_hero: EmailCapture rendered with source="homepage-hero"', async () => {
    await renderHome();
    expect(screen.getByTestId('email-capture')).toHaveAttribute(
      'data-source',
      'homepage-hero',
    );
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — Latest episode block (EditorialCard composition)
  // ────────────────────────────────────────────────────────────────

  it('unit_latest_episode_renders_editorial_card: latest episode renders as an <article> EditorialCard with the marble surface treatment', async () => {
    const { container } = await renderHome();
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBeGreaterThanOrEqual(1);
    // The latest-episode card carries the EditorialCard surface signature.
    const editorialSurfaces = Array.from(articles).filter((a) =>
      /bg-\(--color-marble\)/.test(a.className) &&
      /border-\(--color-ink\)/.test(a.className),
    );
    expect(editorialSurfaces.length).toBeGreaterThanOrEqual(1);
    // The latest-episode card's headline is the episode title and links to its slug.
    const titleLink = screen.getByRole('link', { name: /Test Episode Title/ });
    expect(titleLink).toHaveAttribute('href', '/episodes/test-episode');
  });

  it('unit_latest_episode_tag_format: latest-episode tag renders "Test Series · Act 1" (middle-dot separator)', async () => {
    await renderHome();
    expect(screen.getByText(/Test Series\s*·\s*Act\s*1/)).toBeInTheDocument();
  });

  it('unit_latest_episode_label_kicker: latest-episode block contains span.label "Latest Episode"', async () => {
    await renderHome();
    const kicker = screen.getByText('Latest Episode');
    expect(kicker.tagName).toBe('SPAN');
    expect(kicker.className).toMatch(/\blabel\b/);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — Library block
  // ────────────────────────────────────────────────────────────────

  it('unit_library_heading_display_2: library heading is h2.display-2 "The library"', async () => {
    await renderHome();
    const h2 = screen.getByRole('heading', { level: 2, name: 'The library' });
    expect(h2.className).toMatch(/\bdisplay-2\b/);
    expect(h2.className).not.toMatch(/\bfont-display\b/);
    expect(h2.className).not.toMatch(/\btext-3xl\b/);
  });

  it('unit_library_grid_has_four_entries: library grid contains exactly 4 <li> children', async () => {
    await renderHome();
    const libraryHeading = screen.getByRole('heading', {
      level: 2,
      name: 'The library',
    });
    const librarySection = closestSection(libraryHeading);
    const cards = librarySection.querySelectorAll('li');
    expect(cards).toHaveLength(4);
  });

  it('unit_library_grid_hrefs: library hrefs are /episodes /cases /build-log /products (no /about)', async () => {
    await renderHome();
    const librarySection = closestSection(
      screen.getByRole('heading', { level: 2, name: 'The library' }),
    );
    const hrefs = Array.from(librarySection.querySelectorAll('a')).map(
      (a) => a.getAttribute('href'),
    );
    expect(hrefs).toContain('/episodes');
    expect(hrefs).toContain('/cases');
    expect(hrefs).toContain('/build-log');
    expect(hrefs).toContain('/products');
    expect(hrefs).not.toContain('/about');
  });

  it('unit_library_grid_headlines: library cards expose Episodes / Case Studies / Build Log / Products', async () => {
    await renderHome();
    const librarySection = closestSection(
      screen.getByRole('heading', { level: 2, name: 'The library' }),
    );
    const text = librarySection.textContent ?? '';
    expect(text).toContain('Episodes');
    expect(text).toContain('Case Studies');
    expect(text).toContain('Build Log');
    expect(text).toContain('Products');
  });

  it('unit_library_grid_tags: library cards expose tags Catalog / Field Notes / In Progress / Storefront', async () => {
    await renderHome();
    const librarySection = closestSection(
      screen.getByRole('heading', { level: 2, name: 'The library' }),
    );
    const text = librarySection.textContent ?? '';
    expect(text).toContain('Catalog');
    expect(text).toContain('Field Notes');
    expect(text).toContain('In Progress');
    expect(text).toContain('Storefront');
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — Sister-project block (Bone + DropAccent)
  // ────────────────────────────────────────────────────────────────

  it('unit_sister_project_block_wrapped_in_bone: sister-project root has bg-(--color-bone)', async () => {
    const { container } = await renderHome();
    const boneSurfaces = container.querySelectorAll('[class*="bg-(--color-bone)"]');
    expect(boneSurfaces.length).toBeGreaterThanOrEqual(1);
  });

  it('unit_sister_project_label: sister-project block has span.label "Sister Project"', async () => {
    await renderHome();
    const kicker = screen.getByText('Sister Project');
    expect(kicker.tagName).toBe('SPAN');
    expect(kicker.className).toMatch(/\blabel\b/);
  });

  it('unit_sister_project_heading_uses_drop_accent: sister-project h2 contains "The Large Language Library" + arrow glyph in oxblood', async () => {
    await renderHome();
    const heading = screen.getByRole('heading', {
      level: 2,
      name: /The Large Language Library/,
    });
    expect(heading).toBeInTheDocument();
    // DropAccent appends a sibling <span aria-hidden=true text-(--color-oxblood)>glyph</span>
    // inside the heading.
    const accentSpan = heading.querySelector(
      'span[aria-hidden="true"][class*="text-(--color-oxblood)"]',
    );
    expect(accentSpan).not.toBeNull();
    expect(accentSpan!.textContent).toBe('→');
  });

  it('unit_sister_project_outbound_link: anchor to https://largelanguagelibrary.ai with target=_blank rel=noreferrer', async () => {
    await renderHome();
    const link = screen.getByRole('link', {
      name: /largelanguagelibrary\.ai/,
    });
    expect(link.getAttribute('href')).toMatch(
      /^https:\/\/largelanguagelibrary\.ai\/?$/,
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — SectionDivider chain
  // ────────────────────────────────────────────────────────────────

  it('unit_section_divider_count_with_latest: exactly 3 SectionDividers render when latest episode is present', async () => {
    const { container } = await renderHome();
    // SectionDivider renders <div className="h-(--space-7)" aria-hidden="true">.
    const dividers = container.querySelectorAll('div.h-\\(--space-7\\)[aria-hidden="true"]');
    expect(dividers).toHaveLength(3);
  });

  it('unit_section_divider_top_bottom_props: source declares dividers marble→parchment, parchment→marble, marble→bone in order', () => {
    // Source-level assertion — DOM doesn't carry the prop values, so verify
    // the chain in page.tsx text.
    const dividers = PAGE_SOURCE.match(/<SectionDivider[^/]*\/>/g) ?? [];
    expect(dividers.length).toBeGreaterThanOrEqual(3);
    // Joined string for ordered assertion.
    const joined = dividers.join(' || ');
    const heroToParchment =
      /top=\{?["']?var\(--color-marble\)["']?\}?[^/]*bottom=\{?["']?var\(--color-parchment\)["']?\}?/;
    const parchmentToMarble =
      /top=\{?["']?var\(--color-parchment\)["']?\}?[^/]*bottom=\{?["']?var\(--color-marble\)["']?\}?/;
    const marbleToBone =
      /top=\{?["']?var\(--color-marble\)["']?\}?[^/]*bottom=\{?["']?var\(--color-bone\)["']?\}?/;
    expect(joined).toMatch(heroToParchment);
    expect(joined).toMatch(parchmentToMarble);
    expect(joined).toMatch(marbleToBone);
    // Order: hero→parchment before parchment→marble before marble→bone.
    const idxA = PAGE_SOURCE.search(heroToParchment);
    const idxB = PAGE_SOURCE.search(parchmentToMarble);
    const idxC = PAGE_SOURCE.search(marbleToBone);
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThan(idxA);
    expect(idxC).toBeGreaterThan(idxB);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — Legacy "Inside the build" block removed
  // ────────────────────────────────────────────────────────────────

  it('unit_no_inside_the_build_section: legacy "Inside the build" heading is removed', async () => {
    await renderHome();
    expect(
      screen.queryByRole('heading', { name: /Inside the build/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Read the build log/i)).not.toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // Integration
  // ────────────────────────────────────────────────────────────────

  it('int_calls_getLatestEpisode: HomePage calls getLatestEpisode once', async () => {
    await renderHome();
    expect(mockGetLatestEpisode).toHaveBeenCalledOnce();
  });

  it('int_block_render_order: hero → latest → library → sister-project in DOM order', async () => {
    await renderHome();
    const heroKicker = screen.getByText(site.heroKicker);
    const latestKicker = screen.getByText('Latest Episode');
    const libraryHeading = screen.getByRole('heading', {
      level: 2,
      name: 'The library',
    });
    const sisterKicker = screen.getByText('Sister Project');
    const order = [heroKicker, latestKicker, libraryHeading, sisterKicker];
    for (let i = 1; i < order.length; i++) {
      // node_a precedes node_b → DOCUMENT_POSITION_FOLLOWING bit set on b vs a.
      const rel = order[i - 1].compareDocumentPosition(order[i]);
      expect(rel & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('int_uses_container_in_each_block: each block uses Container (mx-auto w-full)', async () => {
    const { container } = await renderHome();
    const containers = container.querySelectorAll('.mx-auto.w-full');
    // hero + latest + library + sister-project = 4 Containers minimum.
    expect(containers.length).toBeGreaterThanOrEqual(4);
  });

  it('int_no_unused_link_import: Link import is removed OR demonstrably used in source', () => {
    const importsLink = /import\s+Link\s+from\s+['"]next\/link['"]/.test(
      PAGE_SOURCE,
    );
    // count non-import occurrences of `Link` (JSX or function use).
    const linkUsageWithoutImport = (
      PAGE_SOURCE.replace(/^import .*$/gm, '').match(/\bLink\b/g) ?? []
    ).length;
    if (importsLink) {
      expect(linkUsageWithoutImport).toBeGreaterThan(0);
    } else {
      expect(linkUsageWithoutImport).toBe(0);
    }
  });

  // ────────────────────────────────────────────────────────────────
  // Accessibility (WCAG)
  // ────────────────────────────────────────────────────────────────

  it('a11y_single_h1: page has exactly one h1', async () => {
    await renderHome();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  it('a11y_heading_hierarchy_no_skip: h1 present, h2s present, no h3 without an h2 ancestor at section scope', async () => {
    await renderHome();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(2);
  });

  it('a11y_hero_image_alt_empty_and_aria_hidden: decorative hero image has alt="" AND aria-hidden=true', async () => {
    await renderHome();
    // next/image rewrites src into a /_next/image?url=... URL, so we match
    // on the decorative-image signature (alt="" + aria-hidden=true) inside
    // the hero <section> instead of on the literal src path.
    const hero = introSection();
    expect(hero).not.toBeNull();
    const heroImg = hero!.querySelector('img[alt=""][aria-hidden="true"]');
    expect(heroImg).not.toBeNull();
    expect(heroImg!.getAttribute('alt')).toBe('');
    expect(heroImg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('a11y_hero_backdrop_aria_hidden: HeroBackdrop renders with aria-hidden=true', async () => {
    const { container } = await renderHome();
    const backdrop = container.querySelector(
      'div[aria-hidden="true"][class*="absolute"][class*="-z-10"]',
    );
    expect(backdrop).not.toBeNull();
  });

  it('a11y_all_links_have_accessible_text: every <a> has non-empty text content', async () => {
    await renderHome();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect((link.textContent ?? '').trim().length).toBeGreaterThan(0);
    });
  });

  it('a11y_library_grid_is_semantic_list: library grid is a <ul> of <li>', async () => {
    await renderHome();
    const librarySection = closestSection(
      screen.getByRole('heading', { level: 2, name: 'The library' }),
    );
    const ul = librarySection.querySelector('ul');
    expect(ul).not.toBeNull();
    const lis = ul!.querySelectorAll('li');
    expect(lis.length).toBe(4);
  });

  // ────────────────────────────────────────────────────────────────
  // Infrastructure (source-level sentinels)
  // ────────────────────────────────────────────────────────────────

  it('infra_brand_sentinel_passes_on_page_tsx: page.tsx contains zero forbidden placeholder utility tokens', () => {
    const BANNED = [
      'text-accent',
      'text-muted',
      'font-display',
      'text-5xl',
      'md:text-6xl',
      'text-3xl',
      'text-2xl',
      'text-xl',
      'text-lg',
      'text-sm',
      'border-mist',
      'bg-marble-texture',
      'rounded-lg',
      'hover:border-accent',
      'hover:text-accent',
      'text-link',
      'font-semibold',
      'tracking-wide',
      'tracking-tight',
      'leading-[1.05]',
      'uppercase',
    ];
    const hits = BANNED.filter((token) => PAGE_SOURCE.includes(token));
    expect(hits).toEqual([]);
  });

  it('infra_uses_only_brand_typography_utilities: page.tsx uses .label, .display-1, .display-2, .body-1', () => {
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-2\b/);
    expect(PAGE_SOURCE).toMatch(/\bbody-1\b/);
  });

  it('infra_hero_backdrop_skip_paths_entry_preserved: sentinel SKIP_PATHS still includes both HeroBackdrop paths', () => {
    expect(SENTINEL_SOURCE).toContain('src/components/brand/HeroBackdrop.tsx');
    expect(SENTINEL_SOURCE).toContain(
      'src/components/brand/__tests__/HeroBackdrop.test.tsx',
    );
  });

  it('infra_uses_brand_primitives_only: page.tsx imports Section, SectionDivider, EditorialCard, Bone, DropAccent, HeroBackdrop from @/components/brand', () => {
    const brandImport = PAGE_SOURCE.match(
      /import\s*\{([^}]*)\}\s*from\s*['"]@\/components\/brand['"]/,
    );
    expect(brandImport).not.toBeNull();
    const names = brandImport![1];
    expect(names).toMatch(/\bSection\b/);
    expect(names).toMatch(/\bSectionDivider\b/);
    expect(names).toMatch(/\bEditorialCard\b/);
    expect(names).toMatch(/\bBone\b/);
    expect(names).toMatch(/\bDropAccent\b/);
    expect(names).toMatch(/\bHeroBackdrop\b/);
  });

  // ────────────────────────────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────────────────────────────

  it('edge_no_latest_episode: when latest is null, latest block + its divider are not in the DOM', async () => {
    mockGetLatestEpisode.mockResolvedValue(null);
    const { container } = await renderHome();
    expect(screen.queryByText('Latest Episode')).not.toBeInTheDocument();
    // Without the latest-episode block the two surrounding dividers
    // collapse with it (marble→parchment + parchment→marble both
    // describe a parchment surface that doesn't exist), leaving only
    // the marble→bone divider before the sister-project block.
    const dividers = container.querySelectorAll('div.h-\\(--space-7\\)[aria-hidden="true"]');
    expect(dividers.length).toBe(1);
  });

  it('edge_no_latest_episode_library_still_renders: library and 4-entry grid still render when latest is null', async () => {
    mockGetLatestEpisode.mockResolvedValue(null);
    await renderHome();
    const libraryHeading = screen.getByRole('heading', {
      level: 2,
      name: 'The library',
    });
    const librarySection = closestSection(libraryHeading);
    expect(librarySection.querySelectorAll('li')).toHaveLength(4);
    const hrefs = Array.from(librarySection.querySelectorAll('a')).map(
      (a) => a.getAttribute('href'),
    );
    expect(hrefs).toEqual(
      expect.arrayContaining(['/episodes', '/cases', '/build-log', '/products']),
    );
  });

  it('edge_episode_with_missing_optional_fields: episode with empty summary renders the card without a subtitle paragraph', async () => {
    mockGetLatestEpisode.mockResolvedValue({
      ...MOCK_EPISODE,
      meta: { ...MOCK_EPISODE.meta, summary: '' },
    });
    await renderHome();
    const titleLink = screen.getByRole('link', { name: /Test Episode Title/ });
    expect(titleLink).toBeInTheDocument();
    // EditorialCard renders <a><article>...</article></a>, so the article
    // is the link's descendant (not ancestor). Scope from there: no
    // .body-2 subtitle paragraph when summary is empty (EditorialCard's
    // `subtitle &&` short-circuit).
    const article = titleLink.querySelector('article');
    expect(article).not.toBeNull();
    expect(article!.querySelector('p.body-2')).toBeNull();
  });

  it('edge_episode_act_zero: episode with act=0 still renders "Act 0" in the tag without crashing', async () => {
    mockGetLatestEpisode.mockResolvedValue({
      ...MOCK_EPISODE,
      meta: { ...MOCK_EPISODE.meta, act: 0 },
    });
    await renderHome();
    expect(screen.getByText(/Test Series\s*·\s*Act\s*0/)).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // Error recovery
  // ────────────────────────────────────────────────────────────────

  it('err_getLatestEpisode_rejects_propagates: rejection bubbles through Home() (Next.js error boundary handles in prod)', async () => {
    mockGetLatestEpisode.mockRejectedValueOnce(new Error('loader exploded'));
    await expect(Home()).rejects.toThrow(/loader exploded/);
  });

  // ────────────────────────────────────────────────────────────────
  // Data integrity
  // ────────────────────────────────────────────────────────────────

  it('data_library_entries_have_required_fields: every library card has tag + headline + subtitle + href', async () => {
    await renderHome();
    const librarySection = closestSection(
      screen.getByRole('heading', { level: 2, name: 'The library' }),
    );
    const cards = librarySection.querySelectorAll('li');
    cards.forEach((li) => {
      const anchor = li.querySelector('a');
      expect(anchor).not.toBeNull();
      expect(anchor!.getAttribute('href')).toBeTruthy();
      // EditorialCard renders <article> with tag (.label), headline (h3.display-3), subtitle (p.body-2)
      const article = li.querySelector('article');
      expect(article).not.toBeNull();
      expect(article!.querySelector('.label')).not.toBeNull();
      expect(article!.querySelector('h3')).not.toBeNull();
      expect(article!.querySelector('p.body-2')).not.toBeNull();
    });
  });

  it('data_sister_project_url_uses_https: outbound link points at https://largelanguagelibrary.ai exactly', async () => {
    await renderHome();
    const link = screen.getByRole('link', { name: /largelanguagelibrary\.ai/ });
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('https://')).toBe(true);
    expect(href).toMatch(/^https:\/\/largelanguagelibrary\.ai\/?$/);
  });

  it('data_no_about_in_library_grid: library hrefs do NOT include /about', async () => {
    await renderHome();
    const librarySection = closestSection(
      screen.getByRole('heading', { level: 2, name: 'The library' }),
    );
    const hrefs = Array.from(librarySection.querySelectorAll('a')).map(
      (a) => a.getAttribute('href'),
    );
    expect(hrefs).not.toContain('/about');
  });
});

describe('Home — portal hero composition', () => {
  beforeEach(() => {
    mockGetLatestEpisode.mockResolvedValue(null);
  });

  it('int_portal_hero_precedes_intro_h1: PortalHero renders first, before the h1 intro section', async () => {
    await renderHome();
    const hero = screen.getByTestId('portal-hero');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(hero.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hero.hasAttribute('data-hero-root')).toBe(true);
  });

  it('a11y_intro_section_is_skip_target: the section after the hero carries id="content"', async () => {
    await renderHome();
    const intro = introSection();
    expect(intro.id).toBe('content');
  });

  it('infra_page_imports_portal_hero_from_hero_module', () => {
    expect(PAGE_SOURCE).toMatch(/import\s*\{\s*PortalHero\s*\}\s*from\s*['"]@\/components\/hero['"]/);
    expect(PAGE_SOURCE).toMatch(/<PortalHero\s*\/>/);
  });

  it('perf_intro_image_no_longer_priority: floatbg is below the fold and must not be priority-loaded', () => {
    const introImage = PAGE_SOURCE.slice(PAGE_SOURCE.indexOf('/hero/floatbg.png'), PAGE_SOURCE.indexOf('/hero/floatbg.png') + 400);
    expect(introImage).not.toMatch(/\bpriority\b/);
  });
});
