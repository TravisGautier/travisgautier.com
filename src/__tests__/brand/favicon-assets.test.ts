import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Favicon + asset-pipeline sentinel (styling-overhaul-8.1) ──────────────
//
// Asserts the committed brand asset set exists and is well-formed:
//   - public/favicon.svg (32×32 {tg} mark, brand colors)
//   - public/apple-touch-icon.png (180), android-chrome-{192,512}.png
//   - public/fonts/{Cinzel-Black,Inter-Regular,Inter-SemiBold,Inter-Bold}.ttf
//
// Repo ROOT is resolved from import.meta.url (NOT process.cwd()) so the suite
// passes from any cwd — required when running inside a git worktree slot.
// src/__tests__/brand/favicon-assets.test.ts → ../../.. = repo root.
// ──────────────────────────────────────────────────────────────────────────

const __dirname_compat = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname_compat, '..', '..', '..');
const PUBLIC = join(ROOT, 'public');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readPngDimensions(buf: Buffer): { width: number; height: number } {
  // IHDR chunk: width at byte offset 16 (BE uint32), height at offset 20.
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function hasValidTtfMagic(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  const tag = buf.readUInt32BE(0);
  // 0x00010000 = TrueType outlines; 'OTTO' = CFF/OpenType; 'true'/'typ1' = legacy Mac; 'ttcf' = collection.
  return (
    tag === 0x00010000 ||
    tag === 0x4f54544f /* OTTO */ ||
    tag === 0x74727565 /* true */ ||
    tag === 0x74746366 /* ttcf */
  );
}

const TTFS = [
  'Cinzel-Black.ttf',
  'Inter-Regular.ttf',
  'Inter-SemiBold.ttf',
  'Inter-Bold.ttf',
];

// ──────────────────────────────────────────────────────────────────────────
// Unit — favicon.svg content
// ──────────────────────────────────────────────────────────────────────────

describe('favicon.svg — content (styling-overhaul-8.1)', () => {
  const faviconPath = join(PUBLIC, 'favicon.svg');

  /// Tests checklist item: 1
  it('unit_favicon_svg_viewbox_32: root <svg> declares viewBox "0 0 32 32"', () => {
    const svg = readFileSync(faviconPath, 'utf8');
    expect(svg).toMatch(/viewBox\s*=\s*["']0 0 32 32["']/);
  });

  /// Tests checklist item: 1
  it('unit_favicon_svg_contains_tg_mark: text content includes the {tg} curly-brace mark', () => {
    const svg = readFileSync(faviconPath, 'utf8');
    expect(svg).toContain('{tg}');
  });

  /// Tests checklist item: 1
  it('unit_favicon_svg_brand_fills: uses Marble (#F7F4EC) background and Oxblood (#6B2020) text fills', () => {
    const svg = readFileSync(faviconPath, 'utf8');
    expect(svg).toMatch(/#F7F4EC/i);
    expect(svg).toMatch(/#6B2020/i);
  });

  /// Tests checklist item: 1
  it('edge_favicon_explicit_width_height_attrs: declares explicit width="32" and height="32"', () => {
    const svg = readFileSync(faviconPath, 'utf8');
    expect(svg).toMatch(/width\s*=\s*["']32["']/);
    expect(svg).toMatch(/height\s*=\s*["']32["']/);
  });

  /// Tests checklist item: 1 — data integrity / brand-color purity (sentinel parity for public/)
  it('data_favicon_no_forbidden_pure_hex: no pure black/white/red hex literals', () => {
    const svg = readFileSync(faviconPath, 'utf8');
    expect(svg).not.toMatch(/#0{3}(?:0{3})?\b/); // pure black
    expect(svg).not.toMatch(/#f{3}(?:f{3})?\b/i); // pure white
    expect(svg).not.toMatch(/#(?:f00|ff0000)\b/i); // pure red
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Infrastructure — asset files exist and are valid
// ──────────────────────────────────────────────────────────────────────────

describe('favicon asset pipeline — files (styling-overhaul-8.1)', () => {
  /// Tests checklist item: 1
  it('infra_favicon_svg_exists_and_parses: public/favicon.svg exists and is a well-formed <svg> document', () => {
    const faviconPath = join(PUBLIC, 'favicon.svg');
    expect(existsSync(faviconPath)).toBe(true);
    const svg = readFileSync(faviconPath, 'utf8').trim();
    expect(svg).toMatch(/^<svg[\s>]/);
    expect(svg).toMatch(/<\/svg>\s*$/);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  /// Tests checklist item: 2
  it('infra_apple_touch_icon_png_180: public/apple-touch-icon.png is a 180×180 PNG', () => {
    const p = join(PUBLIC, 'apple-touch-icon.png');
    expect(existsSync(p)).toBe(true);
    const buf = readFileSync(p);
    expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(readPngDimensions(buf)).toEqual({ width: 180, height: 180 });
  });

  /// Tests checklist item: 3
  it('infra_android_chrome_192: public/android-chrome-192.png is a 192×192 PNG', () => {
    const p = join(PUBLIC, 'android-chrome-192.png');
    expect(existsSync(p)).toBe(true);
    const buf = readFileSync(p);
    expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(readPngDimensions(buf)).toEqual({ width: 192, height: 192 });
  });

  /// Tests checklist item: 4
  it('infra_android_chrome_512: public/android-chrome-512.png is a 512×512 PNG', () => {
    const p = join(PUBLIC, 'android-chrome-512.png');
    expect(existsSync(p)).toBe(true);
    const buf = readFileSync(p);
    expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(readPngDimensions(buf)).toEqual({ width: 512, height: 512 });
  });

  /// Tests checklist items: 5,6,7,8
  it('infra_fonts_dir_exists: public/fonts/ directory exists', () => {
    const dir = join(PUBLIC, 'fonts');
    expect(existsSync(dir)).toBe(true);
    expect(statSync(dir).isDirectory()).toBe(true);
  });

  /// Tests checklist item: 5
  it('infra_cinzel_black_ttf_valid: public/fonts/Cinzel-Black.ttf exists with valid TTF magic', () => {
    const p = join(PUBLIC, 'fonts', 'Cinzel-Black.ttf');
    expect(existsSync(p)).toBe(true);
    expect(hasValidTtfMagic(readFileSync(p))).toBe(true);
  });

  /// Tests checklist item: 6
  it('infra_inter_regular_ttf_valid: public/fonts/Inter-Regular.ttf exists with valid TTF magic', () => {
    const p = join(PUBLIC, 'fonts', 'Inter-Regular.ttf');
    expect(existsSync(p)).toBe(true);
    expect(hasValidTtfMagic(readFileSync(p))).toBe(true);
  });

  /// Tests checklist item: 7
  it('infra_inter_semibold_ttf_valid: public/fonts/Inter-SemiBold.ttf exists with valid TTF magic', () => {
    const p = join(PUBLIC, 'fonts', 'Inter-SemiBold.ttf');
    expect(existsSync(p)).toBe(true);
    expect(hasValidTtfMagic(readFileSync(p))).toBe(true);
  });

  /// Tests checklist item: 8
  it('infra_inter_bold_ttf_valid: public/fonts/Inter-Bold.ttf exists with valid TTF magic', () => {
    const p = join(PUBLIC, 'fonts', 'Inter-Bold.ttf');
    expect(existsSync(p)).toBe(true);
    expect(hasValidTtfMagic(readFileSync(p))).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Edge case — exact dimensions
// ──────────────────────────────────────────────────────────────────────────

describe('favicon asset pipeline — edge cases (styling-overhaul-8.1)', () => {
  /// Tests checklist item: 4
  it('edge_png_exact_dimensions_not_off_by_one: android-chrome-512.png is EXACTLY 512×512', () => {
    const buf = readFileSync(join(PUBLIC, 'android-chrome-512.png'));
    const { width, height } = readPngDimensions(buf);
    expect(width).toBe(512);
    expect(height).toBe(512);
    expect(width).not.toBe(511);
    expect(width).not.toBe(513);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Data integrity — real bytes, sane sizes
// ──────────────────────────────────────────────────────────────────────────

describe('favicon asset pipeline — data integrity (styling-overhaul-8.1)', () => {
  /// Tests checklist items: 2,3,4
  it('data_pngs_are_real_png_not_mislabeled: every icon PNG carries the 8-byte PNG signature', () => {
    for (const name of ['apple-touch-icon.png', 'android-chrome-192.png', 'android-chrome-512.png']) {
      const buf = readFileSync(join(PUBLIC, name));
      expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    }
  });

  /// Tests checklist items: 5,6,7,8
  it('data_ttfs_nonempty_and_sane_size: each TTF is 1KB..2MB (guards truncated/HTML-error downloads)', () => {
    for (const name of TTFS) {
      const size = statSync(join(PUBLIC, 'fonts', name)).size;
      expect(size).toBeGreaterThanOrEqual(1024);
      expect(size).toBeLessThanOrEqual(2_097_152);
    }
  });
});
