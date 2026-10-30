import { site } from '@/lib/site';

export interface Essay {
  slug: string;
  title: string;
  subtitle: string;
  url: string;
  publishedAt: string;
  /** Full post HTML from content:encoded; empty when the feed omits it. */
  contentHtml: string;
}

export const FEED_REVALIDATE_SECONDS = 3600;

const ITEM_RE = /<item>([\s\S]*?)<\/item>/g;

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : '';
}

function unwrapCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1').trim();
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}

export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|h[1-6]|li|blockquote|pre|div)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function slugFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '');
    return path.split('/').pop() ?? '';
  } catch {
    return '';
  }
}

export function parseFeed(xml: string): Essay[] {
  const essays: Essay[] = [];
  for (const m of xml.matchAll(ITEM_RE)) {
    const block = m[1];
    const url = decodeEntities(unwrapCdata(tag(block, 'link')));
    const title = decodeEntities(unwrapCdata(tag(block, 'title')));
    if (!url || !title) continue;
    const pub = tag(block, 'pubDate');
    const date = pub ? new Date(pub) : null;
    essays.push({
      slug: slugFromUrl(url),
      title,
      subtitle: stripHtml(unwrapCdata(tag(block, 'description'))),
      url,
      publishedAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : '',
      contentHtml: unwrapCdata(tag(block, 'content:encoded')),
    });
  }
  return essays.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Published essays, newest first. Never throws: an unreachable feed yields []. */
export async function getEssays(): Promise<Essay[]> {
  try {
    const res = await fetch(site.substackFeedUrl, {
      next: { revalidate: FEED_REVALIDATE_SECONDS },
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) return [];
    return parseFeed(await res.text());
  } catch {
    return [];
  }
}

export function formatEssayDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
