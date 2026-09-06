// /build-log/jobs/[slug] overview tests (styling-overhaul-7.4 hybrid red).
//
// Preserves all behavior pins (h1 = job title, alias element, back link,
// PhaseNav mount, MarkdownDocument mount, generateStaticParams,
// generateMetadata, dynamicParams, JSON-LD TechArticle, notFound) and
// adds brand-aware assertions per phase-7-pages.md Feature 7.4:
//   - <Bone> surface wraps the page
//   - <Section rhythm="lg"> + <Container width="prose">
//   - <Parchment edge="strong"> inner panel wraps MarkdownDocument
//   - .label kicker + .display-1 title; no font-display / text-3xl /
//     text-muted / text-link / rounded placeholders
//
// Source-level sentinels (infra_*) read the page source to assert
// no banned placeholder utility names remain.

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
import { getAllJobs, getJobBySlug } from '@/lib/build-log/jobs';
import JobPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../page';
import type { Job, JobPhase } from '@/content/schemas';
import { site } from '@/lib/site';

const mockGetAllJobs = vi.mocked(getAllJobs);
const mockGetJobBySlug = vi.mocked(getJobBySlug);
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
    header: { phaseNumber: 1, title: 'Foundation' },
    body: '# Phase 1',
  },
  {
    slug: 'phase-2-pages',
    filename: 'phase-2-pages.md',
    header: { phaseNumber: 2, title: 'Pages' },
    body: '# Phase 2',
  },
] as const;

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    slug: 'demo-job',
    alias: 'dj',
    title: 'Demo Job',
    context: 'A short context describing demo job.',
    features: [],
    phases: fixturePhases,
    readmeBody: '# Demo Job\n\nReadme body here.',
    ...overrides,
  } as Job;
}

async function renderPage(slug: string) {
  const jsx = await JobPage({ params: Promise.resolve({ slug }) });
  return render(jsx);
}

describe('/build-log/jobs/[slug] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Preserved behavior pins ───

  it('unit_job_overview_h1_renders_job_title', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    await renderPage('demo-job');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Demo Job/);
  });

  it('unit_job_overview_renders_back_link_to_index', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    await renderPage('demo-job');
    const back = screen.getByRole('link', { name: /Back to build log/i });
    expect(back).toHaveAttribute('href', '/build-log');
  });

  it('unit_job_overview_alias_code_when_present', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob({ alias: 'dj' }));
    const { container } = await renderPage('demo-job');
    expect(container.textContent).toContain('dj');
  });

  it('unit_job_overview_alias_omitted_when_absent', async () => {
    const { alias: _omit, ...rest } = makeJob({});
    void _omit;
    mockGetJobBySlug.mockResolvedValue(rest as Job);
    const { container } = await renderPage('demo-job');
    expect(container.textContent).not.toMatch(/Alias:/);
  });

  it('integration_job_overview_mounts_phase_nav', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    await renderPage('demo-job');
    const nav = screen.getByTestId('phase-nav');
    expect(nav.getAttribute('data-job-slug')).toBe('demo-job');
    expect(nav.getAttribute('data-phase-count')).toBe('2');
    expect(nav.getAttribute('data-active')).toBe('');
  });

  it('integration_job_overview_mounts_markdown_document', async () => {
    mockGetJobBySlug.mockResolvedValue(
      makeJob({ readmeBody: '# Custom readme body marker' }),
    );
    await renderPage('demo-job');
    const md = screen.getByTestId('markdown-document');
    expect(md.getAttribute('data-body')).toBe('# Custom readme body marker');
  });

  it('integration_generate_static_params_jobs_one_per_slug', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a' }),
      makeJob({ slug: 'b' }),
      makeJob({ slug: 'c' }),
    ]);
    const params = await generateStaticParams();
    expect(params).toEqual([
      { slug: 'a' },
      { slug: 'b' },
      { slug: 'c' },
    ]);
  });

  it('integration_generate_metadata_returns_title_with_suffix', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob({ title: 'Demo Job' }));
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(meta.title).toBe('Demo Job · Build log');
  });

  it('err_job_overview_unknown_slug_calls_not_found', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    await JobPage({ params: Promise.resolve({ slug: 'bogus' }) });
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it('err_job_overview_generate_metadata_returns_empty_when_missing', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'bogus' }) });
    expect(meta).toEqual({});
  });

  it('data_job_overview_metadata_description_truncates_at_160', async () => {
    const longContext = 'X'.repeat(500);
    mockGetJobBySlug.mockResolvedValue(makeJob({ context: longContext }));
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(typeof meta.description).toBe('string');
    expect((meta.description as string).length).toBe(160);
  });

  it('unit_job_overview_dynamic_params_false', () => {
    expect(dynamicParams).toBe(false);
  });

  // ─── Metadata + JSON-LD (preserved) ───

  it('unit_job_overview_metadata_openGraph_type', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect((meta.openGraph as { type?: string } | undefined)?.type).toBe('article');
  });

  it('unit_job_overview_metadata_openGraph_url_matches_slug', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(meta.openGraph?.url).toBe('/build-log/jobs/demo-job');
  });

  it('unit_job_overview_metadata_twitter_card', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect((meta.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
  });

  it('unit_job_overview_metadata_alternates_canonical', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(meta.alternates?.canonical).toBe('/build-log/jobs/demo-job');
  });

  it('integration_job_overview_json_ld_techarticle', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script!.innerHTML);
    expect(payload['@type']).toBe('TechArticle');
    expect(payload.headline).toBe('Demo Job');
  });

  it('integration_job_overview_json_ld_isPartOf_collection', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.isPartOf?.['@type']).toBe('CollectionPage');
    expect(payload.isPartOf?.url).toBe(`${site.url}/build-log`);
  });

  it('infra_job_overview_json_ld_valid_json', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  it('data_job_overview_json_ld_url_absolute', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.url).toMatch(/^https:\/\/travisgautier\.com\//);
  });

  it('data_job_overview_metadata_canonical_relative', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(meta.alternates?.canonical).not.toMatch(/^https?:\/\//);
    expect(meta.alternates?.canonical).toMatch(/^\//);
  });

  // ─── Brand-aware reskin assertions ───

  it('a11y_job_overview_single_h1', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
  });

  it('a11y_job_overview_back_link_text', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    await renderPage('demo-job');
    const back = screen.getByRole('link', { name: /Back to build log/i });
    expect((back.textContent ?? '').trim().length).toBeGreaterThan(0);
  });

  it('integration_job_overview_parchment_panel_wraps_markdown', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const md = container.querySelector('[data-testid="markdown-document"]');
    expect(md).not.toBeNull();
    // The Parchment surface uses bg-(--color-parchment). The Parchment
    // primitive renders a div with that class as the wrapper.
    const parchmentAncestor = md!.closest('[class*="bg-(--color-parchment)"]');
    expect(parchmentAncestor).not.toBeNull();
  });

  // ─── Source-grep sentinels ───

  it('infra_job_overview_no_banned_placeholder_utilities: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_job_overview_adopts_brand_utilities: page source contains .label AND .display-1', () => {
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
  });

  it('infra_job_overview_imports_brand_primitives: page imports Bone + Section + Parchment from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bBone\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bParchment\b/);
  });

  it('infra_job_overview_forbidden_pattern_sentinel_clean: page source contains no gradient/UI-shadow/pure-color/forbidden-palette tokens', () => {
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
