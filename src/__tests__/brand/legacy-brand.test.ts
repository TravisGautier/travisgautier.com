import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Residue guard: the retired "Fabled10X" brand must not come back. The only
// permitted mentions are the `formerName` field in the site config and the
// single "formerly published as" note in the brand-identity doc. The
// deployment runbook is excluded — it legitimately documents the legacy
// domain's 301 redirect and the one-time cutover commands.

const ROOT = process.cwd();
const LEGACY = /fabled ?10 ?x/i;
const SCAN_DIRS = ['src', 'public', 'docs', 'currentwork', 'pipeline'];
const SCAN_FILES = ['README.md', 'CLAUDE.md', 'AGENTS.md', 'LICENSE', 'package.json', 'docker-compose.yml', '.env.example', '.gitignore'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git']);
const SKIP_FILES = new Set(['docs/deployment-runbook.md', 'src/__tests__/brand/legacy-brand.test.ts']);
const TEXT_EXT = /\.(md|mdx|ts|tsx|js|mjs|cjs|json|ya?ml|txt|css|svg|sql)$/i;

interface Allow { file: string; pattern: RegExp; max: number }
const ALLOW: Allow[] = [
  { file: 'src/lib/site.ts', pattern: /formerName:/, max: 1 },
  { file: 'src/lib/__tests__/site.test.ts', pattern: /formerName|Fabled10X/, max: 2 },
  { file: 'src/__tests__/brand/docs.test.ts', pattern: /formerly/, max: 1 },
  { file: 'docs/brand-identity.md', pattern: /formerly published as/i, max: 1 },
  { file: 'CLAUDE.md', pattern: /formerly published as/i, max: 1 },
  { file: 'src/__tests__/brand/secrets-sentinel.test.ts', pattern: /deployment-runbook/, max: 1 },
];

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT_EXT.test(entry) || entry === '.env.example' || entry === 'LICENSE' || entry === '.gitignore') out.push(full);
  }
}

export function collectFiles(): string[] {
  const files: string[] = [];
  for (const d of SCAN_DIRS) { try { statSync(join(ROOT, d)); walk(join(ROOT, d), files); } catch { /* absent */ } }
  for (const f of SCAN_FILES) { try { statSync(join(ROOT, f)); files.push(join(ROOT, f)); } catch { /* absent */ } }
  return files.map((f) => relative(ROOT, f)).filter((f) => !SKIP_FILES.has(f));
}

interface Hit { file: string; line: number; text: string }

export function scan(): Hit[] {
  const hits: Hit[] = [];
  for (const file of collectFiles()) {
    const allow = ALLOW.filter((a) => a.file === file);
    let allowed = 0;
    readFileSync(join(ROOT, file), 'utf8').split('\n').forEach((text, i) => {
      if (!LEGACY.test(text)) return;
      const rule = allow.find((a) => a.pattern.test(text));
      if (rule && allowed < rule.max) { allowed += 1; return; }
      hits.push({ file, line: i + 1, text: text.trim().slice(0, 120) });
    });
  }
  return hits;
}

describe('legacy brand residue guard', () => {
  it('brand_no_retired_name_outside_allow_list', () => {
    const hits = scan();
    expect(hits, JSON.stringify(hits, null, 2)).toEqual([]);
  });

  it('unit_guard_covers_shipped_surfaces', () => {
    const files = collectFiles();
    for (const must of ['src/app/layout.tsx', 'public/llms.txt', 'package.json', '.env.example', 'docs/brand-identity.md']) {
      expect(files).toContain(must);
    }
    expect(files).not.toContain('docs/deployment-runbook.md');
  });

  it('unit_legacy_regex_matches_all_spellings', () => {
    for (const s of ['fabled10x', 'Fabled10X', 'FABLED10X', 'Fabled 10X', 'fabled 10x', 'https://fabled10x.com']) {
      expect(LEGACY.test(s), s).toBe(true);
    }
    expect(LEGACY.test('Zero to 10x')).toBe(false);
    expect(LEGACY.test('Travis Gautier')).toBe(false);
  });
});
