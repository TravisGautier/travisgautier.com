import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('public/llms.txt', () => {
  it('infra_llmstxt_has_sitemap', () => {
    const content = readFileSync(join(process.cwd(), 'public/llms.txt'), 'utf8');
    expect(content).toMatch(/Sitemap:\s+https:\/\/travisgautier\.com\/sitemap\.xml/);
  });

  it('infra_llmstxt_mentions_build_log', () => {
    const content = readFileSync(join(process.cwd(), 'public/llms.txt'), 'utf8');
    expect(content).toMatch(/\/build-log/);
  });

  it('infra_llmstxt_mentions_cohorts', () => {
    const content = readFileSync(join(process.cwd(), 'public/llms.txt'), 'utf8');
    expect(content).toMatch(/\/cohorts/);
  });
});
