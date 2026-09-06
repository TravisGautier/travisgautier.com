// /thumb-preview dev-only thumbnail composer — Red phase (styling-overhaul-8.3).
//
// The route renders a 1280x720 brand composition driven by query string, gated
// behind NODE_ENV==='development' (notFound() in production). It is NOT a
// Satori/ImageResponse route (that was 8.2) — it renders real brand components
// (BrushstrokeSeam + DropAccent + next/image) as an RSC page the user
// screenshots.
//
// Harness:
//   - @/components/brand barrel: BrushstrokeSeam + DropAccent doubled (props
//     exposed via data-*); rest of the barrel kept real via importActual.
//   - next/image: doubled to a plain <img> so src/alt/aria-hidden are inspectable
//     (next/image rewrites src to /_next/image?url=... even in jsdom).
//   - next/navigation.notFound: non-throwing spy; page must `return notFound()`
//     so production short-circuits to an undefined render (no composition leak).
//   - Env gate driven by vi.stubEnv('NODE_ENV', ...) per test.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { site } from '@/lib/site';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: Record<string, unknown>) => {
    // strip next/image-only props that are not valid <img> attributes
    const imgProps = { ...rest };
    delete imgProps.fill;
    delete imgProps.priority;
    delete imgProps.sizes;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={typeof src === 'string' ? src : ''} alt={alt as string} {...imgProps} />
    );
  },
}));

vi.mock('@/components/brand', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    BrushstrokeSeam: ({
      direction,
      foreground,
      background,
      feather,
      backgroundContent,
      children,
      className,
    }: Record<string, unknown>) => (
      <div
        data-testid="brushstroke-seam"
        data-direction={direction as string}
        data-foreground={foreground as string}
        data-background={background as string}
        data-feather={feather as string}
        className={className as string}
      >
        <div data-testid="brushstroke-bg">{backgroundContent as React.ReactNode}</div>
        <div data-testid="brushstroke-fg">{children as React.ReactNode}</div>
      </div>
    ),
    DropAccent: ({ glyph, size, children }: Record<string, unknown>) => (
      <>
        {children as React.ReactNode}
        <span
          aria-hidden="true"
          data-testid="drop-accent"
          data-glyph={glyph as string}
          data-size={size as string}
        >
          {glyph as string}
        </span>
      </>
    ),
  };
});

const PAGE_PATH = 'src/app/(internal)/thumb-preview/page.tsx';

function makeSearchParams(params: Record<string, string> = {}) {
  return { searchParams: Promise.resolve(params) };
}

async function loadPage() {
  return (await import('../page')).default as (props: {
    searchParams: Promise<Record<string, string>>;
  }) => Promise<React.ReactElement | undefined>;
}

async function renderDev(params: Record<string, string> = {}) {
  vi.stubEnv('NODE_ENV', 'development');
  const Page = await loadPage();
  const ui = await Page(makeSearchParams(params));
  return render(ui as React.ReactElement);
}

async function callProd(params: Record<string, string> = {}) {
  vi.stubEnv('NODE_ENV', 'production');
  const Page = await loadPage();
  return Page(makeSearchParams(params));
}

