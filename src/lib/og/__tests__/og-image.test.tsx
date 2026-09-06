import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidElement, type ReactNode } from 'react';
import { site } from '@/lib/site';
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  OG_COLORS,
  BRUSHSTROKE_CLIP,
  scaleTitle,
  loadOgFonts,
  buildOgComposition,
} from '@/lib/og/og-image';

// Resolve source files relative to this test (worktree-stable; styling-overhaul-8.1 idiom).
const HERE = dirname(fileURLToPath(import.meta.url));
const HELPER_SRC = readFileSync(join(HERE, '..', 'og-image.tsx'), 'utf8');
const GLOBALS_CSS = readFileSync(join(HERE, '..', '..', '..', 'app', 'globals.css'), 'utf8');

// --- Element tree walkers (no `any`) ---
function collectText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return collectText(props.children);
  }
  return '';
}
function collectStyles(
  node: ReactNode,
  acc: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    node.forEach((n) => collectStyles(n, acc));
    return acc;
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode; style?: Record<string, unknown> };
    if (props.style) acc.push(props.style);
    collectStyles(props.children, acc);
  }
  return acc;
}

function hasValidTtfMagic(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  const tag = buf.readUInt32BE(0);
  return (
    tag === 0x00010000 ||
    tag === 0x4f54544f /* OTTO */ ||
    tag === 0x74727565 /* true */ ||
    tag === 0x74746366 /* ttcf */
  );
}

const BRAND_HEXES = [OG_COLORS.shadow, OG_COLORS.marble, OG_COLORS.ink, OG_COLORS.oxblood];

