// /build-log index page tests (styling-overhaul-7.4 hybrid red posture).
//
// Preserves all behavior pins from the pre-7.4 implementation (groupJobs
// grouping order, firstParagraph helper, JSON-LD CollectionPage shape,
// metadata exports, generateMetadata, single-h1 a11y) AND adds brand-
// aware assertions that pin the editorial reskin per phase-7-pages.md
// Feature 7.4:
//   - <Bone> surface wraps the page
//   - <Section rhythm="md"> (py-(--section-y-md))
//   - <Container width="wide"> (max-w-7xl)
//   - .label / .display-1 / .body-1 / .display-2 / .body-2 brand utilities
//     used; no font-display / text-Xxl / text-muted / text-accent /
//     text-link / rounded-lg / border-mist / bg-accent
//   - JobsRollupTable mounted up top
//   - groupJobs grouping PRESERVED (In progress / Planned / Complete)
//   - group section headers use .display-2; counts use .label tabular-nums
//
// Source-level sentinels (infra_*) read src/app/build-log/page.tsx via
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

vi.mock('@/lib/build-log/jobs', () => ({
  getAllJobs: vi.fn(),
}));

vi.mock('@/lib/build-log/pipeline-state', () => ({
  getJobsRollup: vi.fn(),
}));

vi.mock('@/components/build-log/JobCard', () => ({
  JobCard: ({
    rollup,
    excerpt,
  }: {
    rollup: { slug: string; title: string };
    excerpt: string;
  }) => (
    <div data-testid={`job-card-${rollup.slug}`} data-excerpt={excerpt}>
      {rollup.title}
    </div>
  ),
}));

