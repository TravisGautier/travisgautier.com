// Case detail (styling-overhaul-7.3) — brand-aware assertions.
//
// Replaces the placeholder-pattern tests with assertions that pin the
// editorial reskin per phase-7-pages.md Feature 7.3:
//   - <Marble> surface wraps the page
//   - <Section rhythm="lg"> (py-(--section-y-lg))
//   - <Container width="prose"> (max-w-prose)
//   - .label / .display-1 / .body-1 brand utilities
//   - <DropAccent glyph="." size="large"> wrapping h1 title (Oxblood . after title)
//   - Spec-sheet <aside><dl> with Client / Engagement / Status labels
//   - PRESERVED: The problem / Deliverables / Outcome h2 sections,
//     MDX <Component/>, EmailCapture wiring, LllCrosslinks mount,
//     related episode link filter, JSON-LD CreativeWork,
//     generateStaticParams, generateMetadata, notFound
//
// Source-level sentinels (infra_*) read src/app/cases/[slug]/page.tsx via
// readFileSync to assert no banned placeholder utility names remain.

import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/content/cases', () => ({
  getAllCases: vi.fn(),
  getCaseBySlug: vi.fn(),
}));

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
}));

vi.mock('@/components/capture/EmailCapture', () => ({
  EmailCapture: ({ source }: { source: string }) => (
    <div data-testid="email-capture" data-source={source} />
  ),
}));

