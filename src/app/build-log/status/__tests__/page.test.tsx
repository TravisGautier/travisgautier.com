// /build-log/status page tests (styling-overhaul-7.4 hybrid red).
//
// Preserves all behavior pins (h1 = Pipeline status, four parallel loader
// calls, current-state dl, JobsRollupTable mount, live-worktrees + completed
// + notes sections, extractSectionId helper, JSON-LD CollectionPage,
// metadata exports, aria-labelledby chain) and adds brand-aware assertions:
//   - <Bone> surface + <Section rhythm="md"> + <Container width="wide">
//   - .label kicker + .display-1 title + .body-1 subtitle
//   - .display-2 on section headings
//   - mono font on slugs / pids / IDs
//
// Source-level sentinels enforce brand utility adoption.

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

vi.mock('@/lib/build-log/pipeline-state', () => ({
  getSessionStatus: vi.fn(),
  getKnowledgeFile: vi.fn(),
  getJobsRollup: vi.fn(),
}));

vi.mock('@/lib/build-log/worktree-state', () => ({
  getLiveWorktrees: vi.fn(),
}));

vi.mock('@/components/build-log/JobsRollupTable', () => ({
  JobsRollupTable: ({ rows }: { rows: readonly { slug: string; title: string }[] }) => (
    <div data-testid="jobs-rollup-table" data-row-count={rows.length}>
      {rows.map((r) => (
        <span key={r.slug} data-testid={`rollup-row-${r.slug}`}>
          {r.title}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/build-log/MarkdownDocument', () => ({
  MarkdownDocument: ({ body }: { body: string }) => (
    <div data-testid="markdown-document" data-body={body}>
      {body}
    </div>
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSessionStatus,
  getKnowledgeFile,
  getJobsRollup,
} from '@/lib/build-log/pipeline-state';
import { getLiveWorktrees } from '@/lib/build-log/worktree-state';
import StatusPage, { metadata } from '../page';
import { site } from '@/lib/site';
import type {
  SessionStatus,
  KnowledgeFile,
  JobRollupEntry,
} from '@/content/schemas';

const mockSession = vi.mocked(getSessionStatus);
const mockKnowledge = vi.mocked(getKnowledgeFile);
const mockRollup = vi.mocked(getJobsRollup);
const mockLiveWorktrees = vi.mocked(getLiveWorktrees);

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

function makeSession(overrides: Partial<SessionStatus> = {}): SessionStatus {
  return {
    id: '2026-04-13-001',
    startedAt: '2026-04-13T00:00:00Z',
    currentPhase: 'build-in-public-docs',
    currentSection: 'build-in-public-docs-2.3',
    currentAgent: 'red',
    currentStage: 'red-in-progress',
    completedSections: [],
    notes: undefined,
    ...overrides,
  } as SessionStatus;
}

function makeKnowledge(overrides: Partial<KnowledgeFile> = {}): KnowledgeFile {
  return {
    version: 1,
    project: 'travisgautier',
    description: undefined,
    projectContext: undefined,
    openQuestions: undefined,
    ...overrides,
  } as KnowledgeFile;
}

function makeRollupEntry(overrides: Partial<JobRollupEntry> = {}): JobRollupEntry {
  return {
    slug: 'demo',
    title: 'Demo Job',
    alias: 'dj',
    totalFeatures: 5,
    completedFeatures: 1,
    liveFeatures: 0,
    percentComplete: 20,
    status: 'in-progress',
    ...overrides,
  };
}

async function renderPage() {
  const jsx = await StatusPage();
  return render(jsx);
}

describe('/build-log/status page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(makeSession());
    mockKnowledge.mockResolvedValue(makeKnowledge());
    mockRollup.mockResolvedValue([]);
    mockLiveWorktrees.mockResolvedValue([]);
  });

  // ─── Preserved behavior pins ───

  it('unit_status_h1_renders_pipeline_status', async () => {
    await renderPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Pipeline status/i);
  });

  it('unit_status_session_id_renders', async () => {
    mockSession.mockResolvedValue(makeSession({ id: '2026-04-13-XYZ' }));
    await renderPage();
    expect(screen.getByText('2026-04-13-XYZ')).toBeInTheDocument();
  });

  it('unit_status_current_section_renders', async () => {
    mockSession.mockResolvedValue(makeSession({ currentSection: 'foo-1.2' }));
    await renderPage();
    expect(screen.getByText('foo-1.2')).toBeInTheDocument();
  });

  it('unit_status_renders_back_link_to_build_log', async () => {
    await renderPage();
    const link = screen.getByRole('link', { name: /Back to build log/i });
    expect(link).toHaveAttribute('href', '/build-log');
  });

  it('unit_status_jobs_rollup_table_mounted', async () => {
    mockRollup.mockResolvedValue([
      makeRollupEntry({ slug: 'a', title: 'A' }),
      makeRollupEntry({ slug: 'b', title: 'B' }),
    ]);
    await renderPage();
    const table = screen.getByTestId('jobs-rollup-table');
    expect(table).toBeInTheDocument();
    expect(table.getAttribute('data-row-count')).toBe('2');
    expect(screen.getByTestId('rollup-row-a')).toBeInTheDocument();
    expect(screen.getByTestId('rollup-row-b')).toBeInTheDocument();
  });

  it('integration_status_renders_all_sections', async () => {
    mockSession.mockResolvedValue(
      makeSession({
        completedSections: ['foo-1.1', 'foo-1.2'],
        notes: 'Some notes here',
      }),
    );
    await renderPage();
    expect(screen.getByRole('heading', { level: 2, name: /Current state/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Jobs at a glance/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Completed sections/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Notes/i })).toBeInTheDocument();
  });

  it('integration_status_loads_four_parallel_sources', async () => {
    await renderPage();
    expect(mockSession).toHaveBeenCalledTimes(1);
    expect(mockKnowledge).toHaveBeenCalledTimes(1);
    expect(mockRollup).toHaveBeenCalledTimes(1);
    expect(mockLiveWorktrees).toHaveBeenCalledTimes(1);
  });

  it('integration_status_live_worktrees_list_renders', async () => {
    mockLiveWorktrees.mockResolvedValue([
      {
        sectionId: 'cohort-enrollment-4.1',
        slotPath: '/tmp/wt/section-cohort-enrollment-4.1',
        branch: 'refs/heads/section/cohort-enrollment-4.1',
        pid: 42,
        currentPhase: 'red',
      },
      {
        sectionId: 'styling-overhaul-3.1',
        slotPath: '/tmp/wt/section-styling-overhaul-3.1',
        branch: 'refs/heads/section/styling-overhaul-3.1',
        pid: 99,
      },
    ]);
    const { container } = await renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /Live worktrees/i }),
    ).toBeInTheDocument();
    const section = container.querySelector(
      'section[aria-labelledby="live-worktrees"]',
    );
    expect(section).not.toBeNull();
    expect(section!.textContent).toMatch(/cohort-enrollment-4\.1/);
    expect(section!.textContent).toMatch(/styling-overhaul-3\.1/);
    expect(section!.textContent).toMatch(/phase: red/);
    expect(section!.textContent).toMatch(/pid: 42/);
    expect(section!.textContent).toMatch(/pid: 99/);
  });

  it('edge_status_empty_live_worktrees', async () => {
    mockLiveWorktrees.mockResolvedValue([]);
    const { container } = await renderPage();
    const section = container.querySelector(
      'section[aria-labelledby="live-worktrees"]',
    );
    expect(section).not.toBeNull();
    expect(section!.textContent).toMatch(/No live pipeline sections/i);
  });

  it('edge_status_live_worktree_missing_current_phase_renders_em_dash', async () => {
    mockLiveWorktrees.mockResolvedValue([
      {
        sectionId: 'foo-1.1',
        slotPath: '/tmp/wt/section-foo-1.1',
        branch: 'refs/heads/section/foo-1.1',
        pid: 7,
      },
    ]);
    const { container } = await renderPage();
    const section = container.querySelector(
      'section[aria-labelledby="live-worktrees"]',
    );
    expect(section!.textContent).toMatch(/phase: —/);
  });

  it('edge_status_live_worktree_missing_pid_renders_em_dash', async () => {
    mockLiveWorktrees.mockResolvedValue([
      {
        sectionId: 'foo-1.1',
        slotPath: '/tmp/wt/section-foo-1.1',
        branch: 'refs/heads/section/foo-1.1',
        currentPhase: 'red',
      },
    ]);
    const { container } = await renderPage();
    const section = container.querySelector(
      'section[aria-labelledby="live-worktrees"]',
    );
    expect(section!.textContent).toMatch(/pid: —/);
  });

  it('integration_status_completed_sections_renders_li_per_entry', async () => {
    mockSession.mockResolvedValue(
      makeSession({
        completedSections: [
          'foo-1.1',
          { section: 'foo-1.2', completedAt: '2026-04-12T00:00:00Z' },
          'bar-2.1',
        ],
      }),
    );
    const { container } = await renderPage();
    const items = container.querySelectorAll('section[aria-labelledby="completed"] li');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe('foo-1.1');
    expect(items[1].textContent).toBe('foo-1.2');
    expect(items[2].textContent).toBe('bar-2.1');
  });

  it('edge_status_empty_completed_sections', async () => {
    mockSession.mockResolvedValue(makeSession({ completedSections: [] }));
    const { container } = await renderPage();
    expect(screen.getByText(/No sections shipped yet/i)).toBeInTheDocument();
    const completedSection = container.querySelector('section[aria-labelledby="completed"]');
    expect(completedSection?.querySelector('ul')).toBeNull();
  });

  it('err_status_handles_empty_session', async () => {
    mockSession.mockResolvedValue(
      makeSession({ currentSection: '', currentAgent: '', currentStage: '' }),
    );
    const { container } = await renderPage();
    const dl = container.querySelector('dl');
    const dds = Array.from(dl?.querySelectorAll('dd') ?? []);
    const labels = Array.from(dl?.querySelectorAll('dt') ?? []).map((dt) => dt.textContent);
    const idx = (text: string) => labels.findIndex((l) => l && new RegExp(text, 'i').test(l));
    expect(dds[idx('Current section')].textContent).toBe('—');
    expect(dds[idx('Current agent')].textContent).toBe('—');
    expect(dds[idx('Current stage')].textContent).toBe('—');
  });

  it('edge_status_omits_notes_section_when_empty', async () => {
    mockSession.mockResolvedValue(makeSession({ notes: undefined }));
    mockKnowledge.mockResolvedValue(makeKnowledge({ projectContext: undefined }));
    const { container } = await renderPage();
    expect(container.querySelector('section[aria-labelledby="notes"]')).toBeNull();
  });

  it('edge_status_renders_notes_when_present', async () => {
    mockSession.mockResolvedValue(makeSession({ notes: '## Heading\n\nSome **markdown** body.' }));
    const { container } = await renderPage();
    const notesSection = container.querySelector('section[aria-labelledby="notes"]');
    expect(notesSection).not.toBeNull();
    const md = screen.getByTestId('markdown-document');
    expect(md.getAttribute('data-body')).toBe('## Heading\n\nSome **markdown** body.');
  });

  it('edge_status_omits_started_at_when_undefined', async () => {
    mockSession.mockResolvedValue(makeSession({ startedAt: undefined }));
    const { container } = await renderPage();
    const dts = Array.from(container.querySelectorAll('dt')).map((dt) => dt.textContent);
    expect(dts.some((t) => t && /Started/i.test(t))).toBe(false);
  });

  it('data_status_extractSectionId_string_branch', async () => {
    mockSession.mockResolvedValue(makeSession({ completedSections: ['foo-1.1'] }));
    const { container } = await renderPage();
    const items = container.querySelectorAll('section[aria-labelledby="completed"] li');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('foo-1.1');
  });

  it('data_status_extractSectionId_object_branch', async () => {
    mockSession.mockResolvedValue(
      makeSession({
        completedSections: [{ section: 'foo-1.2', completedAt: '2026-04-12T00:00:00Z' }],
      }),
    );
    const { container } = await renderPage();
    const items = container.querySelectorAll('section[aria-labelledby="completed"] li');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('foo-1.2');
  });

  it('data_status_completed_sections_preserves_order', async () => {
    mockSession.mockResolvedValue(
      makeSession({ completedSections: ['z-9.9', 'a-1.1', 'm-5.5'] }),
    );
    const { container } = await renderPage();
    const items = container.querySelectorAll('section[aria-labelledby="completed"] li');
    expect(Array.from(items).map((li) => li.textContent)).toEqual([
      'z-9.9',
      'a-1.1',
      'm-5.5',
    ]);
  });

  // ─── Metadata + JSON-LD (preserved) ───

  it('unit_status_metadata_title_preserved', () => {
    expect(metadata.title).toBe('Pipeline status · Build log');
  });

  it('unit_status_metadata_description', () => {
    expect(typeof metadata.description).toBe('string');
    expect((metadata.description as string).length).toBeGreaterThan(0);
  });

  it('unit_status_default_export_is_async', () => {
    expect(StatusPage.constructor.name).toBe('AsyncFunction');
  });

  it('unit_status_metadata_openGraph_url', () => {
    expect(metadata.openGraph?.url).toBe('/build-log/status');
  });

  it('unit_status_metadata_twitter_card', () => {
    expect((metadata.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
  });

  it('unit_status_metadata_canonical_preserved', () => {
    expect(metadata.alternates?.canonical).toBe('/build-log/status');
  });

  it('integration_status_json_ld_collection_page', async () => {
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script!.innerHTML);
    expect(payload['@type']).toBe('CollectionPage');
    expect(payload.name).toBe('Pipeline status');
    expect(payload.url).toBe(`${site.url}/build-log/status`);
  });

  it('infra_status_json_ld_valid_json', async () => {
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  // ─── Brand-aware reskin assertions ───

  it('a11y_status_single_h1', async () => {
    const { container } = await renderPage();
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
  });

  it('a11y_status_current_state_uses_dl_dt_dd', async () => {
    const { container } = await renderPage();
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
    expect((dl!.querySelectorAll('dt').length)).toBeGreaterThan(0);
    expect((dl!.querySelectorAll('dd').length)).toBeGreaterThan(0);
  });

  it('a11y_status_sections_aria_labelledby', async () => {
    mockSession.mockResolvedValue(makeSession({ notes: 'something' }));
    const { container } = await renderPage();
    expect(container.querySelector('section[aria-labelledby="current-state"] h2#current-state')).not.toBeNull();
    expect(container.querySelector('section[aria-labelledby="rollup"] h2#rollup')).not.toBeNull();
    expect(container.querySelector('section[aria-labelledby="live-worktrees"] h2#live-worktrees')).not.toBeNull();
    expect(container.querySelector('section[aria-labelledby="completed"] h2#completed')).not.toBeNull();
    expect(container.querySelector('section[aria-labelledby="notes"] h2#notes')).not.toBeNull();
  });

  // ─── Source-grep sentinels ───

  it('infra_status_no_banned_placeholder_utilities: page source contains ZERO banned tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_status_adopts_brand_utilities: page source contains .label AND .display-1 AND .display-2', () => {
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-2\b/);
  });

  it('infra_status_imports_brand_primitives: page imports Bone + Section from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bBone\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
  });

  it('infra_status_forbidden_pattern_sentinel_clean: page source contains no gradient/UI-shadow/pure-color/forbidden-palette tokens', () => {
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
