import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Sentinel: no credential-shaped strings anywhere in docs, source, plans, or
// pipeline state. Motivated by two Postgres passwords that shipped in
// docs/deployment-runbook.md (June–Sept 2026) while the repo was public.

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'docs', 'currentwork', 'pipeline', 'public', '.claude'];
const SCAN_FILES = ['README.md', 'CLAUDE.md', 'AGENTS.md', '.env.example', 'docker-compose.yml'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'migrations']);
const TEXT_EXT = /\.(md|mdx|ts|tsx|js|mjs|cjs|json|ya?ml|toml|txt|env\.example|yml|sh|css|svg)$/i;

const PATTERNS: Array<{ name: string; regex: RegExp }> = [
  // connection strings carrying a real-looking password (≥ 8 chars, not a placeholder)
  { name: 'db connection string with password', regex: /postgres(?:ql)?:\/\/[^:\s/]+:(?!<|\$\{|\$\(|dev@)[^@\s<>$]{8,}@/i },
  { name: 'SQL CREATE/ALTER ROLE with literal password', regex: /PASSWORD\s+'(?!<)[^']{8,}'/i },
  { name: 'Stripe secret key', regex: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { name: 'Stripe webhook secret', regex: /\bwhsec_[A-Za-z0-9]{16,}/ },
  { name: 'Resend API key', regex: /\bre_[A-Za-z0-9]{20,}\b/ },
  { name: 'AUTH_SECRET assignment', regex: /AUTH_SECRET\s*=\s*['"]?[A-Za-z0-9+/=_-]{16,}/ },
  { name: 'private key block', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'password table cell with literal', regex: /password\s*\|\s*`(?!<)[^`\s]{16,}`/i },
];

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (TEXT_EXT.test(entry) || entry === '.env.example') out.push(full);
  }
}

function collectFiles(): string[] {
  const files: string[] = [];
  for (const d of SCAN_DIRS) {
    try { statSync(join(ROOT, d)); } catch { continue; }
    walk(join(ROOT, d), files);
  }
  for (const f of SCAN_FILES) {
    try { statSync(join(ROOT, f)); files.push(join(ROOT, f)); } catch { /* absent is fine */ }
  }
  return files.filter((f) => !f.endsWith('secrets-sentinel.test.ts'));
}

interface Hit { file: string; line: number; pattern: string }

// Test fixtures deliberately use fake credentials; a line that names itself a
// fixture is not a leak.
const FIXTURE_LINE = /\b(test|leak|fake|dummy|example|placeholder|stub)/i;

function scan(): Hit[] {
  const hits: Hit[] = [];
  for (const file of collectFiles()) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((text, i) => {
      if (FIXTURE_LINE.test(text)) return;
      for (const { name, regex } of PATTERNS) {
        if (regex.test(text)) hits.push({ file: relative(ROOT, file), line: i + 1, pattern: name });
      }
    });
  }
  return hits;
}

describe('secrets sentinel', () => {
  it('sec_no_credential_shaped_strings_in_repo_text', () => {
    const hits = scan();
    expect(hits, JSON.stringify(hits, null, 2)).toEqual([]);
  });

  it('unit_sentinel_scans_the_runbook', () => {
    const files = collectFiles().map((f) => relative(ROOT, f));
    expect(files).toContain('docs/deployment-runbook.md');
    expect(files).toContain('.env.example');
  });

  it('unit_patterns_match_known_shapes', () => {
    const shapes = [
      'DATABASE_URL=postgresql://app_user:Abcdefgh12345678@127.0.0.1:5432/db',
      "CREATE ROLE x LOGIN PASSWORD 'Abcdefgh12345678';",
      'sk_live_' + 'A'.repeat(24),
      'whsec_' + 'B'.repeat(24),
      '| Postgres password | `' + 'C'.repeat(32) + '` |',
    ];
    for (const s of shapes) expect(PATTERNS.some((p) => p.regex.test(s)), s).toBe(true);
  });

  it('unit_fixture_lines_are_ignored', () => {
    expect(FIXTURE_LINE.test("process.env.AUTH_SECRET = 'test-auth-secret-32-bytes-long!!';")).toBe(true);
    expect(FIXTURE_LINE.test('DATABASE_URL=postgresql://app_user:Abcdefgh12345678@127.0.0.1:5432/db')).toBe(false);
  });

  it('unit_patterns_allow_placeholders', () => {
    const ok = [
      'DATABASE_URL=postgres://travisgautier:dev@localhost:5432/travisgautier',
      'DATABASE_URL=postgresql://travisgautier_app:<from password manager>@127.0.0.1:5432/travisgautier',
      "CREATE ROLE travisgautier_app LOGIN PASSWORD '<from password manager>';",
      'DATABASE_URL=postgresql://travisgautier_app:<NEWPW>@127.0.0.1:5432/travisgautier',
      "ALTER ROLE travisgautier_app PASSWORD :'pw';",
    ];
    for (const s of ok) expect(PATTERNS.some((p) => p.regex.test(s)), s).toBe(false);
  });
});
