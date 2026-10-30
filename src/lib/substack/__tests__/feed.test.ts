import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  decodeEntities,
  formatEssayDate,
  getEssays,
  parseFeed,
  slugFromUrl,
  stripHtml,
} from '../feed';
import { site } from '@/lib/site';

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
<title><![CDATA[The Forward Deployed Freelancer]]></title>
<item>
<title><![CDATA[How to Earn Client Referrals as a Freelancer]]></title>
<description><![CDATA[Client #1: The best referrals come from the specialist &amp; friend.]]></description>
<link>https://travisgautier.substack.com/p/earn-client-referrals</link>
<guid isPermaLink="false">https://travisgautier.substack.com/p/earn-client-referrals</guid>
<pubDate>Thu, 22 Oct 2026 17:41:33 GMT</pubDate>
<content:encoded><![CDATA[<p>First paragraph.</p><h2>Heading</h2><p>Second &quot;quoted&quot; paragraph.<br>Line two.</p>]]></content:encoded>
</item>
<item>
<title>The Pipeline Orchestrator Roadmap</title>
<description>How I run an agent team</description>
<link>https://travisgautier.substack.com/p/pipeline-orchestrator-roadmap/</link>
<pubDate>Thu, 15 Oct 2026 13:04:15 GMT</pubDate>
</item>
<item>
<title>No link item</title>
</item>
</channel>
</rss>`;

describe('substack feed parser', () => {
  it('unit_parses_items_newest_first', () => {
    const essays = parseFeed(FEED);
    expect(essays).toHaveLength(2);
    expect(essays[0].slug).toBe('earn-client-referrals');
    expect(essays[1].slug).toBe('pipeline-orchestrator-roadmap');
  });

  it('unit_unwraps_cdata_and_entities', () => {
    const [first] = parseFeed(FEED);
    expect(first.title).toBe('How to Earn Client Referrals as a Freelancer');
    expect(first.subtitle).toBe('Client #1: The best referrals come from the specialist & friend.');
    expect(first.publishedAt).toBe('2026-10-22T17:41:33.000Z');
    expect(first.contentHtml).toContain('<h2>Heading</h2>');
  });

  it('unit_item_without_content_has_empty_html_and_iso_date', () => {
    const [, second] = parseFeed(FEED);
    expect(second.contentHtml).toBe('');
    expect(second.publishedAt).toBe('2026-10-15T13:04:15.000Z');
    expect(second.url).toBe('https://travisgautier.substack.com/p/pipeline-orchestrator-roadmap/');
  });

  it('unit_strip_html_keeps_paragraph_breaks', () => {
    const [first] = parseFeed(FEED);
    const text = stripHtml(first.contentHtml);
    expect(text).toBe('First paragraph.\n\nHeading\n\nSecond "quoted" paragraph.\nLine two.');
  });

  it('unit_helpers', () => {
    expect(decodeEntities('a &amp; b &#8217;s &lt;x&gt;')).toBe("a & b ’s <x>");
    expect(slugFromUrl('https://x.test/p/a-slug/')).toBe('a-slug');
    expect(slugFromUrl('not a url')).toBe('');
    expect(formatEssayDate('2026-10-22T17:41:33.000Z')).toBe('Oct 22, 2026');
    expect(formatEssayDate('')).toBe('');
  });

  it('edge_empty_or_garbage_xml_yields_no_essays', () => {
    expect(parseFeed('')).toEqual([]);
    expect(parseFeed('<rss><channel></channel></rss>')).toEqual([]);
    expect(parseFeed('<item><title>x</title></item>')).toEqual([]);
  });
});

describe('getEssays', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  afterEach(() => fetchSpy.mockReset());

  it('int_fetches_publication_feed_with_hourly_revalidate', async () => {
    fetchSpy.mockResolvedValue(new Response(FEED, { status: 200 }));
    const essays = await getEssays();
    expect(essays).toHaveLength(2);
    const [target] = fetchSpy.mock.calls[0];
    const url = target instanceof Request ? target.url : String(target);
    expect(url).toBe(site.substackFeedUrl);
  });

  it('error_non_ok_response_yields_empty_list', async () => {
    fetchSpy.mockResolvedValue(new Response('nope', { status: 503 }));
    expect(await getEssays()).toEqual([]);
  });

  it('error_network_failure_yields_empty_list', async () => {
    fetchSpy.mockRejectedValue(new Error('offline'));
    expect(await getEssays()).toEqual([]);
  });
});
