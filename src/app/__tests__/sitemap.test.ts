import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
}));
vi.mock('@/lib/content/cases', () => ({
  getAllCases: vi.fn(),
}));
vi.mock('@/lib/build-log/jobs', () => ({
  getAllJobs: vi.fn(),
}));
vi.mock('@/lib/content/products', () => ({
  getAllProducts: vi.fn(),
}));
vi.mock('@/lib/content/cohorts', () => ({
  getAllCohorts: vi.fn(),
}));

import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getAllProducts } from '@/lib/content/products';
import { getAllCohorts } from '@/lib/content/cohorts';
import sitemap from '../sitemap';
import { site } from '@/lib/site';

const mockGetAllEpisodes = vi.mocked(getAllEpisodes);
const mockGetAllCases = vi.mocked(getAllCases);
const mockGetAllJobs = vi.mocked(getAllJobs);
const mockGetAllProducts = vi.mocked(getAllProducts);
const mockGetAllCohorts = vi.mocked(getAllCohorts);

const MOCK_JOB = {
  slug: 'website-foundation',
  title: 'Website Foundation',
  alias: 'wf',
  context: 'ctx',
  features: [],
  phases: [
    { slug: 'phase-1-foundation', filename: 'phase-1-foundation.md', header: {}, body: '' },
    { slug: 'phase-2-content-loader', filename: 'phase-2-content-loader.md', header: {}, body: '' },
  ],
  readmeBody: '# Website Foundation',
};

const MOCK_EPISODE = {
  meta: {
    id: 'ep-001',
    slug: 'ep-slug',
    title: 'Ep',
    series: 'S',
    episodeNumber: 1,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'x',
    sourceMaterialIds: [],
    lllEntryUrls: [],
    publishedAt: '2026-03-15T00:00:00Z',
  },
  slug: 'ep-slug',
  Component: () => null,
};

const MOCK_EPISODE_NO_DATE = {
  ...MOCK_EPISODE,
  meta: { ...MOCK_EPISODE.meta, publishedAt: undefined },
  slug: 'ep-no-date',
};

const MOCK_CASE = {
  meta: {
    id: 'case-001',
    slug: 'case-slug',
    title: 'Case',
    client: 'Client',
    status: 'active' as const,
    summary: 'x',
    problem: 'x',
    marketResearch: '',
    discoveryProcess: '',
    technicalDecisions: '',
    deliverables: [],
    outcome: 'x',
    relatedEpisodeIds: [],
    lllEntryUrls: [],
    shippedAt: '2026-02-01T00:00:00Z',
  },
  slug: 'case-slug',
  Component: () => null,
};

const MOCK_PRODUCT = {
  meta: {
    id: 'prod-wf',
    slug: 'workflow-templates',
    title: 'Workflow Templates Pro',
    tagline: 'Ship projects faster.',
    summary: 'Templates for delivery.',
    category: 'workflow-templates' as const,
    licenseType: 'single-user' as const,
    priceCents: 4900,
    currency: 'usd',
    stripePriceId: 'price_wf',
    assetFilename: 'workflow-templates.zip',
    heroImageUrl: 'https://example.com/hero.jpg',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-12T00:00:00Z',
  },
  slug: 'workflow-templates',
  Component: () => null,
};

const MOCK_PRODUCT_2 = {
  ...MOCK_PRODUCT,
  meta: { ...MOCK_PRODUCT.meta, id: 'prod-dt', slug: 'discovery-toolkit', title: 'Discovery Toolkit', publishedAt: '2026-03-01T00:00:00Z' },
  slug: 'discovery-toolkit',
};