vi.mock('@/components/crosslinks/LllCrosslinks', () => ({
  LllCrosslinks: ({ urls, className }: { urls: string[]; className?: string }) => (
    <div
      data-testid="lll-crosslinks"
      data-urls={JSON.stringify(urls)}
      className={className}
    />
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import { getAllCases, getCaseBySlug } from '@/lib/content/cases';
import { getAllEpisodes } from '@/lib/content/episodes';
import { site } from '@/lib/site';
import CaseDetail, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from '../page';

const mockGetCaseBySlug = vi.mocked(getCaseBySlug);
const mockGetAllCases = vi.mocked(getAllCases);
const mockGetAllEpisodes = vi.mocked(getAllEpisodes);
const mockNotFound = vi.mocked(notFound);

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const PAGE_SOURCE_PATH = join(__dirname_compat, '..', 'page.tsx');
const PAGE_SOURCE = readFileSync(PAGE_SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'text-accent',
  'text-muted',
  'font-display',
  'text-4xl',
  'text-3xl',
  'text-2xl',
  'text-xl',
  'text-lg',
  'text-sm',
  'text-xs',
  'uppercase',
  'tracking-wide',
  'tracking-tight',
  'rounded-lg',
  'rounded-md',
  'border-mist',
  'hover:border-accent',
  'hover:opacity-90',
  'bg-accent',
  'text-parchment',
  'font-semibold',
  'font-medium',
  'prose-style',
];

const MOCK_MDX_COMPONENT = () => <div data-testid="mdx-body">Case MDX content</div>;

const MOCK_CASE_FULL = {
  meta: {
    id: 'case-001',
    slug: 'test-case',
    title: 'Test Case Title',
    client: 'Test Client LLC',
    status: 'active' as const,
    summary: 'A test case summary for the detail page.',
    problem: 'The defining problem of this engagement.',
    marketResearch: '',
    discoveryProcess: '',
    technicalDecisions: '',
    deliverables: ['Deliverable One', 'Deliverable Two', 'Deliverable Three'],
    outcome: 'Outcome description goes here.',
    startedAt: '2026-03-01T00:00:00.000Z',
    relatedEpisodeIds: ['ep-001'],
    lllEntryUrls: [
      'https://largelanguagelibrary.ai/entries/case-topic',
      'https://largelanguagelibrary.ai/entries/related-topic',
    ],
  },
  slug: 'test-case',
  Component: MOCK_MDX_COMPONENT,
};

const MOCK_CASE_MINIMAL = {
  meta: {
    id: 'case-002',
    slug: 'minimal-case',
    title: 'Minimal Case',
    client: 'Minimal Client',
    status: 'archived' as const,
    summary: 'Minimal summary.',
    problem: 'Minimal problem.',
    marketResearch: '',
    discoveryProcess: '',
    technicalDecisions: '',
    deliverables: [],
    outcome: 'Minimal outcome.',
    relatedEpisodeIds: [],
    lllEntryUrls: [],
  },
  slug: 'minimal-case',
  Component: () => <div data-testid="mdx-body">Minimal content</div>,
};

const MOCK_EPISODE_RELATED = {
  meta: {
    id: 'ep-001',
    slug: 'related-episode',
    title: 'Related Episode Title',
    series: 'Test Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'Related episode summary.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
  },
  slug: 'related-episode',
  Component: () => null,
};

const MOCK_EPISODE_UNRELATED = {
  meta: {
    id: 'ep-999',
    slug: 'unrelated-episode',
    title: 'Unrelated Episode',
    series: 'Other Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'shorts' as const,
    pillar: 'workflow' as const,
    summary: 'Unrelated summary.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
  },
  slug: 'unrelated-episode',
  Component: () => null,
};

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderDetail(slug = 'test-case') {
  const jsx = await CaseDetail(makeParams(slug));
  return render(jsx);
}

describe('CaseDetail (styling-overhaul-7.3) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_FULL);
    mockGetAllEpisodes.mockResolvedValue([
      MOCK_EPISODE_RELATED,
      MOCK_EPISODE_UNRELATED,
    ]);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — page chrome
  // ────────────────────────────────────────────────────────────────

  it("unit_detail_label_status_client: label line contains both status label and client name", async () => {
    const { container } = await renderDetail();
    const labels = container.querySelectorAll('.label');
    const labelText = Array.from(labels).map((el) => el.textContent ?? '').join(' | ');
    expect(labelText).toMatch(/Active Engagement/);
    expect(labelText).toMatch(/Test Client LLC/);
  });

  it("unit_detail_h1_display_1_drop_accent: h1 uses .display-1 and renders a DropAccent '.' glyph after title", async () => {
    await renderDetail();
    const h1 = screen.getByRole('heading', { level: 1, name: /Test Case Title/ });
    expect(h1.className).toMatch(/\bdisplay-1\b/);
    const accent = h1.querySelector('span[aria-hidden="true"].text-\\(--color-oxblood\\)');
    expect(accent).not.toBeNull();
    expect(accent?.textContent?.trim()).toBe('.');
  });

  it('unit_detail_summary_body_1: summary paragraph uses .body-1 brand utility', async () => {
    const { container } = await renderDetail();
    const bodyParas = container.querySelectorAll('p.body-1');
    const summaryPara = Array.from(bodyParas).find((p) =>
      (p.textContent ?? '').includes('A test case summary for the detail page.'),
    );
    expect(summaryPara).toBeDefined();
  });

  it('unit_detail_spec_sheet_aside_dl: spec-sheet renders inside <aside> wrapping a <dl>', async () => {
    const { container } = await renderDetail();
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    const dl = aside!.querySelector('dl');
    expect(dl).not.toBeNull();
  });

  it("unit_detail_spec_sheet_client_dt_dd: spec-sheet contains a 'Client' dt and a dd with the client name", async () => {
    const { container } = await renderDetail();
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    const dts = Array.from(aside!.querySelectorAll('dt'));
    const clientDt = dts.find((d) => /^Client$/i.test((d.textContent ?? '').trim()));
    expect(clientDt).toBeDefined();
    expect(clientDt!.className).toMatch(/\blabel\b/);
    const clientDd = clientDt!.parentElement!.querySelector('dd');
    expect((clientDd?.textContent ?? '').trim()).toMatch(/Test Client LLC/);
  });

  it("unit_detail_spec_sheet_engagement_renders_dates: Engagement dd renders startedAt and shippedAt range", async () => {
    const { container } = await renderDetail();
    const aside = container.querySelector('aside');
    const dts = Array.from(aside!.querySelectorAll('dt'));
    const engagementDt = dts.find((d) =>
      /^Engagement$/i.test((d.textContent ?? '').trim()),
    );
    expect(engagementDt).toBeDefined();
    const engagementDd = engagementDt!.parentElement!.querySelector('dd');
    const text = (engagementDd?.textContent ?? '').trim();
    // startedAt is present in fixture; shippedAt is undefined → 'Ongoing' marker
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/undefined/);
    expect(text).not.toMatch(/NaN/);
  });

  it('unit_detail_problem_section_preserved: PRESERVED — The problem h2 + body still render', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'The problem' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('The defining problem of this engagement.'),
    ).toBeInTheDocument();
  });

  it('unit_detail_deliverables_section_preserved: PRESERVED — Deliverables h2 + items still render', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Deliverables' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Deliverable One')).toBeInTheDocument();
    expect(screen.getByText('Deliverable Two')).toBeInTheDocument();
    expect(screen.getByText('Deliverable Three')).toBeInTheDocument();
  });

  it('unit_detail_outcome_section_preserved: PRESERVED — Outcome h2 + body still render', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Outcome' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Outcome description goes here.')).toBeInTheDocument();
  });

  it('unit_detail_mdx_component_rendered: PRESERVED — MDX Component mounts in body', async () => {
    await renderDetail();
    expect(screen.getByTestId('mdx-body')).toBeInTheDocument();
    expect(screen.getByText('Case MDX content')).toBeInTheDocument();
  });

  it('unit_detail_email_capture_source: PRESERVED — EmailCapture mounted with source=`case-{slug}`', async () => {
    await renderDetail();
    const capture = screen.getByTestId('email-capture');
    expect(capture).toHaveAttribute('data-source', 'case-test-case');
  });

  // ────────────────────────────────────────────────────────────────
  // Integration
  // ────────────────────────────────────────────────────────────────

  it('int_detail_calls_getCaseBySlug: loader invoked with route slug', async () => {
    await renderDetail();
    expect(mockGetCaseBySlug).toHaveBeenCalledWith('test-case');
  });

  it('int_detail_calls_getAllEpisodes: PRESERVED — episodes loader invoked once', async () => {
    await renderDetail();
    expect(mockGetAllEpisodes).toHaveBeenCalledOnce();
  });

  it('int_detail_wraps_in_marble_section_lg_container_prose: brand shell stack present', async () => {
    const { container } = await renderDetail();
    expect(container.querySelector('.bg-\\(--color-marble\\)')).toBeInTheDocument();
    expect(container.querySelector('.py-\\(--section-y-lg\\)')).toBeInTheDocument();
    expect(container.querySelector('.max-w-prose')).toBeInTheDocument();
  });

  it('int_detail_related_episode_renders_and_filters: PRESERVED — related episode link present, unrelated NOT rendered', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Episodes' }),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Related Episode Title' });
    expect(link).toHaveAttribute('href', '/episodes/related-episode');
    expect(screen.queryByText('Unrelated Episode')).not.toBeInTheDocument();
  });

  it('int_detail_lll_crosslinks_mount: PRESERVED — LllCrosslinks mounted with case lllEntryUrls', async () => {
    await renderDetail();
    const crosslinks = screen.getByTestId('lll-crosslinks');
    expect(crosslinks).toBeInTheDocument();
    const urls = JSON.parse(crosslinks.getAttribute('data-urls')!);
    expect(urls).toHaveLength(2);
    expect(urls).toContain('https://largelanguagelibrary.ai/entries/case-topic');
  });

  // ────────────────────────────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────────────────────────────

  it('edge_detail_empty_deliverables: PRESERVED — Deliverables h2 renders with empty <ul> when deliverables=[]', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_MINIMAL);
    await renderDetail('minimal-case');
    const deliverablesHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Deliverables',
    });
    const deliverablesList = deliverablesHeading.parentElement?.querySelector('ul');
    expect(deliverablesList).not.toBeNull();
    expect(deliverablesList!.querySelectorAll('li')).toHaveLength(0);
  });

  it('edge_detail_empty_related_episodes: PRESERVED — Episodes h2 does NOT render when relatedEpisodeIds=[]', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_MINIMAL);
    await renderDetail('minimal-case');
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Episodes' }),
    ).not.toBeInTheDocument();
  });

  it('edge_detail_empty_lll_urls: PRESERVED — LllCrosslinks NOT mounted when lllEntryUrls=[]', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_MINIMAL);
    await renderDetail('minimal-case');
    expect(screen.queryByTestId('lll-crosslinks')).not.toBeInTheDocument();
  });

  it("edge_detail_engagement_ongoing_when_no_shipped_at: spec-sheet Engagement renders an 'Ongoing' marker when shippedAt is absent", async () => {
    const { container } = await renderDetail();
    const aside = container.querySelector('aside');
    const dts = Array.from(aside!.querySelectorAll('dt'));
    const engagementDt = dts.find((d) =>
      /^Engagement$/i.test((d.textContent ?? '').trim()),
    );
    const engagementDd = engagementDt!.parentElement!.querySelector('dd');
    const text = (engagementDd?.textContent ?? '').toLowerCase();
    expect(text).toMatch(/ongoing/);
  });

  it('edge_detail_engagement_no_started_at: spec-sheet Engagement renders cleanly when BOTH dates are absent (no undefined leak)', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_MINIMAL); // no startedAt, no shippedAt
    const { container } = await renderDetail('minimal-case');
    const aside = container.querySelector('aside');
    const dts = Array.from(aside!.querySelectorAll('dt'));
    const engagementDt = dts.find((d) =>
      /^Engagement$/i.test((d.textContent ?? '').trim()),
    );
    const engagementDd = engagementDt!.parentElement!.querySelector('dd');
    const text = (engagementDd?.textContent ?? '').trim();
    expect(text).not.toMatch(/undefined/);
    expect(text).not.toMatch(/NaN/);
  });

  // ────────────────────────────────────────────────────────────────
  // Error recovery
  // ────────────────────────────────────────────────────────────────

  it('err_detail_not_found_calls_notFound: PRESERVED — null lookup triggers notFound() + returns undefined', async () => {
    mockGetCaseBySlug.mockResolvedValue(null);
    const jsx = await CaseDetail(makeParams('nonexistent'));
    expect(mockNotFound).toHaveBeenCalled();
    expect(jsx).toBeUndefined();
  });

  it('err_detail_generate_metadata_returns_empty_on_missing: PRESERVED — generateMetadata returns {} when case is missing', async () => {
    mockGetCaseBySlug.mockResolvedValue(null);
    const meta = await generateMetadata(makeParams('nonexistent'));
    expect(meta).toEqual({});
  });

  // ────────────────────────────────────────────────────────────────
  // Data integrity
  // ────────────────────────────────────────────────────────────────

  it('data_detail_jsonld_creativework_shape: PRESERVED — JSON-LD CreativeWork shape with creator Organization + about=client', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('CreativeWork');
    expect(parsed.name).toBe('Test Case Title');
    expect(parsed.creator).toBeDefined();
    expect(parsed.creator['@type']).toBe('Organization');
    expect(parsed.creator.name).toBe(site.name);
    expect(parsed.creator.url).toBe(`${site.url}`);
    expect(parsed.about).toBe('Test Client LLC');
  });

  it('data_detail_email_source_format: PRESERVED — EmailCapture data-source is exactly `case-{slug}`', async () => {
    await renderDetail();
    const capture = screen.getByTestId('email-capture');
    const source = capture.getAttribute('data-source');
    expect(source).toBe('case-test-case');
  });

  it('data_detail_deliverables_count_matches_source: PRESERVED — rendered Deliverables li count equals meta.deliverables.length', async () => {
    await renderDetail();
    const deliverablesHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Deliverables',
    });
    const deliverablesList = deliverablesHeading.parentElement?.querySelector('ul');
    expect(deliverablesList!.querySelectorAll('li')).toHaveLength(
      MOCK_CASE_FULL.meta.deliverables.length,
    );
  });

  it("data_detail_drop_accent_glyph_period_locked: DropAccent glyph on h1 is the literal '.' (page voice locked)", async () => {
    await renderDetail();
    const h1 = screen.getByRole('heading', { level: 1, name: /Test Case Title/ });
    const accent = h1.querySelector('span[aria-hidden="true"].text-\\(--color-oxblood\\)');
    expect(accent?.textContent?.trim()).toBe('.');
  });

  // ────────────────────────────────────────────────────────────────
  // Accessibility
  // ────────────────────────────────────────────────────────────────

  it('a11y_detail_h1_present: exactly one h1 landmark', async () => {
    await renderDetail();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  it('a11y_detail_article_landmark: PRESERVED — page renders inside an <article> landmark', async () => {
    const { container } = await renderDetail();
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('a11y_detail_spec_sheet_dl_semantic: spec-sheet uses semantic <dl>/<dt>/<dd>', async () => {
    const { container } = await renderDetail();
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    const dl = aside!.querySelector('dl');
    expect(dl).not.toBeNull();
    expect(dl!.querySelectorAll('dt').length).toBeGreaterThanOrEqual(3); // Client / Engagement / Status
    expect(dl!.querySelectorAll('dd').length).toBeGreaterThanOrEqual(3);
  });

  // ────────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels + Next metadata
  // ────────────────────────────────────────────────────────────────

  it('infra_detail_no_banned_placeholder_utilities: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_detail_adopts_brand_utilities: page source contains .label AND .display-1 AND .body-1 AND DropAccent', () => {
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bbody-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bDropAccent\b/);
  });

  it('infra_detail_imports_brand_primitives: page imports Marble, Section, DropAccent from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bMarble\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bDropAccent\b/);
  });

  it('infra_detail_dynamic_params_false: PRESERVED — exports dynamicParams = false', () => {
    expect(dynamicParams).toBe(false);
  });

  it('infra_detail_generate_static_params: PRESERVED — returns one { slug } entry per case', async () => {
    mockGetAllCases.mockResolvedValue([MOCK_CASE_FULL, MOCK_CASE_MINIMAL]);
    const params = await generateStaticParams();
    expect(params).toEqual([{ slug: 'test-case' }, { slug: 'minimal-case' }]);
  });

  it('infra_detail_generate_metadata_title_desc: PRESERVED — generateMetadata returns title + description', async () => {
    const meta = await generateMetadata(makeParams('test-case'));
    expect(meta.title).toBe('Test Case Title');
    expect(meta.description).toBe('A test case summary for the detail page.');
  });

  it('infra_detail_generate_metadata_og_twitter: PRESERVED — generateMetadata returns openGraph + twitter blocks', async () => {
    const meta = await generateMetadata(makeParams('test-case'));
    const og = meta.openGraph as { title?: string; description?: string } | undefined;
    expect(og).toBeDefined();
    expect(og?.title).toBe('Test Case Title');
    expect(og?.description).toBe('A test case summary for the detail page.');
    const twitter = meta.twitter as { card?: string; title?: string } | undefined;
    expect(twitter).toBeDefined();
    expect(twitter?.card).toBe('summary_large_image');
    expect(twitter?.title).toBe('Test Case Title');
  });

  it('infra_detail_forbidden_pattern_sentinel_clean: page source contains no gradient/UI-shadow/banned-palette tokens', () => {
    const checks: Array<[string, RegExp]> = [
      ['linear-gradient', /\blinear-gradient\s*\(/i],
      ['radial-gradient', /\bradial-gradient\s*\(/i],
      ['bg-gradient util', /\bbg-gradient-(to-[a-z]+|conic|radial)\b/],
      ['Tailwind UI shadow', /\bshadow-(md|lg|xl|2xl|inner)\b/],
      ['pure black hex', /#0{3}(?:0{3})?\b/],
      ['pure white hex', /#f{3}(?:f{3})?\b/i],
      ['pure red hex', /#(?:f00|ff0000)\b/i],
      [
        'forbidden palette utility',
        /\b(?:bg|text|border|ring|from|to|via)-(?:red|orange|yellow|blue|indigo|purple|pink|fuchsia|rose|sky|cyan|teal|green|emerald|lime)-\d{2,3}\b/,
      ],
    ];
    const hits = checks.filter(([, re]) => re.test(PAGE_SOURCE)).map(([n]) => n);
    expect(hits).toEqual([]);
  });
});
