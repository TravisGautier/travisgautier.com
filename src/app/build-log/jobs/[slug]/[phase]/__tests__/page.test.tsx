// /build-log/jobs/[slug]/[phase] detail tests (styling-overhaul-7.4 hybrid red).
//
// Preserves all behavior pins (h1 = phase title, breadcrumb, phase
// header dl, PhaseNav with active slug, MarkdownDocument mount,
// generateStaticParams cross-product, generateMetadata, dynamicParams,
// JSON-LD TechArticle with isPartOf job, notFound) and adds brand-aware
// assertions per phase-7-pages.md Feature 7.4:
//   - <Bone> surface + <Section rhythm="lg"> + <Container width="prose">
//   - <Parchment edge="strong"> inner panel wraps MarkdownDocument
//   - .label kicker + .display-1 title; no placeholder utility tokens
//
// Source-level sentinels enforce the brand-utility adoption.

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

vi.mock('@/lib/build-log/jobs', () => ({
  getAllJobs: vi.fn(),
  getJobBySlug: vi.fn(),
  getJobPhase: vi.fn(),
}));

vi.mock('@/components/build-log/MarkdownDocument', () => ({
  MarkdownDocument: ({ body }: { body: string }) => (
    <div data-testid="markdown-document" data-body={body} />
  ),
}));

