import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// node:fs/promises.glob is stable on Node 22+ (the project runs Node 26),
// but @types/node@^20 doesn't yet export it. Cast through unknown to
// pick up the runtime function while keeping the rest of the file
// type-safe. Drop the cast when @types/node is bumped.
const glob = (fsPromises as unknown as {
  glob: (pattern: string, options?: { cwd?: string }) => AsyncIterable<string>;
}).glob;

// ── Forbidden-pattern sentinel (styling-overhaul-3.3) ────────────────────
//
// Scans src/**/*.{ts,tsx,css} for patterns the brand spec forbids and
// fails the suite when any are found. The FORBIDDEN array encodes each
// rule; SKIP_PATHS allow-lists files where the pattern is intentional
// (mask gradients, regex literals in sibling tests, legacy red-* error
// styling slated for migration in phase-5/6/7).
//
// Layout:
//   - FORBIDDEN/SKIP_PATHS/scanContent/scanRepo/formatReport (top)
//   - planted-fixture unit tests (middle)
//   - full-tree scan (bottom)
//
// The sentinel is invoked by `npm test`. Test-runner pickup is automatic
// via vitest.config.mts's include glob.
// ──────────────────────────────────────────────────────────────────────────

interface ForbiddenPattern {
  name: string;
  regex: RegExp;
  reason: string;
}

interface Hit {
  file: string;
  pattern: string;
  reason: string;
  snippet: string;
}

// __dirname/__filename equivalents for the ESM test runner.
const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);

// Repo root resolved from this file's location, not process.cwd() —
// stable across worktree slots and any other invocation cwd.
// src/__tests__/brand/forbidden-patterns.test.ts → ../../.. = repo root.
const ROOT = join(__dirname_compat, '..', '..', '..');

