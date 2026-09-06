import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// detect-gpu benchmark data is self-hosted under public/benchmarks so the
// hero never fetches from a third-party CDN at runtime.
const DIR = join(process.cwd(), 'public', 'benchmarks');

describe('public/benchmarks', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));

  it('infra_has_desktop_and_mobile_vendor_files', () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
    expect(files.some((f) => f.startsWith('d-'))).toBe(true);
    expect(files.some((f) => f.startsWith('m-'))).toBe(true);
  });

  it('data_every_file_is_valid_json', () => {
    for (const f of files) {
      expect(() => JSON.parse(readFileSync(join(DIR, f), 'utf8')), f).not.toThrow();
    }
  });

  it('infra_matches_installed_detect_gpu_version', () => {
    const shipped = readdirSync(join(process.cwd(), 'node_modules', 'detect-gpu', 'dist', 'benchmarks')).filter((f) => f.endsWith('.json')).sort();
    expect(files.sort()).toEqual(shipped);
  });
});