describe('og-image helper (styling-overhaul-8.2)', () => {
  // ---------- Unit: scaleTitle ----------
  it('unit_scaletitle_short_title_72px', () => {
    expect(scaleTitle('Ship it alone')).toBe(72); // 13 chars
  });

  it('unit_scaletitle_medium_title_60px', () => {
    expect(scaleTitle('A'.repeat(32))).toBe(60); // 25-40
  });

  it('unit_scaletitle_long_title_50px', () => {
    expect(scaleTitle('A'.repeat(50))).toBe(50); // 41-60
  });

  it('unit_scaletitle_xlong_title_42px', () => {
    expect(scaleTitle('A'.repeat(75))).toBe(42); // >60
  });

  it('unit_scaletitle_boundary_24_25', () => {
    expect(scaleTitle('A'.repeat(24))).toBe(72);
    expect(scaleTitle('A'.repeat(25))).toBe(60);
    expect(scaleTitle('A'.repeat(40))).toBe(60);
    expect(scaleTitle('A'.repeat(41))).toBe(50);
    expect(scaleTitle('A'.repeat(60))).toBe(50);
    expect(scaleTitle('A'.repeat(61))).toBe(42);
  });

  // ---------- Unit: buildOgComposition ----------
  it('unit_composition_renders_tag_and_title', () => {
    const el = buildOgComposition({
      tag: 'Zero to 10x · Episode 3',
      titleLines: ['Build the whole', 'thing alone'],
      accent: '?',
      fontSize: 88,
    });
    const text = collectText(el);
    expect(text).toContain('Zero to 10x · Episode 3');
    expect(text).toContain('Build the whole');
    expect(text).toContain('thing alone');
    expect(text).toContain(site.domain);
  });

  it('unit_composition_uses_brand_hexes', () => {
    const el = buildOgComposition({ tag: 'T', titleLines: ['Title'], accent: '?', fontSize: 72 });
    const styles = collectStyles(el);
    const colorValues = styles.flatMap((s) =>
      [s.background, s.color].filter((v): v is string => typeof v === 'string'),
    );
    expect(colorValues.length).toBeGreaterThan(0);
    colorValues.forEach((c) => {
      expect(BRAND_HEXES).toContain(c);
    });
    // Outer shadow + marble panel both present
    expect(colorValues).toContain(OG_COLORS.shadow);
    expect(colorValues).toContain(OG_COLORS.marble);
  });

  it('unit_composition_accent_glyph_rendered_oxblood', () => {
    const fontSize = 72;
    const el = buildOgComposition({ tag: 'T', titleLines: ['Title'], accent: '?', fontSize });
    const styles = collectStyles(el);
    // An oxblood span with fontSize larger than the title fontSize = the accent.
    const accentSpan = styles.find(
      (s) => s.color === OG_COLORS.oxblood && typeof s.fontSize === 'number' && (s.fontSize as number) > fontSize,
    );
    expect(accentSpan).toBeDefined();
  });

  it('unit_composition_title_font_cinzel', () => {
    const el = buildOgComposition({ tag: 'T', titleLines: ['Title'], accent: '?', fontSize: 72 });
    const fonts = collectStyles(el)
      .map((s) => s.fontFamily)
      .filter((v): v is string => typeof v === 'string');
    expect(fonts).toContain('Cinzel');
    expect(fonts).toContain('Inter Bold');
    expect(fonts).toContain('Inter Regular');
  });

  // ---------- Integration: loadOgFonts ----------
  it('int_loadfonts_returns_three_fonts', async () => {
    const fonts = await loadOgFonts();
    expect(fonts).toHaveLength(3);
    expect(fonts.map((f) => f.name)).toEqual(['Cinzel', 'Inter Bold', 'Inter Regular']);
    expect(fonts.map((f) => f.weight)).toEqual([900, 700, 400]);
  });

  // ---------- Accessibility ----------
  it('a11y_perceivable_brand_contrast_ink_on_marble', () => {
    // Ink-on-Marble + Oxblood-on-Marble are brand-approved legible pairs.
    expect(OG_COLORS.ink).not.toBe(OG_COLORS.marble);
    const el = buildOgComposition({ tag: 'T', titleLines: ['Title'], accent: '?', fontSize: 72 });
    const styles = collectStyles(el);
    const titleStyle = styles.find((s) => s.fontFamily === 'Cinzel');
    const panel = styles.find((s) => s.background === OG_COLORS.marble);
    expect(titleStyle?.color).toBe(OG_COLORS.ink);
    expect(panel).toBeDefined();
  });

  // ---------- Infrastructure (source sentinels) ----------
  it('infra_helper_reads_three_ttf_fonts', () => {
    expect(HELPER_SRC).toContain('public/fonts/Cinzel-Black.ttf');
    expect(HELPER_SRC).toContain('public/fonts/Inter-Bold.ttf');
    expect(HELPER_SRC).toContain('public/fonts/Inter-Regular.ttf');
  });

  it('infra_routes_no_forbidden_patterns', () => {
    expect(HELPER_SRC).not.toMatch(/#0{3}(?:0{3})?\b/); // pure black
    expect(HELPER_SRC).not.toMatch(/#f{3}(?:f{3})?\b/i); // pure white
    expect(HELPER_SRC).not.toMatch(/#(?:f00|ff0000)\b/i); // pure red
    expect(HELPER_SRC).not.toMatch(/\blinear-gradient\s*\(/i);
    expect(HELPER_SRC).not.toMatch(/\bradial-gradient\s*\(/i);
    expect(HELPER_SRC).not.toMatch(/\bshadow-(?:md|lg|xl|2xl|inner)\b/);
  });

  it('infra_routes_use_brushstroke_clip_polygon', () => {
    expect(BRUSHSTROKE_CLIP).toMatch(/^polygon\(/);
    expect(HELPER_SRC).toContain('clipPath');
    // brushstroke is a clip polygon, NOT a gradient mask
    expect(HELPER_SRC).not.toContain('maskImage');
  });

  it('infra_og_fonts_valid_ttf_magic', async () => {
    const fonts = await loadOgFonts();
    fonts.forEach((f) => {
      expect(hasValidTtfMagic(Buffer.from(f.data))).toBe(true);
    });
  });

  // ---------- Edge cases ----------
  it('edge_input_very_long_episode_title_smallest_font', () => {
    expect(scaleTitle('A'.repeat(75))).toBe(42);
    const el = buildOgComposition({ tag: 'T', titleLines: ['A'.repeat(75)], accent: '?', fontSize: 42 });
    expect(collectText(el)).toContain('A'.repeat(75));
  });

  it('edge_input_empty_title', () => {
    expect(scaleTitle('')).toBe(72);
    const el = buildOgComposition({ tag: 'T', titleLines: [''], accent: '?', fontSize: 72 });
    // builds without throwing; accent still present
    expect(collectText(el)).toContain('?');
  });

  it('edge_input_unicode_title', () => {
    const el = buildOgComposition({ tag: 'T', titleLines: ['Shipping — alone'], accent: '?', fontSize: 60 });
    expect(collectText(el)).toContain('Shipping — alone');
  });

  // ---------- Data integrity ----------
  it('data_sensitivity_only_public_fields_in_tree', () => {
    // Composition renders ONLY what it is given — no hidden interpolation.
    const el = buildOgComposition({
      tag: 'Zero to 10x · Episode 3',
      titleLines: ['Public Title'],
      accent: '?',
      fontSize: 72,
    });
    const text = collectText(el);
    // The only text tokens are tag, titleLines, accent, and the footer.
    const stripped = text
      .replace('Zero to 10x · Episode 3', '')
      .replace('Public Title', '')
      .replace('?', '')
      .replace(site.domain, '')
      .trim();
    expect(stripped).toBe('');
  });

  it('data_consistency_brand_hex_match_tokens', () => {
    const tokenHex = (name: string): string => {
      const m = GLOBALS_CSS.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`));
      if (!m) throw new Error(`token --color-${name} not found in globals.css`);
      return m[1].toUpperCase();
    };
    expect(OG_COLORS.shadow.toUpperCase()).toBe(tokenHex('shadow'));
    expect(OG_COLORS.marble.toUpperCase()).toBe(tokenHex('marble'));
    expect(OG_COLORS.ink.toUpperCase()).toBe(tokenHex('ink'));
    expect(OG_COLORS.oxblood.toUpperCase()).toBe(tokenHex('oxblood'));
  });

  it('data_serialization_fonts_buffer_shape', async () => {
    const fonts = await loadOgFonts();
    fonts.forEach((f) => {
      // Buffer.isBuffer is realm-safe (jsdom Uint8Array !== Node Uint8Array) and
      // sidesteps the TS2358 never-instanceof narrowing; data must be binary.
      expect(Buffer.isBuffer(f.data)).toBe(true);
    });
  });

  // ---------- config constants ----------
  it('unit_helper_exports_size_and_content_type', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
    expect(OG_CONTENT_TYPE).toBe('image/png');
  });
});