vi.mock('@/components/build-log/PhaseNav', () => ({
  PhaseNav: ({
    jobSlug,
    phases,
    activePhaseSlug,
  }: {
    jobSlug: string;
    phases: ReadonlyArray<{ slug: string }>;
    activePhaseSlug?: string;
  }) => (
    <div
      data-testid="phase-nav"
      data-job-slug={jobSlug}
      data-phase-count={phases.length}
      data-active={activePhaseSlug ?? ''}
    />
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import { getAllJobs, getJobBySlug, getJobPhase } from '@/lib/build-log/jobs';
import PhasePage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../page';
import type { Job, JobPhase } from '@/content/schemas';
import { site } from '@/lib/site';

const mockGetAllJobs = vi.mocked(getAllJobs);
const mockGetJobBySlug = vi.mocked(getJobBySlug);
const mockGetJobPhase = vi.mocked(getJobPhase);
const mockNotFound = vi.mocked(notFound);

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const PAGE_SOURCE_PATH = join(__dirname_compat, '..', 'page.tsx');
const PAGE_SOURCE = readFileSync(PAGE_SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'text-accent',
  'text-muted',
  'text-link',
  'text-foreground',
  'text-parchment',
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
  'bg-mist',
  'hover:border-accent',
  'hover:opacity-90',
  'bg-accent',
  'font-semibold',
  'font-medium',
];

const fixturePhases: readonly JobPhase[] = [
  {
    slug: 'phase-1-foundation',
    filename: 'phase-1-foundation.md',
    header: { phaseNumber: 1, title: 'Foundation', totalSize: '4 features' },
    body: '# Phase 1 body',
  },
  {
    slug: 'phase-2-pages',
    filename: 'phase-2-pages.md',
    header: { phaseNumber: 2, title: 'Pages' },
    body: '# Phase 2 body',
  },
] as const;

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    slug: 'demo-job',
    alias: 'dj',
    title: 'Demo Job',
    context: 'context',
    features: [],
    phases: fixturePhases,
    readmeBody: '# Demo Job',
    ...overrides,
  } as Job;
}

async function renderPage(slug: string, phase: string) {
  const jsx = await PhasePage({ params: Promise.resolve({ slug, phase }) });
  return render(jsx);
}

describe('/build-log/jobs/[slug]/[phase] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Preserved behavior pins ───

  it('unit_phase_detail_h1_renders_phase_title_format', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    await renderPage('demo-job', 'phase-1-foundation');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Phase 1: Foundation');
  });

  it('unit_phase_detail_h1_falls_back_to_slug', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      slug: 'phase-3-untitled',
      filename: 'phase-3-untitled.md',
      header: {},
      body: '# body',
    });
    await renderPage('demo-job', 'phase-3-untitled');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('phase-3-untitled');
  });

  it('unit_phase_detail_renders_breadcrumb', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    await renderPage('demo-job', 'phase-1-foundation');
    const back = screen.getByRole('link', { name: /^Build log$/i });
    expect(back).toHaveAttribute('href', '/build-log');
    const jobLink = screen.getByRole('link', { name: 'Demo Job' });
    expect(jobLink).toHaveAttribute('href', '/build-log/jobs/demo-job');
  });

  it('unit_phase_detail_dl_renders_totalSize_when_present', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    expect(container.textContent).toContain('Total size');
    expect(container.textContent).toContain('4 features');
  });

  it('unit_phase_detail_dl_omitted_when_both_absent', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      slug: 'phase-3-untitled',
      filename: 'phase-3-untitled.md',
      header: {},
      body: '# body',
    });
    const { container } = await renderPage('demo-job', 'phase-3-untitled');
    expect(container.textContent).not.toContain('Total size');
    expect(container.textContent).not.toContain('Prerequisites');
    expect(container.querySelector('dl')).toBeNull();
  });

  it('unit_phase_detail_dl_renders_prerequisites_when_present', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      slug: 'phase-2-pages',
      filename: 'phase-2-pages.md',
      header: { phaseNumber: 2, title: 'Pages', prerequisites: 'Phase 1' },
      body: '# body',
    });
    const { container } = await renderPage('demo-job', 'phase-2-pages');
    expect(container.textContent).toContain('Prerequisites');
    expect(container.textContent).toContain('Phase 1');
  });

  it('edge_phase_detail_only_totalSize', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      slug: 'phase-x',
      filename: 'phase-x.md',
      header: { phaseNumber: 9, title: 'X', totalSize: 'tiny', prerequisites: undefined },
      body: '# x',
    });
    const { container } = await renderPage('demo-job', 'phase-x');
    expect(container.textContent).toContain('Total size');
    expect(container.textContent).toContain('tiny');
    expect(container.textContent).not.toContain('Prerequisites');
  });

  it('integration_phase_detail_mounts_phase_nav_with_active_slug', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[1]);
    await renderPage('demo-job', 'phase-2-pages');
    const nav = screen.getByTestId('phase-nav');
    expect(nav.getAttribute('data-active')).toBe('phase-2-pages');
    expect(nav.getAttribute('data-phase-count')).toBe('2');
  });

  it('integration_phase_detail_mounts_markdown_document', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      ...fixturePhases[0],
      body: '# Custom phase body marker',
    });
    await renderPage('demo-job', 'phase-1-foundation');
    const md = screen.getByTestId('markdown-document');
    expect(md.getAttribute('data-body')).toBe('# Custom phase body marker');
  });

  it('integration_generate_static_params_phases_one_per_tuple', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', phases: fixturePhases }),
      makeJob({ slug: 'b', phases: fixturePhases }),
      makeJob({ slug: 'c', phases: fixturePhases }),
    ]);
    const params = await generateStaticParams();
    expect(params).toHaveLength(6);
    expect(params).toContainEqual({ slug: 'a', phase: 'phase-1-foundation' });
    expect(params).toContainEqual({ slug: 'a', phase: 'phase-2-pages' });
    expect(params).toContainEqual({ slug: 'b', phase: 'phase-1-foundation' });
    expect(params).toContainEqual({ slug: 'c', phase: 'phase-2-pages' });
  });

  it('integration_generate_metadata_returns_phase_title_format', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob({ title: 'Demo Job' }));
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'demo-job', phase: 'phase-1-foundation' }),
    });
    expect(meta.title).toBe('Phase 1: Foundation · Demo Job');
  });

  it('err_phase_detail_unknown_calls_not_found', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    mockGetJobPhase.mockResolvedValue(undefined);
    await PhasePage({ params: Promise.resolve({ slug: 'bogus', phase: 'bogus' }) });
    expect(mockNotFound).toHaveBeenCalled();

    vi.clearAllMocks();
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(undefined);
    await PhasePage({ params: Promise.resolve({ slug: 'demo-job', phase: 'bogus' }) });
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('err_phase_detail_metadata_returns_empty_unknown_phase', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job', phase: 'bogus-phase' }) });
    expect(meta).toEqual({});
  });

  it('err_phase_detail_metadata_returns_empty_unknown_job', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'bogus', phase: 'any' }) });
    expect(meta).toEqual({});
  });

  it('unit_phase_detail_dynamic_params_false', () => {
    expect(dynamicParams).toBe(false);
  });

  // ─── Metadata + JSON-LD (preserved) ───

  it('unit_phase_detail_metadata_openGraph_type', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job', phase: 'phase-1-foundation' }) });
    expect((meta.openGraph as { type?: string } | undefined)?.type).toBe('article');
  });

  it('unit_phase_detail_metadata_openGraph_url_matches_phase', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job', phase: 'phase-1-foundation' }) });
    expect(meta.openGraph?.url).toBe('/build-log/jobs/demo-job/phase-1-foundation');
  });

  it('unit_phase_detail_metadata_twitter_card', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job', phase: 'phase-1-foundation' }) });
    expect((meta.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
  });

  it('integration_phase_detail_json_ld_techarticle', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script!.innerHTML);
    expect(payload['@type']).toBe('TechArticle');
    expect(payload.headline).toContain('Phase 1: Foundation');
    expect(payload.headline).toContain('Demo Job');
  });

  it('integration_phase_detail_json_ld_isPartOf_job', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.isPartOf?.['@type']).toBe('TechArticle');
    expect(payload.isPartOf?.url).toBe(`${site.url}/build-log/jobs/demo-job`);
  });

  it('infra_phase_detail_json_ld_valid_json', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  it('data_phase_detail_json_ld_isPartOf_url_absolute', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.isPartOf?.url).toMatch(/^https:\/\/travisgautier\.com\//);
  });

  it('sec_information_disclosure_phase_body_no_executable_script', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      slug: 'phase-evil',
      filename: 'phase-evil.md',
      header: { phaseNumber: 1, title: 'Evil' },
      body: '<script>alert(1)</script>',
    });
    const { container } = await renderPage('demo-job', 'phase-evil');
    const md = screen.getByTestId('markdown-document');
    expect(md.getAttribute('data-body')).toBe('<script>alert(1)</script>');
    expect(container.querySelector('script:not([type="application/ld+json"])')).toBeNull();
  });

  // ─── Brand-aware reskin assertions ───

  it('a11y_phase_detail_single_h1', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
  });

  it('a11y_phase_detail_dl_semantic_pairs', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
    expect(dl!.querySelectorAll('dt').length).toBeGreaterThan(0);
    expect(dl!.querySelectorAll('dd').length).toBeGreaterThan(0);
  });

  it('integration_phase_detail_parchment_panel_wraps_markdown', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const md = container.querySelector('[data-testid="markdown-document"]');
    expect(md).not.toBeNull();
    const parchmentAncestor = md!.closest('[class*="bg-(--color-parchment)"]');
    expect(parchmentAncestor).not.toBeNull();
  });

  // ─── Source-grep sentinels ───

  it('infra_phase_detail_no_banned_placeholder_utilities: page source contains ZERO banned tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_phase_detail_adopts_brand_utilities: page source contains .label AND .display-1', () => {
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
  });

  it('infra_phase_detail_imports_brand_primitives: page imports Bone + Section + Parchment from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bBone\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bParchment\b/);
  });

  it('infra_phase_detail_forbidden_pattern_sentinel_clean: page source contains no gradient/UI-shadow/pure-color/forbidden-palette tokens', () => {
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
