// Product detail (styling-overhaul-7.5) — brand-aware assertions.
//
// Replaces the placeholder-pattern tests with assertions that pin the
// editorial reskin per phase-7-pages.md Feature 7.5:
//   - <Marble> surface wraps the page
//   - <Section rhythm="lg"> (py-(--section-y-lg))
//   - <Container width="prose"> (max-w-prose)
//   - .label / .display-1 / .body-1 brand utilities
//   - Mono price + license bar with border-(--edge-color)
//   - MDX <Component/> wrapped in .build-log-prose
//   - PRESERVED: JSON-LD Product shape, BuyButton wiring, generateMetadata,
//     generateStaticParams, dynamicParams=false, notFound on missing slug

import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '@/lib/content/loader';
import type { Product } from '@/content/schemas';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/content/products', () => ({
  getAllProducts: vi.fn(),
  getProductBySlug: vi.fn(),
}));

vi.mock('@/components/products/BuyButton', () => ({
  BuyButton: ({
    productSlug,
    priceCents,
    currency,
  }: {
    productSlug: string;
    priceCents?: number;
    currency?: string;
  }) => (
    <div
      data-testid="buy-button"
      data-product-slug={productSlug}
      data-price-cents={priceCents}
      data-currency={currency}
    />
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import { getAllProducts, getProductBySlug } from '@/lib/content/products';
import { PRODUCT_CATEGORY_LABELS, PRODUCT_LICENSE_LABELS } from '@/content/schemas';
import { site } from '@/lib/site';
import ProductDetailPage, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from '../page';

const mockGetProductBySlug = vi.mocked(getProductBySlug);
const mockGetAllProducts = vi.mocked(getAllProducts);
const mockNotFound = vi.mocked(notFound);

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const PAGE_SOURCE_PATH = join(__dirname_compat, '..', 'page.tsx');
const PAGE_SOURCE = readFileSync(PAGE_SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'text-muted',
  'font-display',
  'text-4xl',
  'text-3xl',
  'text-xl',
  'text-lg',
  'text-sm',
  'text-base',
  'bg-marble-texture',
  'border-mist',
  'rounded-md',
  'rounded-lg',
  'text-link',
  'text-accent',
  'bg-accent',
  'divide-mist',
  'prose-style',
];

const MOCK_MDX: ComponentType = () => (
  <div data-testid="mdx-body">Product MDX body</div>
);

const MOCK_PRODUCT_FULL: LoadedEntry<Product> = {
  meta: {
    id: 'prod-alpha',
    slug: 'alpha-product',
    title: 'Alpha Product',
    tagline: 'Ship projects faster.',
    summary: 'Templates for discovery through delivery.',
    category: 'workflow-templates',
    licenseType: 'single-user',
    priceCents: 4900,
    currency: 'usd',
    stripePriceId: 'price_alpha',
    assetFilename: 'alpha.zip',
    heroImageUrl: 'https://example.com/hero.jpg',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-12T00:00:00Z',
  },
  slug: 'alpha-product',
  Component: MOCK_MDX,
};

const MOCK_PRODUCT_NO_HERO: LoadedEntry<Product> = {
  meta: {
    id: 'prod-beta',
    slug: 'beta-product',
    title: 'Beta Product',
    tagline: 'Ask the right questions.',
    summary: 'Templates + scripts for discovery calls.',
    category: 'discovery-toolkit',
    licenseType: 'team',
    priceCents: 12900,
    currency: 'usd',
    stripePriceId: 'price_beta',
    assetFilename: 'beta.zip',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-03-01T00:00:00Z',
  },
  slug: 'beta-product',
  Component: () => <div data-testid="mdx-body">Toolkit body</div>,
};

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderProductsDetail(slug = 'alpha-product') {
  const jsx = await ProductDetailPage(makeParams(slug));
  return render(jsx);
}

describe('ProductDetailPage (styling-overhaul-7.5) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProductBySlug.mockResolvedValue(MOCK_PRODUCT_FULL);
    mockGetAllProducts.mockResolvedValue([MOCK_PRODUCT_FULL, MOCK_PRODUCT_NO_HERO]);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — brand chrome
  // ────────────────────────────────────────────────────────────────

  it('unit_products_detail_marble_mount: page renders inside <Marble> surface with Container width=prose', async () => {
    const { container } = await renderProductsDetail();
    expect(container.querySelector('.bg-\\(--color-marble\\)')).toBeInTheDocument();
    expect(container.querySelector('.max-w-prose')).toBeInTheDocument();
  });

  it('unit_products_detail_section_rhythm_lg: <Section rhythm="lg"> wraps content — py-(--section-y-lg) present', async () => {
    const { container } = await renderProductsDetail();
    const section = container.querySelector('.py-\\(--section-y-lg\\)');
    expect(section).toBeInTheDocument();
  });

  it('unit_products_detail_label_kicker_category: .label kicker reads PRODUCT_CATEGORY_LABELS[category]', async () => {
    await renderProductsDetail();
    const expected = PRODUCT_CATEGORY_LABELS[MOCK_PRODUCT_FULL.meta.category];
    const kicker = screen.getByText(expected);
    expect(kicker).toBeInTheDocument();
    expect(kicker.className).toMatch(/\blabel\b/);
  });

  it('unit_products_detail_display_1_title: h1 uses .display-1 and reads product.title', async () => {
    await renderProductsDetail();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Alpha Product' });
    expect(h1.className).toMatch(/\bdisplay-1\b/);
  });

  it('unit_products_detail_body_1_tagline_muted: tagline uses .body-1 + text-(--color-muted)', async () => {
    const { container } = await renderProductsDetail();
    const bodyParas = container.querySelectorAll('p.body-1');
    const taglinePara = Array.from(bodyParas).find((p) =>
      (p.textContent ?? '').includes('Ship projects faster.'),
    );
    expect(taglinePara).toBeDefined();
    expect(taglinePara!.className).toMatch(/text-\(--color-muted\)/);
  });

  it('unit_products_detail_mono_price: price renders inside <span class="mono ..."> and contains $49', async () => {
    const { container } = await renderProductsDetail();
    const monoEls = container.querySelectorAll('span.mono');
    const priceEl = Array.from(monoEls).find((s) =>
      /\$49/.test(s.textContent ?? ''),
    );
    expect(priceEl).toBeDefined();
    expect(priceEl!.textContent).toMatch(/\$49/);
  });

  it('unit_products_detail_buy_button_preserved: BuyButton receives productSlug/priceCents/currency from meta', async () => {
    await renderProductsDetail();
    const buy = screen.getByTestId('buy-button');
    expect(buy).toHaveAttribute('data-product-slug', 'alpha-product');
    expect(buy).toHaveAttribute('data-price-cents', '4900');
    expect(buy).toHaveAttribute('data-currency', 'usd');
  });

  it('unit_products_detail_license_label_preserved: PRODUCT_LICENSE_LABELS[licenseType] visible', async () => {
    await renderProductsDetail();
    const expected = PRODUCT_LICENSE_LABELS[MOCK_PRODUCT_FULL.meta.licenseType];
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('unit_products_detail_horizontal_bar_edge_color: price/buy bar wrapper uses border-t border-b border-(--edge-color)', async () => {
    const { container } = await renderProductsDetail();
    const bars = container.querySelectorAll('div');
    const bar = Array.from(bars).find((d) => {
      const cn = d.className ?? '';
      return (
        /\bborder-t\b/.test(cn) &&
        /\bborder-b\b/.test(cn) &&
        /border-\(--edge-color\)/.test(cn)
      );
    });
    expect(bar).toBeDefined();
  });

  it('unit_products_detail_mdx_in_build_log_prose: MDX <Component/> rendered inside .build-log-prose wrapper', async () => {
    const { container } = await renderProductsDetail();
    const proseWrappers = container.querySelectorAll('.build-log-prose');
    expect(proseWrappers.length).toBeGreaterThanOrEqual(1);
    const mdx = screen.getByTestId('mdx-body');
    // Walk up to ensure ancestor has build-log-prose class
    let el: HTMLElement | null = mdx;
    let found = false;
    while (el) {
      if (el.classList?.contains('build-log-prose')) {
        found = true;
        break;
      }
      el = el.parentElement;
    }
    expect(found).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────
  // Integration — preserved behavior
  // ────────────────────────────────────────────────────────────────

  it('int_products_detail_jsonld_product_preserved: Product JSON-LD shape preserved', async () => {
    const { container } = await renderProductsDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@type']).toBe('Product');
    expect(parsed.name).toBe('Alpha Product');
    expect(parsed.description).toBe('Templates for discovery through delivery.');
    expect(parsed.category).toBe(
      PRODUCT_CATEGORY_LABELS[MOCK_PRODUCT_FULL.meta.category],
    );
    expect(parsed.brand).toBeDefined();
    expect(parsed.brand.name).toBe(site.name);
    expect(parsed.offers).toBeDefined();
    expect(parsed.offers.price).toBe('49.00');
    expect(parsed.offers.priceCurrency).toBe('USD');
    expect(parsed.offers.availability).toBe('https://schema.org/InStock');
    expect(parsed.offers.url).toBe(
      `${site.url}/products/alpha-product`,
    );
  });

  it('int_products_detail_generate_metadata_preserved: generateMetadata returns title/description/openGraph; {} on missing slug', async () => {
    const meta = await generateMetadata(makeParams('alpha-product'));
    expect(meta.title).toBe('Alpha Product');
    expect(meta.description).toBe('Templates for discovery through delivery.');
    const og = meta.openGraph as
      | { title?: string; description?: string }
      | undefined;
    expect(og).toBeDefined();
    expect(og?.title).toBe('Alpha Product');

    mockGetProductBySlug.mockResolvedValue(null);
    const empty = await generateMetadata(makeParams('nope'));
    expect(empty).toEqual({});
  });

  it('int_products_detail_static_params_preserved: generateStaticParams returns one entry per product slug', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([
      { slug: 'alpha-product' },
      { slug: 'beta-product' },
    ]);
  });

  it('int_products_detail_dynamic_params_false_preserved: dynamicParams === false', () => {
    expect(dynamicParams).toBe(false);
  });

  it('int_products_detail_not_found_preserved: null lookup triggers notFound()', async () => {
    mockGetProductBySlug.mockResolvedValue(null);
    const jsx = await ProductDetailPage(makeParams('nonexistent'));
    expect(mockNotFound).toHaveBeenCalled();
    expect(jsx).toBeUndefined();
  });

  // ────────────────────────────────────────────────────────────────
  // Accessibility
  // ────────────────────────────────────────────────────────────────

  it('a11y_products_detail_heading_landmark: h1 visible with name === product.title', async () => {
    await renderProductsDetail();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Alpha Product' });
    expect(h1).toBeVisible();
  });

  // ────────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels
  // ────────────────────────────────────────────────────────────────

  it('infra_products_detail_no_placeholder_tokens: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const escaped = token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(`(?:^|[\\s"'\`])${escaped}(?:[\\s"'\`]|$)`);
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
    // Positive assertions: brand utilities adopted
    expect(PAGE_SOURCE).toMatch(/\bMarble\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bbody-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bbuild-log-prose\b/);
  });

  it('infra_products_detail_brand_imports: page imports Marble + Section from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bMarble\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
  });

  // ────────────────────────────────────────────────────────────────
  // Edge case
  // ────────────────────────────────────────────────────────────────

  it('edge_products_detail_no_hero_image_url: JSON-LD omits image when heroImageUrl is undefined', async () => {
    mockGetProductBySlug.mockResolvedValue(MOCK_PRODUCT_NO_HERO);
    const { container } = await renderProductsDetail('beta-product');
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed.image).toBeUndefined();
  });

  // ────────────────────────────────────────────────────────────────
  // Error recovery
  // ────────────────────────────────────────────────────────────────

  it('err_products_detail_metadata_missing_slug: generateMetadata returns {} when slug not found', async () => {
    mockGetProductBySlug.mockResolvedValue(null);
    const meta = await generateMetadata(makeParams('nonexistent'));
    expect(meta).toEqual({});
  });

  // ────────────────────────────────────────────────────────────────
  // Data integrity
  // ────────────────────────────────────────────────────────────────

  it('data_products_detail_price_formatted_correctly: priceCents=4900, currency=usd renders text matching /\\$49(?!\\.)/', async () => {
    const { container } = await renderProductsDetail();
    const monoEls = container.querySelectorAll('span.mono');
    const priceEl = Array.from(monoEls).find((s) =>
      /\$49/.test(s.textContent ?? ''),
    );
    expect(priceEl).toBeDefined();
    // $49 with no fractional cents (no $49.00)
    expect(priceEl!.textContent).toMatch(/\$49(?!\.)/);
  });
});
