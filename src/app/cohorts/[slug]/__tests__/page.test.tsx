// Cohort detail (styling-overhaul-7.5) — brand-aware assertions.
//
// Hybrid red posture (so-7.3/7.4 precedent): preserves data-flow + status
// CTA + JSON-LD pins (Course shape, provider Organization, hasCourseInstance
// workload, offers price/currency/availability per status, generateMetadata,
// generateStaticParams, dynamicParams === false, notFound when slug
// missing) and adds brand-surface pins (MDX in .build-log-prose wrapper,
// CTA section in brand surface, banned-token source-grep sentinel).

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

vi.mock('@/lib/content/cohorts', () => ({
  getAllCohorts: vi.fn(),
  getCohortBySlug: vi.fn(),
}));

vi.mock('@/components/cohorts/CohortDetailHero', () => ({
  CohortDetailHero: ({ cohort }: { cohort: { title: string } }) => (
    <div data-testid="cohort-hero">{cohort.title}</div>
  ),
}));

vi.mock('@/components/cohorts/WaitlistForm', () => ({
  WaitlistForm: ({
    cohortSlug,
    sourceTag,
  }: {
    cohortSlug: string;
    sourceTag?: string;
  }) => (
    <div
      data-testid="waitlist-form"
      data-cohort-slug={cohortSlug}
      data-source-tag={sourceTag ?? ''}
    >
      WaitlistForm
    </div>
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import { getAllCohorts, getCohortBySlug } from '@/lib/content/cohorts';
import { site } from '@/lib/site';
import CohortDetailPage, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from '../page';

const mockGetCohortBySlug = vi.mocked(getCohortBySlug);
const mockGetAllCohorts = vi.mocked(getAllCohorts);
const mockNotFound = vi.mocked(notFound);

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const PAGE_SOURCE_PATH = join(__dirname_compat, '..', 'page.tsx');
const PAGE_SOURCE = readFileSync(PAGE_SOURCE_PATH, 'utf8');

// Banned placeholder utilities. Note: `prose` is forbidden as a standalone
// word/utility (not followed by `-`) — but `build-log-prose` contains `prose`
// as a substring and IS allowed. The dedicated infra test below uses a
// word-boundary regex `\bprose\b(?!-)` to express this precisely.
const BANNED_PLACEHOLDER_UTILITIES = [
  'text-muted',
  'font-display',
  'text-4xl',
  'text-3xl',
  'text-2xl',
  'text-xl',
  'text-lg',
  'text-sm',
  'border-mist',
  'rounded-md',
  'rounded-lg',
  'text-link',
  'text-accent',
  'bg-accent',
  'text-parchment',
];

const MOCK_MDX_COMPONENT = () => (
  <div data-testid="mdx-body">Cohort MDX content</div>
);

const MOCK_COHORT_ANNOUNCED = {
  meta: {
    id: 'cohort-001',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Intensive',
    series: 'AI Delivery',
    tagline: 'Ship real AI projects in 6 weeks.',
    summary: 'An intensive cohort for solo consultants.',
    status: 'announced' as const,
    pillar: 'delivery' as const,
    startDate: '2026-07-06',
    endDate: '2026-08-14',
    durationWeeks: 6,
    capacity: 12,
    priceCents: 249900,
    currency: 'usd',
    stripePriceId: 'price_REPLACEMEBEFORESHIPPING_ai_delivery',
    commitmentHoursPerWeek: 10,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-01',
  },
  slug: 'ai-delivery-2026-q3',
  Component: MOCK_MDX_COMPONENT,
};

const MOCK_COHORT_OPEN = {
  meta: {
    ...MOCK_COHORT_ANNOUNCED.meta,
    id: 'cohort-002',
    slug: 'workflow-mastery-2026-q4',
    title: 'Workflow Mastery',
    status: 'open' as const,
    pillar: 'workflow' as const,
  },
  slug: 'workflow-mastery-2026-q4',
  Component: MOCK_MDX_COMPONENT,
};

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderDetail(slug = 'ai-delivery-2026-q3') {
  const jsx = await CohortDetailPage(makeParams(slug));
  return render(jsx);
}

function findJsonLd(container: HTMLElement): Record<string, unknown> | null {
  const script = container.querySelector(
    'script[type="application/ld+json"]',
  );
  if (!script || !script.textContent) return null;
  return JSON.parse(script.textContent) as Record<string, unknown>;
}

describe('CohortDetailPage (styling-overhaul-7.5) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_ANNOUNCED);
    mockGetAllCohorts.mockResolvedValue([
      MOCK_COHORT_ANNOUNCED,
      MOCK_COHORT_OPEN,
    ]);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — chrome
  // ────────────────────────────────────────────────────────────────

  it('unit_cohorts_detail_hero_preserved: CohortDetailHero mounted (so-6.4 reskin reused)', async () => {
    await renderDetail();
    expect(screen.getByTestId('cohort-hero')).toBeInTheDocument();
  });

  it('unit_cohorts_detail_mdx_in_build_log_prose: MDX Component rendered inside .build-log-prose wrapper (NOT .prose .max-w-2xl)', async () => {
    const { container } = await renderDetail();
    const proseWrapper = container.querySelector('.build-log-prose');
    expect(proseWrapper).not.toBeNull();
    const mdx = proseWrapper!.querySelector('[data-testid="mdx-body"]');
    expect(mdx).not.toBeNull();
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — CTA status branches (preserved)
  // ────────────────────────────────────────────────────────────────

  it('unit_cohorts_detail_cta_announced_preserved: announced status renders WaitlistForm with cohortSlug + sourceTag', async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_ANNOUNCED);
    await renderDetail();
    const form = screen.getByTestId('waitlist-form');
    expect(form).toBeInTheDocument();
    expect(form.getAttribute('data-cohort-slug')).toBe('ai-delivery-2026-q3');
    expect(form.getAttribute('data-source-tag')).toBe('cohort-detail');
  });

  it('unit_cohorts_detail_cta_open_apply_link_preserved: open status renders Apply link to /cohorts/{slug}/apply', async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_OPEN);
    await renderDetail('workflow-mastery-2026-q4');
    const link = screen.getByRole('link', { name: /apply to this cohort/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe(
      '/cohorts/workflow-mastery-2026-q4/apply',
    );
  });

  it("unit_cohorts_detail_cta_closed_preserved: closed status renders 'Applications are closed' copy", async () => {
    const closed = {
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, status: 'closed' as const },
    };
    mockGetCohortBySlug.mockResolvedValue(closed);
    await renderDetail();
    expect(screen.getByText(/Applications are closed/i)).toBeInTheDocument();
  });

  it('unit_cohorts_detail_cta_enrolled_preserved: enrolled status renders waitlist-prompt copy', async () => {
    const enrolled = {
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, status: 'enrolled' as const },
    };
    mockGetCohortBySlug.mockResolvedValue(enrolled);
    await renderDetail();
    expect(screen.getByText(/waitlist/i)).toBeInTheDocument();
  });

  it('unit_cohorts_detail_cta_section_brand_surface: CTA wrapper uses brand surface (Bone/Marble/edge token) — no rounded-md border border-mist placeholder', async () => {
    const { container } = await renderDetail();
    // The CTA wrapper must NOT carry the placeholder utility stack
    const placeholder = container.querySelector(
      '.rounded-md.border.border-mist',
    );
    expect(placeholder).toBeNull();
    // The CTA section ('cta-heading') must exist and contain at least one
    // brand-surface marker (bg-(--color-bone), bg-(--color-marble), or
    // border-(--edge-color))
    const ctaSection = container.querySelector(
      'section[aria-labelledby="cta-heading"]',
    );
    expect(ctaSection).not.toBeNull();
    const html = ctaSection!.innerHTML;
    const hasBrandSurface =
      /bg-\(--color-bone\)/.test(html) ||
      /bg-\(--color-marble\)/.test(html) ||
      /border-\(--edge-color\)/.test(html);
    expect(hasBrandSurface).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────
  // Integration — JSON-LD shape (preserved)
  // ────────────────────────────────────────────────────────────────

  it('int_cohorts_detail_jsonld_course_preserved: JSON-LD shape preserves Course + provider + hasCourseInstance + offers', async () => {
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Course');
    expect(ld.name).toBe('AI Delivery Intensive');
    expect(ld.description).toBe('An intensive cohort for solo consultants.');

    const provider = ld.provider as Record<string, unknown>;
    expect(provider['@type']).toBe('Organization');
    expect(provider.name).toBe(site.name);

    const ci = ld.hasCourseInstance as Record<string, unknown>;
    expect(ci['@type']).toBe('CourseInstance');
    expect(ci.courseMode).toBe('Online');
    expect(ci.startDate).toBe('2026-07-06');
    expect(ci.endDate).toBe('2026-08-14');
    expect(ci.courseWorkload).toBe('PT10H');

    const offers = ld.offers as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.price).toBe('2499.00');
    expect(offers.priceCurrency).toBe('USD');
    // announced → PreOrder
    expect(offers.availability).toBe('https://schema.org/PreOrder');
  });

  it("int_cohorts_detail_jsonld_availability_open_instock: open status → offers.availability=InStock", async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_OPEN);
    const { container } = await renderDetail('workflow-mastery-2026-q4');
    const ld = findJsonLd(container)!;
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/InStock');
  });

  it('int_cohorts_detail_jsonld_availability_other_soldout: closed/enrolled/shipped status → offers.availability=SoldOut', async () => {
    for (const status of ['closed', 'enrolled', 'shipped'] as const) {
      mockGetCohortBySlug.mockResolvedValue({
        ...MOCK_COHORT_ANNOUNCED,
        meta: { ...MOCK_COHORT_ANNOUNCED.meta, status },
      });
      const { container, unmount } = await renderDetail();
      const ld = findJsonLd(container)!;
      const offers = ld.offers as Record<string, unknown>;
      expect(offers.availability).toBe('https://schema.org/SoldOut');
      unmount();
    }
  });

  // ────────────────────────────────────────────────────────────────
  // Integration — Next route exports (preserved)
  // ────────────────────────────────────────────────────────────────

  it('int_cohorts_detail_generate_metadata_preserved: generateMetadata returns title/description/openGraph for valid slug', async () => {
    const meta = await generateMetadata(makeParams('ai-delivery-2026-q3'));
    expect(meta.title).toBe('AI Delivery Intensive');
    expect(meta.description).toBe('An intensive cohort for solo consultants.');
    const og = meta.openGraph as {
      type?: string;
      title?: string;
      description?: string;
    } | undefined;
    expect(og).toBeDefined();
    expect(og?.title).toBe('AI Delivery Intensive');
    expect(og?.description).toBe('An intensive cohort for solo consultants.');
    expect(og?.type).toBe('website');
  });

  it('int_cohorts_detail_static_params_preserved: generateStaticParams returns one entry per cohort + dynamicParams === false', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([
      { slug: 'ai-delivery-2026-q3' },
      { slug: 'workflow-mastery-2026-q4' },
    ]);
    expect(dynamicParams).toBe(false);
  });

  it('int_cohorts_detail_not_found_preserved: getCohortBySlug → null triggers notFound() + returns undefined', async () => {
    mockGetCohortBySlug.mockResolvedValue(null);
    const jsx = await CohortDetailPage(makeParams('nonexistent'));
    expect(mockNotFound).toHaveBeenCalled();
    expect(jsx).toBeUndefined();
  });

  // ────────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels
  // ────────────────────────────────────────────────────────────────

  it('infra_cohorts_detail_no_placeholder_tokens: page source contains ZERO banned placeholder utilities', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_cohorts_detail_no_bare_prose_class: page source contains no bare `prose` utility (build-log-prose + width="prose" prop allowed)', () => {
    // Block legacy `prose mt-16 max-w-2xl` className pattern: bare `prose`
    // followed by whitespace + another tailwind utility. Allows:
    //   - `build-log-prose` (prose preceded by `-`)
    //   - `width="prose"` (prose followed by `"`)
    expect(PAGE_SOURCE).not.toMatch(/(?<!-)\bprose\s+[a-z]/);
    // Also forbid the legacy stacked placeholder explicitly.
    expect(PAGE_SOURCE).not.toMatch(/rounded-md\s+border\s+border-mist/);
  });

  it('infra_cohorts_detail_adopts_build_log_prose: page source contains the build-log-prose class for MDX body', () => {
    expect(PAGE_SOURCE).toMatch(/\bbuild-log-prose\b/);
  });

  // ────────────────────────────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────────────────────────────

  it("edge_cohorts_detail_shipped_status: status='shipped' renders 'This cohort has shipped.' fallback copy", async () => {
    const shipped = {
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, status: 'shipped' as const },
    };
    mockGetCohortBySlug.mockResolvedValue(shipped);
    await renderDetail();
    expect(screen.getByText(/This cohort has shipped/i)).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // Error recovery
  // ────────────────────────────────────────────────────────────────

  it("err_cohorts_detail_metadata_missing_slug: generateMetadata returns { title: 'Cohort not found' } for unknown slug", async () => {
    mockGetCohortBySlug.mockResolvedValue(null);
    const meta = await generateMetadata(makeParams('nonexistent'));
    expect(meta.title).toBe('Cohort not found');
  });
});
