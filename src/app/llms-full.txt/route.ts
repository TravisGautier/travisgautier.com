import { getEssays, stripHtml, FEED_REVALIDATE_SECONDS } from '@/lib/substack/feed';
import { site } from '@/lib/site';

export const revalidate = FEED_REVALIDATE_SECONDS;

export async function GET() {
  const essays = await getEssays();
  const lines: string[] = [
    `# ${site.name}`,
    '',
    site.tagline,
    '',
    `Site: ${site.url}`,
    `Essays: ${site.substackPublicationUrl} (${site.substackName})`,
    `Index: ${site.url}/writing`,
    `Sitemap: ${site.url}/sitemap.xml`,
    '',
    `## ${site.substackName}`,
    '',
    'Essays by Travis Gautier on running a team of AI coding agents for real',
    'client work, the TDD pipeline behind it, and the business of forward',
    'deployed freelance development. Canonical URL for each essay is on Substack.',
    '',
  ];
  for (const e of essays) {
    lines.push(`### ${e.title}`);
    lines.push('');
    if (e.publishedAt) lines.push(`Published: ${e.publishedAt.slice(0, 10)}`);
    lines.push(`Canonical: ${e.url}`);
    if (e.subtitle) lines.push(`Summary: ${e.subtitle}`);
    lines.push('');
    const text = stripHtml(e.contentHtml);
    if (text) {
      lines.push(text);
      lines.push('');
    }
  }
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${FEED_REVALIDATE_SECONDS}`,
    },
  });
}
