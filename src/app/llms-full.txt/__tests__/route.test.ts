import { vi } from 'vitest';

vi.mock('@/lib/substack/feed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/substack/feed')>();
  return { ...actual, getEssays: vi.fn() };
});

import { describe, expect, it } from 'vitest';
import { getEssays } from '@/lib/substack/feed';
import { site } from '@/lib/site';
import { GET, revalidate } from '../route';

const mockGetEssays = vi.mocked(getEssays);

describe('/llms-full.txt', () => {
  it('unit_emits_plain_text_with_every_essay_body_and_canonical', async () => {
    mockGetEssays.mockResolvedValue([
      {
        slug: 'a',
        title: 'Essay A',
        subtitle: 'Sub A',
        url: 'https://travisgautier.substack.com/p/a',
        publishedAt: '2026-10-22T17:41:33.000Z',
        contentHtml: '<p>Body &amp; soul.</p>',
      },
    ]);
    const res = await GET();
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain(`# ${site.name}`);
    expect(text).toContain(site.substackName);
    expect(text).toContain('### Essay A');
    expect(text).toContain('Published: 2026-10-22');
    expect(text).toContain('Canonical: https://travisgautier.substack.com/p/a');
    expect(text).toContain('Summary: Sub A');
    expect(text).toContain('Body & soul.');
    expect(text).not.toContain('<p>');
  });

  it('error_empty_feed_still_returns_header', async () => {
    mockGetEssays.mockResolvedValue([]);
    const text = await (await GET()).text();
    expect(text).toContain(`Essays: ${site.substackPublicationUrl}`);
    expect(revalidate).toBe(3600);
  });
});
