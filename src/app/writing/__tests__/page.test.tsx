import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/substack/feed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/substack/feed')>();
  return { ...actual, getEssays: vi.fn() };
});

vi.mock('@/components/capture/EmailCapture', () => ({
  EmailCapture: ({ source }: { source: string }) => (
    <div data-testid="email-capture" data-source={source} />
  ),
}));

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getEssays } from '@/lib/substack/feed';
import { site } from '@/lib/site';
import WritingIndex, { metadata } from '../page';

const mockGetEssays = vi.mocked(getEssays);

const ESSAYS = [
  {
    slug: 'earn-client-referrals',
    title: 'How to Earn Client Referrals as a Freelancer',
    subtitle: 'Client #1',
    url: 'https://travisgautier.substack.com/p/earn-client-referrals',
    publishedAt: '2026-10-22T17:41:33.000Z',
    contentHtml: '<p>x</p>',
  },
  {
    slug: 'pipeline-orchestrator-roadmap',
    title: 'The Pipeline Orchestrator Roadmap',
    subtitle: '',
    url: 'https://travisgautier.substack.com/p/pipeline-orchestrator-roadmap',
    publishedAt: '',
    contentHtml: '',
  },
];

async function renderPage() {
  const ui = await WritingIndex();
  return render(ui);
}

function jsonLd(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent ?? 'null');
}

describe('/writing', () => {
  beforeEach(() => mockGetEssays.mockResolvedValue(ESSAYS));

  it('unit_lists_every_essay_as_a_card_linking_to_substack_with_utm', async () => {
    await renderPage();
    const link = screen.getByRole('link', { name: /earn client referrals/i });
    const href = new URL(link.getAttribute('href')!);
    expect(href.origin + href.pathname).toBe(`${site.substackPublicationUrl}/p/earn-client-referrals`);
    expect(href.searchParams.get('utm_source')).toBe(site.domain);
    expect(href.searchParams.get('utm_medium')).toBe('site');
    expect(href.searchParams.get('utm_content')).toBe('earn-client-referrals');
    expect(screen.getByText('Oct 22, 2026')).toBeInTheDocument();
    expect(screen.getByText('Essay')).toBeInTheDocument();
  });

  it('unit_names_the_publication_and_mounts_capture', async () => {
    const { container } = await renderPage();
    expect(container.textContent).toContain(site.substackName);
    expect(screen.getByTestId('email-capture').dataset.source).toBe('writing-index');
  });

  it('unit_blog_jsonld_lists_posts_with_person_author', async () => {
    const { container } = await renderPage();
    const ld = jsonLd(container);
    expect(ld['@type']).toBe('Blog');
    expect(ld.url).toBe(site.substackPublicationUrl);
    expect(ld.author['@type']).toBe('Person');
    expect(ld.author.sameAs).toContain(site.substackPublicationUrl);
    expect(ld.blogPost).toHaveLength(2);
    expect(ld.blogPost[0]['@type']).toBe('BlogPosting');
  });

  it('error_empty_feed_renders_archive_link_not_crash', async () => {
    mockGetEssays.mockResolvedValue([]);
    await renderPage();
    const link = screen.getByRole('link', { name: /read the archive/i });
    expect(link.getAttribute('href')).toContain(`${site.substackPublicationUrl}/archive`);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('a11y_single_h1', async () => {
    await renderPage();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('infra_metadata_canonical', () => {
    expect(metadata.title).toBe('Writing');
    expect(metadata.alternates?.canonical).toBe('/writing');
    expect(String(metadata.description)).toContain(site.substackName);
  });
});