function hasViewportBox(container: HTMLElement): boolean {
  return Array.from(container.querySelectorAll('div')).some((d) => {
    const s = d.getAttribute('style') ?? '';
    return s.includes('1280px') && s.includes('720px');
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('ThumbPreviewPage — composition (dev)', () => {
  /// Tests checklist items: 1
  it('unit_renders_default_composition: no params → brand defaults render', async () => {
    await renderDev({});
    expect(screen.getByText('Build the whole thing alone')).toBeInTheDocument();
    expect(screen.getByText('Zero to 10x')).toBeInTheDocument();
    expect(screen.getByText('FLAGSHIP')).toBeInTheDocument();
    expect(screen.getByText(site.domain)).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });

  /// Tests checklist items: 1
  it('unit_applies_title_series_tier_params: supplied strings replace defaults', async () => {
    await renderDev({ title: 'Ship it alone', series: 'Playbooks', tier: 'SHORTS' });
    expect(screen.getByText('Ship it alone')).toBeInTheDocument();
    expect(screen.getByText('Playbooks')).toBeInTheDocument();
    expect(screen.getByText('SHORTS')).toBeInTheDocument();
    expect(screen.queryByText('Build the whole thing alone')).not.toBeInTheDocument();
  });

  /// Tests checklist items: 1
  it('unit_valid_accent_glyph_passes_through: accent="." renders the "." glyph', async () => {
    await renderDev({ accent: '.' });
    expect(screen.getByTestId('drop-accent')).toHaveAttribute('data-glyph', '.');
  });

  /// Tests checklist items: 1
  it('unit_mounts_brushstroke_seam_left: seam mounted left, marble fg, shadow bg, bg content present', async () => {
    await renderDev({});
    const seam = screen.getByTestId('brushstroke-seam');
    expect(seam).toHaveAttribute('data-direction', 'left');
    expect(seam).toHaveAttribute('data-foreground', 'var(--color-marble)');
    expect(seam).toHaveAttribute('data-background', 'var(--color-shadow)');
    expect(screen.getByTestId('brushstroke-bg').querySelector('img')).not.toBeNull();
  });

  /// Tests checklist items: 1
  it('unit_mounts_drop_accent_thumbnail: DropAccent rendered with size="thumbnail"', async () => {
    await renderDev({});
    expect(screen.getByTestId('drop-accent')).toHaveAttribute('data-size', 'thumbnail');
  });

  /// Tests checklist items: 1
  it('unit_fixed_viewport_1280x720: a composition box is sized 1280x720', async () => {
    const { container } = await renderDev({});
    expect(hasViewportBox(container)).toBe(true);
  });

  /// Tests checklist items: 1
  it('unit_exports_force_dynamic: module exports dynamic === "force-dynamic"', async () => {
    const mod = await import('../page');
    expect((mod as { dynamic?: string }).dynamic).toBe('force-dynamic');
  });

  /// Tests checklist items: 1
  it('unit_default_photo_is_floatbg: default decorative photo src is /hero/floatbg.png', async () => {
    await renderDev({});
    const img = screen.getByTestId('brushstroke-bg').querySelector('img');
    expect(img).toHaveAttribute('src', '/hero/floatbg.png');
  });

  /// Tests checklist items: 1
  it('unit_footer_brand_wordmark: footer renders the site domain', async () => {
    await renderDev({});
    expect(screen.getByText(site.domain)).toBeInTheDocument();
  });
});

describe('ThumbPreviewPage — integration (dev)', () => {
  /// Tests checklist items: 1
  it('int_full_composition_dev: header + single h1 w/ accent + image + footer compose', async () => {
    const { container } = await renderDev({});
    expect(screen.getByText('FLAGSHIP')).toBeInTheDocument();
    expect(screen.getByText('Zero to 10x')).toBeInTheDocument();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('Build the whole thing alone');
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(screen.getByText(site.domain)).toBeInTheDocument();
  });

  /// Tests checklist items: 1
  it('int_all_custom_params_compose: all five params reflected end-to-end', async () => {
    await renderDev({
      title: 'Refactor everything',
      series: 'Field Notes',
      tier: 'PLAYBOOK',
      accent: '!',
      photo: '/hero/custom.jpg',
    });
    expect(screen.getByText('Refactor everything')).toBeInTheDocument();
    expect(screen.getByText('Field Notes')).toBeInTheDocument();
    expect(screen.getByText('PLAYBOOK')).toBeInTheDocument();
    expect(screen.getByTestId('drop-accent')).toHaveAttribute('data-glyph', '!');
    expect(screen.getByTestId('brushstroke-bg').querySelector('img')).toHaveAttribute(
      'src',
      '/hero/custom.jpg',
    );
  });
});

describe('ThumbPreviewPage — security / env gate', () => {
  /// Tests checklist items: 1
  it('sec_info_disclosure_prod_gate_page: production → notFound(), no composition', async () => {
    const result = await callProd({});
    expect(notFound).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  /// Tests checklist items: 1
  it('sec_tampering_accent_allowlist: unknown/script accent falls back to "?"', async () => {
    await renderDev({ accent: '<script>alert(1)</script>' });
    expect(screen.getByTestId('drop-accent')).toHaveAttribute('data-glyph', '?');
    cleanup();
    await renderDev({ accent: 'zzz' });
    expect(screen.getByTestId('drop-accent')).toHaveAttribute('data-glyph', '?');
  });

  /// Tests checklist items: 1
  it('sec_info_disclosure_title_text_only: malicious title is escaped text, not HTML', async () => {
    const { container } = await renderDev({ title: '<img src=x onerror=alert(1)>' });
    // Only the decorative bg image exists; the title never becomes a real element.
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('img[onerror]')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  });
});

describe('ThumbPreviewPage — accessibility', () => {
  /// Tests checklist items: 1
  it('a11y_robust_decorative_image_hidden: bg image has alt="" and aria-hidden="true"', async () => {
    const { container } = await renderDev({});
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('aria-hidden', 'true');
  });

  /// Tests checklist items: 1
  it('a11y_perceivable_single_h1_title: exactly one h1 carrying the title', async () => {
    await renderDev({});
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('Build the whole thing alone');
  });

  /// Tests checklist items: 1
  it('a11y_robust_accent_glyph_aria_hidden: decorative accent glyph is aria-hidden', async () => {
    await renderDev({});
    expect(screen.getByTestId('drop-accent')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ThumbPreviewPage — infrastructure', () => {
  /// Tests checklist items: 1
  it('infra_route_group_internal_location: page lives under src/app/(internal)/thumb-preview/', () => {
    expect(existsSync(join(process.cwd(), PAGE_PATH))).toBe(true);
  });

  /// Tests checklist items: 1
  it('infra_forbidden_patterns_stays_green: source has no gradient/shadow/pure-hex, uses brand tokens', () => {
    const src = readFileSync(join(process.cwd(), PAGE_PATH), 'utf8');
    expect(src).not.toMatch(/linear-gradient\s*\(/i);
    expect(src).not.toMatch(/radial-gradient\s*\(/i);
    expect(src).not.toMatch(/\bshadow-(md|lg|xl|2xl|inner)\b/);
    expect(src).not.toMatch(/#(000|000000|fff|ffffff|f00|ff0000)\b/i);
    // positive brand-token adoption
    expect(src).toMatch(/--color-/);
  });
});

describe('ThumbPreviewPage — edge cases', () => {
  /// Tests checklist items: 1
  it('edge_input_empty_params_all_defaults: {} → every brand default', async () => {
    await renderDev({});
    expect(screen.getByText('Build the whole thing alone')).toBeInTheDocument();
    expect(screen.getByText('Zero to 10x')).toBeInTheDocument();
    expect(screen.getByText('FLAGSHIP')).toBeInTheDocument();
    expect(screen.getByTestId('drop-accent')).toHaveAttribute('data-glyph', '?');
  });

  /// Tests checklist items: 1
  it('edge_state_unknown_accent_defaults_question: accent="@" → "?"', async () => {
    await renderDev({ accent: '@' });
    expect(screen.getByTestId('drop-accent')).toHaveAttribute('data-glyph', '?');
  });

  /// Tests checklist items: 1
  it('edge_input_long_title_renders: 140-char title renders without crashing', async () => {
    const longTitle = 'A'.repeat(140);
    const { container } = await renderDev({ title: longTitle });
    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(hasViewportBox(container)).toBe(true);
  });

  /// Tests checklist items: 1
  it('edge_input_custom_photo_param_used: photo param overrides default src', async () => {
    await renderDev({ photo: '/hero/custom-thumb.jpg' });
    expect(screen.getByTestId('brushstroke-bg').querySelector('img')).toHaveAttribute(
      'src',
      '/hero/custom-thumb.jpg',
    );
  });
});

describe('ThumbPreviewPage — error recovery & permissions (env gate)', () => {
  /// Tests checklist items: 1
  it('err_prod_env_returns_not_found: production short-circuits cleanly to undefined', async () => {
    const result = await callProd({ title: 'whatever' });
    expect(notFound).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  /// Tests checklist items: 1
  it('perm_anonymous_thumbpreview_dev_allow: dev render allowed for anonymous', async () => {
    await renderDev({});
    expect(notFound).not.toHaveBeenCalled();
    expect(screen.getByText('Build the whole thing alone')).toBeInTheDocument();
  });

  /// Tests checklist items: 1
  it('perm_anonymous_thumbpreview_prod_deny: production denies (404)', async () => {
    const result = await callProd({});
    expect(notFound).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
