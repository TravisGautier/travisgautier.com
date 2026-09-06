import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { EmailCapture } from '../EmailCapture';
import { site } from '@/lib/site';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const EMAIL_CAPTURE_SOURCE = 'src/components/capture/EmailCapture.tsx';
const EMAIL_CAPTURE_SRC = readSource(EMAIL_CAPTURE_SOURCE);
const GLOBALS_CSS = readSource('src/app/globals.css');
const FORBIDDEN_SENTINEL_SRC = readSource('src/__tests__/brand/forbidden-patterns.test.ts');

const ENV_KEY = 'NEXT_PUBLIC_SUBSTACK_EMBED_URL';
const EMBED_URL = 'https://travisgautier.substack.com/embed';

function boneSurfaceRoot(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el, 'Bone surface root not found').not.toBeNull();
  return el!;
}

function iframeEl(container: HTMLElement): HTMLIFrameElement {
  const el = container.querySelector('iframe') as HTMLIFrameElement | null;
  expect(el, 'iframe not found').not.toBeNull();
  return el!;
}

describe('EmailCapture — Substack embed (email-funnel-1)', () => {
  const prev = process.env[ENV_KEY];

  beforeEach(() => {
    process.env[ENV_KEY] = EMBED_URL;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = prev;
  });

  // ─── Unit: iframe rendering ────────────────────────────────────────────

  it('unit_renders_iframe_with_substack_origin', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const iframe = iframeEl(container);
    expect(new URL(iframe.src).origin).toBe('https://travisgautier.substack.com');
    expect(new URL(iframe.src).pathname).toBe('/embed');
  });

  it('unit_iframe_has_accessible_title', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    expect(iframeEl(container).title).toBe(`Subscribe to ${site.name} on Substack`);
  });

  it('unit_iframe_loading_lazy', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    expect(iframeEl(container).getAttribute('loading')).toBe('lazy');
  });

  it('unit_iframe_source_dataset_propagated', () => {
    const { container } = render(<EmailCapture source="case-pm-discovery" />);
    const iframe = iframeEl(container);
    expect(iframe.dataset.source).toBe('case-pm-discovery');
    expect(iframe.dataset.pillar).toBe('business');
  });

  // ─── Unit: UTM params ──────────────────────────────────────────────────

  it('unit_utm_campaign_pillar_delivery_for_episode_source', () => {
    const { container } = render(<EmailCapture source="episode-claude-shipped-an-app" />);
    const params = new URL(iframeEl(container).src).searchParams;
    expect(params.get('utm_source')).toBe(site.domain);
    expect(params.get('utm_medium')).toBe('embed');
    expect(params.get('utm_campaign')).toBe('pillar:delivery');
    expect(params.get('utm_content')).toBe('episode-claude-shipped-an-app');
  });

  it('unit_utm_campaign_pillar_business_for_case_source', () => {
    const { container } = render(<EmailCapture source="case-party-masters" />);
    const params = new URL(iframeEl(container).src).searchParams;
    expect(params.get('utm_campaign')).toBe('pillar:business');
    expect(params.get('utm_content')).toBe('case-party-masters');
  });

  it('unit_utm_campaign_pillar_delivery_for_homepage_hero', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const params = new URL(iframeEl(container).src).searchParams;
    expect(params.get('utm_campaign')).toBe('pillar:delivery');
    expect(params.get('utm_content')).toBe('homepage-hero');
  });

  // ─── Unit: surface ─────────────────────────────────────────────────────

  it('unit_iframe_wrapped_in_bone_surface', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const root = boneSurfaceRoot(container);
    expect(root.className).toMatch(/bg-\(--color-bone\)/);
    expect(root.className).toMatch(/border-\(--edge-color-subtle\)/);
  });

  // ─── Fallback: env var unset ───────────────────────────────────────────

  it('unit_fallback_link_when_env_unset', () => {
    delete process.env[ENV_KEY];
    const { container } = render(<EmailCapture source="homepage-hero" />);
    expect(container.querySelector('iframe')).toBeNull();
    const link = container.querySelector('a') as HTMLAnchorElement | null;
    expect(link, 'fallback link not found').not.toBeNull();
    expect(link!.href).toBe(site.substackProfileUrl);
    expect(link!.target).toBe('_blank');
    expect(link!.rel).toMatch(/noopener/);
  });

  it('unit_fallback_wrapped_in_bone_surface', () => {
    delete process.env[ENV_KEY];
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const root = boneSurfaceRoot(container);
    expect(root.className).toMatch(/bg-\(--color-bone\)/);
    expect(root.className).toMatch(/border-\(--edge-color-subtle\)/);
  });

  // ─── A11y ──────────────────────────────────────────────────────────────

  it('a11y_iframe_has_title', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    expect(iframeEl(container).title.length).toBeGreaterThan(0);
  });

  it('a11y_fallback_link_is_descriptive', () => {
    delete process.env[ENV_KEY];
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const link = container.querySelector('a') as HTMLAnchorElement;
    expect(link.textContent?.trim().length).toBeGreaterThan(0);
    expect(link.rel).toMatch(/noopener/);
    expect(link.target).toBe('_blank');
  });

  // ─── Edge cases ────────────────────────────────────────────────────────

  it('edge_long_source_string_propagated_to_utm_content', () => {
    const longSource = 'case-some-very-long-slug-with-many-segments-2026';
    const { container } = render(<EmailCapture source={longSource} />);
    const params = new URL(iframeEl(container).src).searchParams;
    expect(params.get('utm_content')).toBe(longSource);
    expect(params.get('utm_campaign')).toBe('pillar:business');
  });

  it('edge_unknown_source_defaults_to_delivery_pillar', () => {
    const { container } = render(<EmailCapture source="about-cta" />);
    const params = new URL(iframeEl(container).src).searchParams;
    expect(params.get('utm_campaign')).toBe('pillar:delivery');
  });

  // ─── Infrastructure: source guards ─────────────────────────────────────

  it('infra_no_resend_import', () => {
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bResend\b/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/from\s+['"]resend['"]/);
  });

  it('infra_no_server_action_imports', () => {
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/useActionState/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/from\s+['"]\.\/actions['"]/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/['"]use server['"]/);
  });

  it('infra_no_placeholder_palette_names', () => {
    const forbidden: Array<[string, RegExp]> = [
      ['bg-mist', /\bbg-mist\b/],
      ['bg-accent', /\bbg-accent\b/],
      ['text-parchment', /\btext-parchment\b/],
      ['text-foreground', /\btext-foreground\b/],
      ['border-mist', /\bborder-mist\b/],
      ['focus:border-accent', /\bfocus:border-accent\b/],
      ['bg-background', /\bbg-background\b/],
      ['hover:opacity-90', /\bhover:opacity-90\b/],
      ['disabled:opacity-60', /\bdisabled:opacity-60\b/],
      ['text-accent', /\btext-accent\b/],
    ];
    for (const [name, pat] of forbidden) {
      expect(EMAIL_CAPTURE_SRC, `placeholder palette name leaked: ${name}`).not.toMatch(pat);
    }
  });

  it('infra_no_rounded_class', () => {
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\brounded(-[a-z0-9]+)?\b/);
  });

  it('infra_no_box_shadow', () => {
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner|none)\b/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bdrop-shadow\b/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bbox-shadow\b/);
  });

  it('infra_no_gradient', () => {
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bbg-gradient-/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\blinear-gradient\b/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bfrom-\w/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bvia-\w/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bto-\w/);
  });

  it('infra_forbidden_pattern_sentinel_clean', () => {
    const skipBlock = FORBIDDEN_SENTINEL_SRC.match(/SKIP_PATHS[^=]*=\s*\[([\s\S]*?)\];/);
    expect(skipBlock, 'SKIP_PATHS not found in sentinel').not.toBeNull();
    const body = skipBlock?.[1] ?? '';
    expect(body, 'EmailCapture.tsx should not need SKIP_PATHS exemption').not.toContain(
      'EmailCapture.tsx',
    );
    expect(body, 'src/components/capture/EmailCapture.tsx should not need SKIP_PATHS exemption').not.toContain(
      'capture/EmailCapture.tsx',
    );
  });

  it('infra_brand_bone_imported_from_brand_path', () => {
    const importsBone =
      /import\s*\{[^}]*\bBone\b[^}]*\}\s*from\s*['"]@\/components\/brand(?:\/Bone)?['"]/.test(
        EMAIL_CAPTURE_SRC,
      );
    expect(importsBone, 'Bone not imported from @/components/brand').toBe(true);
  });

  it('infra_tokens_resolve_in_globals_css', () => {
    const tokens = [
      '--color-bone',
      '--edge-color-subtle',
      '--space-5',
      '--pair-text-on-bone',
    ];
    for (const t of tokens) {
      expect(GLOBALS_CSS, `token ${t} not declared in globals.css`).toContain(t);
    }
  });
});