describe('sitemap', () => {
  beforeEach(() => {
    mockGetAllEpisodes.mockReset();
    mockGetAllCases.mockReset();
    mockGetAllJobs.mockReset();
    mockGetAllProducts.mockReset();
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODE]);
    mockGetAllCases.mockResolvedValue([MOCK_CASE]);
    mockGetAllJobs.mockResolvedValue([MOCK_JOB] as unknown as Awaited<ReturnType<typeof getAllJobs>>);
    mockGetAllProducts.mockResolvedValue([MOCK_PRODUCT, MOCK_PRODUCT_2] as unknown as Awaited<ReturnType<typeof getAllProducts>>);
    mockGetAllCohorts.mockReset();
    mockGetAllCohorts.mockResolvedValue([
      {
        meta: {
          slug: 'ai-delivery-2026-q3',
          publishedAt: '2026-04-01T00:00:00Z',
        },
        slug: 'ai-delivery-2026-q3',
        Component: () => null,
      },
      {
        meta: {
          slug: 'workflow-mastery-2026-q4',
          publishedAt: '2026-03-15T00:00:00Z',
        },
        slug: 'workflow-mastery-2026-q4',
        Component: () => null,
      },
    ] as unknown as Awaited<ReturnType<typeof getAllCohorts>>);
  });

  // --- Unit ---

  it('unit_sitemap_includes_static_routes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/`);
    expect(urls).toContain(`${site.url}/episodes`);
    expect(urls).toContain(`${site.url}/cases`);
    expect(urls).toContain(`${site.url}/about`);
  });

  it('unit_sitemap_includes_episodes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/episodes/ep-slug`);
  });

  it('unit_sitemap_includes_cases', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/cases/case-slug`);
  });

  it('unit_sitemap_lastModified_from_publishedAt', async () => {
    const result = await sitemap();
    const ep = result.find((r) => r.url === `${site.url}/episodes/ep-slug`);
    expect(ep?.lastModified).toBeInstanceOf(Date);
    expect((ep!.lastModified as Date).toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });

  it('unit_sitemap_all_absolute_urls', async () => {
    const result = await sitemap();
    result.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\/travisgautier\.com\//);
    });
  });

  // --- Infrastructure ---

  it('infra_sitemap_returns_metadataroute_shape', async () => {
    const result = await sitemap();
    expect(Array.isArray(result)).toBe(true);
    result.forEach((entry) => {
      expect(entry).toHaveProperty('url');
      expect(typeof entry.url).toBe('string');
    });
  });

  // --- Edge ---

  it('edge_sitemap_no_episodes_no_cases', async () => {
    mockGetAllEpisodes.mockResolvedValue([]);
    mockGetAllCases.mockResolvedValue([]);
    mockGetAllJobs.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllJobs>>);
    mockGetAllProducts.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllProducts>>);
    mockGetAllCohorts.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllCohorts>>);
    const result = await sitemap();
    // 4 pre-existing static routes + 2 build-log static routes + 1 products + 1 cohorts static route
    expect(result).toHaveLength(8);
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/`);
    expect(urls).toContain(`${site.url}/episodes`);
    expect(urls).toContain(`${site.url}/cases`);
    expect(urls).toContain(`${site.url}/about`);
    expect(urls).toContain(`${site.url}/build-log`);
    expect(urls).toContain(`${site.url}/build-log/status`);
    expect(urls).toContain(`${site.url}/cohorts`);
  });

  // --- Phase 3.1: Build-log routes ---

  it('int_sitemap_includes_build_log_index', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/build-log`);
  });

  it('int_sitemap_includes_build_log_status', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/build-log/status`);
  });

  it('int_sitemap_includes_job_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/build-log/jobs/website-foundation`);
  });

  it('int_sitemap_includes_phase_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/build-log/jobs/website-foundation/phase-1-foundation`);
    expect(urls).toContain(`${site.url}/build-log/jobs/website-foundation/phase-2-content-loader`);
  });

  it('infra_sitemap_no_duplicate_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  it('edge_sitemap_empty_jobs', async () => {
    mockGetAllJobs.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllJobs>>);
    mockGetAllProducts.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllProducts>>);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/build-log`);
    expect(urls).toContain(`${site.url}/build-log/status`);
    expect(urls.filter((u) => u.includes('/build-log/jobs/'))).toEqual([]);
  });

  it('data_sitemap_all_absolute', async () => {
    const result = await sitemap();
    result.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\/travisgautier\.com\//);
    });
  });

  it('edge_sitemap_missing_publishedAt', async () => {
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODE_NO_DATE]);
    const result = await sitemap();
    const ep = result.find((r) => r.url === `${site.url}/episodes/ep-no-date`);
    expect(ep).toBeDefined();
    // lastModified should be undefined, NOT Invalid Date or NaN
    if (ep?.lastModified !== undefined) {
      expect(ep.lastModified).toBeInstanceOf(Date);
      expect(Number.isNaN((ep.lastModified as Date).getTime())).toBe(false);
    }
  });

  // --- storefront-auth-4.2: Product URLs ---

  it('unit_sitemap_includes_products_static', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/products`);
  });

  it('unit_sitemap_includes_product_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/products/workflow-templates`);
    expect(urls).toContain(`${site.url}/products/discovery-toolkit`);
  });

  it('unit_sitemap_excludes_gated_routes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    urls.forEach((url) => {
      expect(url).not.toMatch(/\/products\/account/);
      expect(url).not.toMatch(/\/api\/products\/downloads/);
      expect(url).not.toMatch(/\/login/);
    });
  });

  it('int_sitemap_still_includes_episodes_with_products', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/episodes/ep-slug`);
  });

  it('int_sitemap_still_includes_cases_with_products', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/cases/case-slug`);
  });

  it('edge_sitemap_empty_products', async () => {
    mockGetAllProducts.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllProducts>>);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/products`);
    expect(urls.filter((u) => u.includes('/products/'))).toEqual([]);
  });

  it('data_sitemap_product_urls_absolute', async () => {
    const result = await sitemap();
    const productUrls = result.filter((r) => r.url.includes('/products/')).map((r) => r.url);
    expect(productUrls.length).toBeGreaterThan(0);
    productUrls.forEach((url) => {
      expect(url).toMatch(/^https:\/\/travisgautier\.com\//);
    });
  });

  // --- cohort-enrollment-4.3: Cohort URLs + gated route exclusion ---

  it('integration_sitemap_contains_cohorts_index', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/cohorts`);
  });

  it('integration_sitemap_contains_per_cohort_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/cohorts/ai-delivery-2026-q3`);
    expect(urls).toContain(`${site.url}/cohorts/workflow-mastery-2026-q4`);
  });

  it('infra_sitemap_excludes_gated_apply_routes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    urls.forEach((url) => {
      expect(url).not.toMatch(/\/cohorts\/[^/]+\/apply/);
    });
  });

  it('infra_sitemap_excludes_gated_checkout_routes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    urls.forEach((url) => {
      expect(url).not.toMatch(/\/cohorts\/[^/]+\/checkout/);
    });
  });

  it('infra_sitemap_excludes_admin_routes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    urls.forEach((url) => {
      expect(url).not.toMatch(/\/admin/);
    });
  });

  it('infra_sitemap_excludes_account_cohorts', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    urls.forEach((url) => {
      expect(url).not.toMatch(/\/products\/account\/cohorts/);
    });
  });

  it('edge_sitemap_no_cohorts', async () => {
    mockGetAllCohorts.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllCohorts>>);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain(`${site.url}/cohorts`);
    expect(urls.filter((u) => u.match(/\/cohorts\/[^/]+$/))).toEqual([]);
  });

  it('perm_anonymous_sitemap_allow', async () => {
    // sitemap is a public Next metadata route — anonymous access returns a result
    const result = await sitemap();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