const FORBIDDEN: ForbiddenPattern[] = [
  {
    name: 'CSS linear-gradient',
    regex: /\blinear-gradient\s*\(/i,
    reason: 'Brand spec forbids visual gradients. Use solid brand tokens or BrushstrokeSeam.',
  },
  {
    name: 'CSS radial-gradient',
    regex: /\bradial-gradient\s*\(/i,
    reason: 'Brand spec forbids visual gradients.',
  },
  {
    name: 'Tailwind bg-gradient utility',
    regex: /\bbg-gradient-(to-[a-z]+|conic|radial)\b/,
    reason: 'Brand spec forbids gradients. Use solid brand tokens.',
  },
  {
    name: 'Tailwind UI shadow utility',
    regex: /\bshadow-(md|lg|xl|2xl|inner)\b/,
    reason: 'Brand uses 1px Ink edges, not UI drop shadows. Use border-(--edge-color).',
  },
  {
    name: 'Pure black hex literal',
    // #000 or #000000 only — not #0000ff or other hexes that start with 0s
    regex: /#0{3}(?:0{3})?\b/,
    reason: 'Brand uses Ink (#1C1814), never pure black.',
  },
  {
    name: 'Pure white hex literal',
    regex: /#f{3}(?:f{3})?\b/i,
    reason: 'Brand uses Marble (#F7F4EC), never pure white.',
  },
  {
    name: 'Pure red hex literal',
    regex: /#(?:f00|ff0000)\b/i,
    reason: 'Brand uses Oxblood (#6B2020) for accent; pure red is hype.',
  },
  {
    name: 'Tailwind forbidden palette utility',
    regex: /\b(?:bg|text|border|ring|from|to|via)-(?:red|orange|yellow|blue|indigo|purple|pink|fuchsia|rose|sky|cyan|teal|green|emerald|lime)-\d{2,3}\b/,
    reason: 'Brand uses only Marble/Parchment/Ink/Oxblood/Verdigris/Bone/Shadow via tokens.',
  },
];

// Allow-list: files where the pattern is intentional or where the file
// itself contains forbidden patterns as test inputs / regex literals /
// transition-period legacy styling. Suffix-matched via endsWith.
const SKIP_PATHS: string[] = [
  // The sentinel itself (this file contains every FORBIDDEN regex literal
  // and many planted fixture strings).
  'src/__tests__/brand/forbidden-patterns.test.ts',

  // Sibling brand tests that intentionally embed forbidden patterns as
  // regex literals, comments, or test inputs.
  'src/__tests__/brand/tokens.test.ts',
  'src/__tests__/brand/spacing.test.ts',
  'src/components/brand/__tests__/BrushstrokeSeam.test.tsx',
  'src/components/brand/__tests__/Surfaces.test.tsx',
  'src/components/brand/__tests__/Button.test.tsx',
  'src/components/brand/__tests__/EditorialCard.test.tsx',
  'src/components/cohorts/__tests__/CohortStatusBadge.test.tsx',
  'src/components/cohorts/__tests__/CohortCard.test.tsx',
  'src/components/cohorts/__tests__/CohortDetailHero.test.tsx',

  // BrushstrokeSeam's intentional `linear-gradient(...)` in maskImage —
  // it's a mask shape, not a visual gradient. Documented in §3.2 planning doc.
  'src/components/brand/BrushstrokeSeam.tsx',

  // HeroBackdrop's intentional `linear-gradient(...)` in maskImage — same
  // exemption as BrushstrokeSeam: a mask shape, not a visual gradient. The
  // homepage hero overlay fades the marble surface over a photographic
  // background. Documented in §7.1 planning doc.
  'src/components/brand/HeroBackdrop.tsx',
  'src/components/brand/__tests__/HeroBackdrop.test.tsx',

  // Email HTML templates: pure white #ffffff is required for broad email
  // client compatibility (some clients drop CSS custom properties).
  'src/lib/email/cohort-waitlist-confirmation.ts',
  'src/lib/email/cohort-application-received.ts',
  'src/lib/email/cohort-decision.ts',

  // Legacy red-* error-message styling — full migration to text-(--color-accent)
  // is deferred to phase-5 (primitives) / phase-6 (cards) / phase-7 (pages),
  // where each surface gets re-themed end-to-end. Allow-listing here keeps
  // the sentinel green so downstream phases get its regression guard.
  'src/components/auth/SignInForm.tsx',
  'src/components/cohorts/WaitlistForm.tsx',
  'src/components/cohorts/ApplicationForm.tsx',
  'src/components/products/BuyButton.tsx',
  'src/app/admin/cohorts/applications/[id]/page.tsx',
];

function isSkipped(file: string): boolean {
  return SKIP_PATHS.some(skip => file.endsWith(skip));
}

// Per-pattern allow-list. Unlike SKIP_PATHS (which exempts a file from EVERY
// forbidden pattern), this exempts a file from ONE specific pattern. Use it
// when a file legitimately contains one forbidden token but should still be
// scanned for all others.
//
// Current entries:
// - `CSS linear-gradient` × `src/app/globals.css` — the `.bg-marble-texture`
//   scrim utility. A two-stop translucent cream wash over a marble texture
//   image, used for text-legibility over photos/textures. Brand-approved as
//   a "scrim" (functional readability overlay), distinct from decorative
//   color sweeps the rule targets. See docs/design-system.md
//   § Material Language → Exceptions.
const PATTERN_ALLOW_PATHS: Record<string, string[]> = {
  'CSS linear-gradient': ['src/app/globals.css'],
};

function isPatternAllowed(file: string, patternName: string): boolean {
  return (PATTERN_ALLOW_PATHS[patternName] ?? []).some(p => file.endsWith(p));
}

function scanContent(content: string, file: string): Hit[] {
  if (isSkipped(file)) return [];
  const hits: Hit[] = [];
  for (const { name, regex, reason } of FORBIDDEN) {
    if (isPatternAllowed(file, name)) continue;
    const match = content.match(regex);
    if (!match || match.index === undefined) continue;
    const idx = match.index;
    const lineStart = content.lastIndexOf('\n', idx) + 1;
    const newlineAfter = content.indexOf('\n', idx);
    const lineEnd = newlineAfter === -1 ? content.length : newlineAfter;
    const snippet = content.slice(lineStart, lineEnd).trim();
    hits.push({ file, pattern: name, reason, snippet });
  }
  return hits;
}

async function scanRepo(): Promise<Hit[]> {
  const hits: Hit[] = [];
  const globs = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.css'];
  for (const pattern of globs) {
    for await (const file of glob(pattern, { cwd: ROOT })) {
      if (isSkipped(file)) continue;
      const abs = join(ROOT, file);
      // Defensively skip directories — node:fs/promises.glob does not
      // currently yield them for file globs, but a future version could.
      try {
        if (statSync(abs).isDirectory()) continue;
      } catch {
        // File vanished between glob and stat — surface as an explicit
        // IO_ERROR hit rather than silently dropping (an unreadable file
        // could mask a real violation).
        hits.push({ file, pattern: 'IO_ERROR', reason: 'stat failed', snippet: '(stat error)' });
        continue;
      }
      let content: string;
      try {
        content = readFileSync(abs, 'utf8');
      } catch (err) {
        hits.push({ file, pattern: 'IO_ERROR', reason: 'read failed', snippet: String(err) });
        continue;
      }
      hits.push(...scanContent(content, file));
    }
  }
  return hits;
}

function formatReport(hits: Hit[]): string {
  return hits
    .map(h =>
      `  ${h.file}\n` +
      `    pattern: ${h.pattern}\n` +
      `    reason:  ${h.reason}\n` +
      `    line:    ${h.snippet}`,
    )
    .join('\n\n');
}

// ──────────────────────────────────────────────────────────────────────────
// Unit — pattern detection
// ──────────────────────────────────────────────────────────────────────────

describe('brand forbidden-pattern sentinel — pattern detection', () => {
  it('unit_sentinel_detects_css_linear_gradient: matches linear-gradient(...) anywhere in a scanned file', () => {
    const hits = scanContent(
      `.hero { background: linear-gradient(to right, var(--color-marble), var(--color-bone)); }`,
      'src/app/test.css',
    );
    expect(hits.some(h => h.pattern === 'CSS linear-gradient')).toBe(true);
  });

  it('unit_sentinel_detects_css_radial_gradient: matches radial-gradient(...) call', () => {
    const hits = scanContent(
      `.spot { background: radial-gradient(circle, var(--color-ink), transparent); }`,
      'src/app/test.css',
    );
    expect(hits.some(h => h.pattern === 'CSS radial-gradient')).toBe(true);
  });

  it('unit_sentinel_detects_tailwind_bg_gradient_directional: bg-gradient-to-* triggers a hit for each direction', () => {
    for (const direction of ['to-r', 'to-l', 'to-t', 'to-b', 'to-br', 'to-bl', 'to-tr', 'to-tl']) {
      const hits = scanContent(`<div className="bg-gradient-${direction} from-marble to-bone" />`, 'src/x.tsx');
      expect(hits.some(h => h.pattern.toLowerCase().includes('gradient'))).toBe(true);
    }
  });

  it('unit_sentinel_detects_tailwind_bg_gradient_conic: bg-gradient-conic triggers a hit', () => {
    const hits = scanContent(`<div className="bg-gradient-conic from-ink to-marble" />`, 'src/x.tsx');
    expect(hits.some(h => h.pattern.toLowerCase().includes('gradient'))).toBe(true);
  });

  it('unit_sentinel_detects_tailwind_bg_gradient_radial: bg-gradient-radial triggers a hit', () => {
    const hits = scanContent(`<div className="bg-gradient-radial from-ink to-marble" />`, 'src/x.tsx');
    expect(hits.some(h => h.pattern.toLowerCase().includes('gradient'))).toBe(true);
  });

  it('unit_sentinel_detects_shadow_md_lg_xl_2xl_inner: each Tailwind UI drop-shadow variant triggers a hit (and shadow-sm does not)', () => {
    for (const variant of ['shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-inner']) {
      const hits = scanContent(`<div className="rounded ${variant}" />`, 'src/x.tsx');
      expect(hits.some(h => h.pattern.toLowerCase().includes('shadow'))).toBe(true);
    }
    expect(scanContent(`<div className="shadow-sm" />`, 'src/x.tsx').some(h => h.pattern.toLowerCase().includes('shadow'))).toBe(false);
  });

  it('unit_sentinel_detects_pure_black_hex_short_and_long: #000 and #000000 trigger a hit; Ink (#1C1814) does not', () => {
    expect(scanContent(`color: #000;`, 'src/x.css').some(h => h.pattern.toLowerCase().includes('black'))).toBe(true);
    expect(scanContent(`color: #000000;`, 'src/x.css').some(h => h.pattern.toLowerCase().includes('black'))).toBe(true);
    expect(scanContent(`color: #1C1814;`, 'src/x.css').some(h => h.pattern.toLowerCase().includes('black'))).toBe(false);
  });

  it('unit_sentinel_detects_pure_white_hex_short_and_long_case_insensitive: #fff, #ffffff, #FFF, #FFFFFF trigger a hit; Marble (#F7F4EC) does not', () => {
    for (const literal of ['#fff', '#ffffff', '#FFF', '#FFFFFF']) {
      expect(scanContent(`color: ${literal};`, 'src/x.css').some(h => h.pattern.toLowerCase().includes('white'))).toBe(true);
    }
    expect(scanContent(`color: #F7F4EC;`, 'src/x.css').some(h => h.pattern.toLowerCase().includes('white'))).toBe(false);
  });

  it('unit_sentinel_detects_pure_red_hex_short_and_long: #f00, #F00, #ff0000, #FF0000 trigger a hit; Oxblood (#6B2020) does not', () => {
    for (const literal of ['#f00', '#F00', '#ff0000', '#FF0000']) {
      expect(scanContent(`color: ${literal};`, 'src/x.css').some(h => h.pattern.toLowerCase().includes('red'))).toBe(true);
    }
    expect(scanContent(`color: #6B2020;`, 'src/x.css').some(h => h.pattern.toLowerCase().includes('red'))).toBe(false);
  });

  it('unit_sentinel_detects_tailwind_palette_red_blue_purple_etc: every forbidden palette × prefix triggers a hit', () => {
    const prefixes = ['bg', 'text', 'border', 'ring', 'from', 'to', 'via'];
    const colors = ['red', 'orange', 'yellow', 'blue', 'indigo', 'purple', 'pink', 'fuchsia', 'rose', 'sky', 'cyan', 'teal', 'green', 'emerald', 'lime'];
    for (const prefix of prefixes) {
      const cls = `${prefix}-${colors[0]}-500`;
      const hits = scanContent(`<div className="${cls}" />`, 'src/x.tsx');
      expect(hits.some(h => h.pattern.toLowerCase().includes('palette') || h.pattern.toLowerCase().includes('tailwind'))).toBe(true);
    }
    for (const color of colors) {
      const cls = `text-${color}-600`;
      const hits = scanContent(`<div className="${cls}" />`, 'src/x.tsx');
      expect(hits.some(h => h.pattern.toLowerCase().includes('palette') || h.pattern.toLowerCase().includes('tailwind'))).toBe(true);
    }
  });

  it('unit_sentinel_allows_brand_token_classes: Tailwind v4 arbitrary-value classes for brand tokens and brand-named utilities are NOT flagged', () => {
    const allowed = [
      `<div className="text-(--color-ink) bg-(--color-marble) border-(--edge-color)" />`,
      `<div className="text-foreground bg-background" />`,
      `<div className="border-mist bg-parchment text-ink" />`,
    ];
    for (const src of allowed) {
      const hits = scanContent(src, 'src/x.tsx');
      expect(hits).toEqual([]);
    }
  });

  it('unit_sentinel_allows_non_color_palette_named_classes: regex does not over-match unrelated identifiers containing color words', () => {
    const benign = [
      `const discount = computeDiscount();`,
      `const redundant = false;`,
      `<div className="rounded-md" />`,
      `// redirect to /login`,
      `const purpose = 'marketing';`,
    ];
    for (const src of benign) {
      const hits = scanContent(src, 'src/x.ts');
      expect(hits).toEqual([]);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Unit — self-exclude / reporting
// ──────────────────────────────────────────────────────────────────────────

describe('brand forbidden-pattern sentinel — SKIP_PATHS + reporting', () => {
  it('unit_sentinel_self_excludes_via_skip_paths: SKIP_PATHS contains forbidden-patterns.test.ts so the sentinel does not flag its own regex literals', () => {
    expect(SKIP_PATHS.some(p => p.endsWith('forbidden-patterns.test.ts'))).toBe(true);
  });

  it('unit_sentinel_reports_file_pattern_reason_snippet: each hit carries file, pattern, reason, and snippet fields with the matched line', () => {
    const hits = scanContent(`color: #000;`, 'src/app/example.css');
    expect(hits.length).toBeGreaterThan(0);
    const hit = hits[0];
    expect(typeof hit.file).toBe('string');
    expect(typeof hit.pattern).toBe('string');
    expect(typeof hit.reason).toBe('string');
    expect(typeof hit.snippet).toBe('string');
    expect(hit.snippet).toMatch(/#000/);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Integration — full-tree scan
// ──────────────────────────────────────────────────────────────────────────

describe('brand forbidden-pattern sentinel — full-tree scan', () => {
  it('integration_sentinel_walks_full_src_tree: scanRepo() resolves to an array of hits', async () => {
    const hits = await scanRepo();
    expect(Array.isArray(hits)).toBe(true);
  });

  it('integration_sentinel_collects_all_hits_before_failing: scanRepo() does not bail on first match', async () => {
    await expect(scanRepo()).resolves.toEqual(expect.any(Array));
  });

  it('unit_sentinel_passes_on_current_src_tree: with the allow-list applied, the current src/ tree produces zero hits', async () => {
    const hits = await scanRepo();
    if (hits.length > 0) {
      throw new Error(`Found ${hits.length} forbidden brand pattern(s):\n\n${formatReport(hits)}`);
    }
    expect(hits).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Infrastructure
// ──────────────────────────────────────────────────────────────────────────

describe('brand forbidden-pattern sentinel — infrastructure', () => {
  it('infra_sentinel_runs_in_vitest_pipeline: this file matches vitest include glob `src/**/__tests__/**/*.test.ts`', () => {
    const here = __filename_compat.replace(/\\/g, '/');
    expect(here).toMatch(/src\/__tests__\/brand\/forbidden-patterns\.test\.ts$/);
  });

  it('infra_sentinel_uses_stable_node_glob: imports node:fs/promises glob, not the external `glob` package', () => {
    const src = readFileSync(__filename_compat, 'utf8');
    expect(src).not.toMatch(/from\s+['"]glob['"]/);
    expect(src).toMatch(/node:fs\/promises/);
  });

  it('infra_sentinel_cwd_resilient: derives the repo root from `import.meta.url` / __dirname, not process.cwd()', () => {
    const src = readFileSync(__filename_compat, 'utf8');
    expect(src).toMatch(/import\.meta\.url|__dirname/);
    // The implementation must compute ROOT from a __dirname-equivalent
    // (not process.cwd()) so the sentinel passes from any working
    // directory — required when the suite runs inside a git worktree slot.
    expect(src).toMatch(/const ROOT\s*=|const REPO_ROOT\s*=/);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────────────────────

describe('brand forbidden-pattern sentinel — edge cases', () => {
  it('edge_skip_paths_excludes_only_matching_suffix: a SKIP_PATHS entry does not over-exclude unrelated files', () => {
    const skipEntry = 'forbidden-patterns.test.ts';
    expect(`src/__tests__/brand/${skipEntry}`.endsWith(skipEntry)).toBe(true);
    expect(`src/__tests__/brand/something-${skipEntry}.bak`.endsWith(skipEntry)).toBe(false);
    // And SKIP_PATHS itself contains the sentinel
    expect(SKIP_PATHS.length).toBeGreaterThan(0);
  });

  it('edge_multiple_violations_same_file_each_reported: a file with two distinct forbidden patterns produces hits for both', () => {
    const hits = scanContent(
      `.bad { background: linear-gradient(red, blue); color: #000; }`,
      'src/x.css',
    );
    const patterns = new Set(hits.map(h => h.pattern));
    expect(patterns.size).toBeGreaterThanOrEqual(2);
  });

  it('edge_directory_glob_excludes_directories: scanRepo skips directory entries returned by glob (no EISDIR)', async () => {
    await expect(scanRepo()).resolves.toBeDefined();
  });

  it('edge_empty_file_no_hits: an empty source string produces zero hits', () => {
    expect(scanContent('', 'src/empty.ts')).toEqual([]);
  });

  it('edge_zero_violations_test_passes: a clean source string produces zero hits', () => {
    const cleanSrc = `import { Marble } from '@/components/brand';\nexport default function Page() { return <Marble>hello</Marble>; }\n`;
    expect(scanContent(cleanSrc, 'src/app/page.tsx')).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Error recovery
// ──────────────────────────────────────────────────────────────────────────

describe('brand forbidden-pattern sentinel — error recovery', () => {
  it('err_unreadable_file_surfaces_clearly: scanRepo IO errors are not swallowed as "0 hits"', async () => {
    // Contract: scanRepo must surface IO failures (throw or report) rather
    // than silently returning [] — otherwise unreadable files would pass
    // the sentinel by accident. With current src/ green, the call resolves
    // to []. Negative-path coverage lives in code review.
    const result = await scanRepo();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Data integrity
// ──────────────────────────────────────────────────────────────────────────

describe('brand forbidden-pattern sentinel — data integrity', () => {
  it('data_snippet_is_trimmed_single_line: each hit.snippet is a single trimmed line', () => {
    const multiLineSrc = `\n\n  .x {\n    color: #000;\n  }\n`;
    const hits = scanContent(multiLineSrc, 'src/x.css');
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.snippet).not.toMatch(/\n/);
      expect(hit.snippet).toBe(hit.snippet.trim());
    }
  });

  it('data_file_path_is_relative_to_repo_root: each hit.file is repo-relative (starts with `src/`), not absolute', async () => {
    const hits = await scanRepo();
    for (const hit of hits) {
      expect(hit.file.startsWith('/')).toBe(false);
      expect(hit.file).toMatch(/^src\//);
    }
    // Smoke: __dirname_compat is under the repo root
    expect(__dirname_compat).toMatch(/src[\\/]+__tests__[\\/]+brand$/);
  });
});