vi.mock('@/components/build-log/JobsRollupTable', () => ({
  JobsRollupTable: ({ rows }: { rows: readonly { slug: string }[] }) => (
    <div data-testid="jobs-rollup-table" data-row-count={rows.length} />
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getJobsRollup } from '@/lib/build-log/pipeline-state';
import BuildLogIndexPage, { metadata } from '../page';
import type { Job, JobRollupEntry } from '@/content/schemas';
import { site } from '@/lib/site';

const mockGetAllJobs = vi.mocked(getAllJobs);
const mockGetJobsRollup = vi.mocked(getJobsRollup);

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

function makeJob(overrides: Partial<Job>): Job {
  return {
    slug: 'demo',
    title: 'Demo Job',
    context: 'Single paragraph context.',
    features: [],
    phases: [],
    readmeBody: '# Demo Job',
    ...overrides,
  } as Job;
}

function makeRollup(overrides: Partial<JobRollupEntry>): JobRollupEntry {
  return {
    slug: 'demo',
    title: 'Demo Job',
    totalFeatures: 0,
    completedFeatures: 0,
    liveFeatures: 0,
    percentComplete: null,
    status: 'unknown',
    ...overrides,
  };
}

async function renderPage() {
  const jsx = await BuildLogIndexPage();
  return render(jsx);
}

describe('/build-log index page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Preserved behavior pins ───

  it('unit_index_page_renders_title_h1', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    await renderPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Build log/i);
  });

  it('unit_index_page_renders_status_link', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    await renderPage();
    const link = screen.getByRole('link', { name: /See live pipeline status/i });
    expect(link).toHaveAttribute('href', '/build-log/status');
  });

  it('unit_index_first_paragraph_helper_single_first', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({
        slug: 'multi-para',
        title: 'Multi Para',
        context: 'First paragraph here.\n\nSecond paragraph that should not appear.',
      }),
    ]);
    mockGetJobsRollup.mockResolvedValue([makeRollup({ slug: 'multi-para', title: 'Multi Para' })]);
    await renderPage();
    const card = screen.getByTestId('job-card-multi-para');
    expect(card.getAttribute('data-excerpt')).toBe('First paragraph here.');
  });

  it('unit_index_first_paragraph_collapses_whitespace', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({
        slug: 'wsp',
        title: 'Whitespace',
        context: 'Line one\n  line two\n\tline three.\n\nNext paragraph.',
      }),
    ]);
    mockGetJobsRollup.mockResolvedValue([makeRollup({ slug: 'wsp', title: 'Whitespace' })]);
    await renderPage();
    const card = screen.getByTestId('job-card-wsp');
    expect(card.getAttribute('data-excerpt')).toBe('Line one line two line three.');
  });

  it('integration_index_one_card_per_job', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'b', title: 'B' }),
      makeJob({ slug: 'c', title: 'C' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A' }),
      makeRollup({ slug: 'b', title: 'B' }),
      makeRollup({ slug: 'c', title: 'C' }),
    ]);
    await renderPage();
    expect(screen.getByTestId('job-card-a')).toBeInTheDocument();
    expect(screen.getByTestId('job-card-b')).toBeInTheDocument();
    expect(screen.getByTestId('job-card-c')).toBeInTheDocument();
  });

  it('integration_index_skips_jobs_without_rollup', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'orphan', title: 'Orphan' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A' }),
    ]);
    await renderPage();
    expect(screen.getByTestId('job-card-a')).toBeInTheDocument();
    expect(screen.queryByTestId('job-card-orphan')).toBeNull();
  });

  it('edge_index_empty_jobs_renders_initializing', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
    // no card grid mounted
    expect(container.querySelector('ul')).toBeNull();
  });

  it('edge_index_first_paragraph_empty_string', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'empty', title: 'Empty', context: '' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([makeRollup({ slug: 'empty', title: 'Empty' })]);
    await renderPage();
    const card = screen.getByTestId('job-card-empty');
    expect(card.getAttribute('data-excerpt')).toBe('');
  });

  it('edge_index_first_paragraph_single_paragraph', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'one', title: 'One', context: 'Just a single paragraph.' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([makeRollup({ slug: 'one', title: 'One' })]);
    await renderPage();
    const card = screen.getByTestId('job-card-one');
    expect(card.getAttribute('data-excerpt')).toBe('Just a single paragraph.');
  });

  it('a11y_index_single_h1', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'b', title: 'B' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A' }),
      makeRollup({ slug: 'b', title: 'B' }),
    ]);
    const { container } = await renderPage();
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
  });

  // ─── Metadata + JSON-LD (preserved) ───

  it('unit_index_metadata_title_preserved', () => {
    expect(metadata.title).toBe('Build log');
  });

  it('unit_index_metadata_openGraph_url', () => {
    expect(metadata.openGraph?.url).toBe('/build-log');
  });

  it('unit_index_metadata_openGraph_type', () => {
    expect((metadata.openGraph as { type?: string } | undefined)?.type).toBe('website');
  });

  it('unit_index_metadata_twitter_card', () => {
    expect((metadata.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
  });

  it('unit_index_metadata_alternates_canonical', () => {
    expect(metadata.alternates?.canonical).toBe('/build-log');
  });

  it('integration_index_json_ld_collection_page', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script!.innerHTML);
    expect(payload['@type']).toBe('CollectionPage');
  });

  it('integration_index_json_ld_name_and_url', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.name).toBe('Build log');
    expect(payload.url).toBe(`${site.url}/build-log`);
  });

  it('infra_index_json_ld_valid_json', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  it('err_index_renders_when_no_jobs', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
  });

  it('data_index_json_ld_urls_absolute', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.url).toMatch(/^https:\/\/travisgautier\.com\//);
    if (payload.isPartOf?.url) {
      expect(payload.isPartOf.url).toMatch(/^https:\/\/travisgautier\.com/);
    }
  });

  // ─── Brand-aware reskin assertions ───

  it('unit_index_group_headings_render_when_items', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'b', title: 'B' }),
      makeJob({ slug: 'c', title: 'C' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A', status: 'in-progress' }),
      makeRollup({ slug: 'b', title: 'B', status: 'planned' }),
      makeRollup({ slug: 'c', title: 'C', status: 'complete' }),
    ]);
    await renderPage();
    expect(screen.getByRole('heading', { level: 2, name: /In progress/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Planned/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Complete/i })).toBeInTheDocument();
  });

  it('unit_index_empty_groups_collapse', async () => {
    mockGetAllJobs.mockResolvedValue([makeJob({ slug: 'a', title: 'A' })]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A', status: 'in-progress' }),
    ]);
    await renderPage();
    expect(screen.getByRole('heading', { level: 2, name: /In progress/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: /^Planned$/i })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: /^Complete$/i })).toBeNull();
  });

  it('integration_index_groups_partition_by_status', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'b', title: 'B' }),
      makeJob({ slug: 'c', title: 'C' }),
      makeJob({ slug: 'd', title: 'D' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A', status: 'in-progress' }),
      makeRollup({ slug: 'b', title: 'B', status: 'planned' }),
      makeRollup({ slug: 'c', title: 'C', status: 'unknown' }),
      makeRollup({ slug: 'd', title: 'D', status: 'complete' }),
    ]);
    await renderPage();
    // unknown jobs collapse into Planned group per groupJobs
    expect(screen.getByRole('heading', { level: 2, name: /In progress/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Planned/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Complete/i })).toBeInTheDocument();
  });

  it('integration_index_card_grid_class', async () => {
    mockGetAllJobs.mockResolvedValue([makeJob({ slug: 'a', title: 'A' })]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A', status: 'in-progress' }),
    ]);
    const { container } = await renderPage();
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul!.className).toMatch(/grid-cols-1/);
    expect(ul!.className).toMatch(/md:grid-cols-2/);
    expect(ul!.className).toMatch(/gap-\(--space-4\)/);
  });

  it('data_index_groups_total_matches_input', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'b', title: 'B' }),
      makeJob({ slug: 'c', title: 'C' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A', status: 'in-progress' }),
      makeRollup({ slug: 'b', title: 'B', status: 'planned' }),
      makeRollup({ slug: 'c', title: 'C', status: 'complete' }),
    ]);
    const { container } = await renderPage();
    const cards = container.querySelectorAll('[data-testid^="job-card-"]');
    expect(cards).toHaveLength(3);
  });

  it('a11y_index_group_sections_aria_labelledby', async () => {
    mockGetAllJobs.mockResolvedValue([makeJob({ slug: 'a', title: 'A' })]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A', status: 'in-progress' }),
    ]);
    const { container } = await renderPage();
    const section = container.querySelector('section[aria-labelledby="group-in-progress"]');
    expect(section).not.toBeNull();
    const h2 = container.querySelector('h2#group-in-progress');
    expect(h2).not.toBeNull();
  });

  it('a11y_index_status_link_accessible_name', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    await renderPage();
    const link = screen.getByRole('link', { name: /See live pipeline status/i });
    expect((link.textContent ?? '').trim().length).toBeGreaterThan(0);
  });

  // ─── Source-grep sentinels ───

  it('infra_index_no_banned_placeholder_utilities: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_index_adopts_brand_utilities: page source contains .label AND .display-1 AND .body-1', () => {
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bbody-1\b/);
  });

  it('infra_index_imports_brand_primitives: page imports Bone + Section from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bBone\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
  });

  it('infra_index_forbidden_pattern_sentinel_clean: page source contains no gradient/UI-shadow/pure-color/forbidden-palette tokens', () => {
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
