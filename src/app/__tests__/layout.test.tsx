import { vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Cinzel: () => ({ variable: '--font-display', className: 'font-cinzel' }),
  Inter: () => ({ variable: '--font-body', className: 'font-inter' }),
  JetBrains_Mono: () => ({ variable: '--font-mono', className: 'font-jetbrains-mono' }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { metadata } from '../layout';
import RootLayout from '../layout';
import { site } from '@/lib/site';

describe('layout metadata', () => {
  // --- Unit: metadataBase ---

  it('unit_metadata_base_url', () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(metadata.metadataBase?.toString()).toBe(`${site.url}/`);
  });

  // --- Unit: title template ---

  it('unit_metadata_title_default', () => {
    const title = metadata.title as { default: string; template: string };
    expect(title.default).toBe('Travis Gautier');
  });

  it('unit_metadata_title_template', () => {
    const title = metadata.title as { default: string; template: string };
    expect(title.template).toBe(site.titleTemplate);
  });

  // --- Integration: description preserved ---

  it('i_metadata_description', () => {
    expect(metadata.description).toBe(
      'One person. An agent team. Full SaaS delivery.'
    );
  });

  // --- Unit: expanded SEO metadata (phase 4.1) ---

  it('unit_layout_metadata_opengraph', () => {
    expect(metadata.openGraph).toBeDefined();
    const og = metadata.openGraph as {
      type?: string;
      siteName?: string;
      images?: Array<string | { url: string }> | string | { url: string };
    };
    expect(og.type).toBe('website');
    expect(og.siteName).toBe(site.name);
    expect(og.images).toBeDefined();
  });

  it('unit_layout_metadata_twitter', () => {
    expect(metadata.twitter).toBeDefined();
    const twitter = metadata.twitter as { card?: string; creator?: string };
    expect(twitter.card).toBe('summary_large_image');
    expect(twitter.creator).toBe(site.twitterHandle);
  });

  it('unit_layout_metadata_robots', () => {
    expect(metadata.robots).toBeDefined();
    const robots = metadata.robots as { index?: boolean; follow?: boolean };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });
});

describe('layout shell', () => {
  // --- Integration: shell components ---

  it('i_layout_header_present', () => {
    render(
      <RootLayout>
        <div>page content</div>
      </RootLayout>
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('i_layout_footer_present', () => {
    render(
      <RootLayout>
        <div>page content</div>
      </RootLayout>
    );
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('i_layout_main_wrapper', () => {
    render(
      <RootLayout>
        <div data-testid="child">page content</div>
      </RootLayout>
    );
    const child = screen.getByTestId('child');
    expect(child.closest('main')).toBeInTheDocument();
  });
});

describe('layout font wiring (styling-overhaul-2.1)', () => {
  // --- Unit: <html> className composes three font.variable strings ---

  it('unit_layout_html_className_composes_three_font_variables', () => {
    const { container } = render(
      <RootLayout>
        <div>page content</div>
      </RootLayout>
    );
    const html = container.ownerDocument.documentElement;
    const cls = html.className;
    expect(cls).toContain('--font-display');
    expect(cls).toContain('--font-body');
    expect(cls).toContain('--font-mono');
    expect(cls).toContain('h-full');
    expect(cls).toContain('antialiased');
  });

  // --- Integration: shell renders under the three-font mock ---

  it('integration_layout_shell_renders_with_three_fonts', () => {
    render(
      <RootLayout>
        <div data-testid="child">page content</div>
      </RootLayout>
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByTestId('child').closest('main')).toBeInTheDocument();
  });

  // --- Error recovery: shell still mounts if NextFont returns empty variable ---

  it('err_layout_renders_when_font_mock_returns_empty_variable', async () => {
    vi.resetModules();
    vi.doMock('next/font/google', () => ({
      Cinzel: () => ({ variable: '', className: 'font-cinzel' }),
      Inter: () => ({ variable: '', className: 'font-inter' }),
      JetBrains_Mono: () => ({ variable: '', className: 'font-jetbrains-mono' }),
    }));
    const { default: ReloadedLayout } = await import('../layout');
    render(
      <ReloadedLayout>
        <div data-testid="child-empty">page content</div>
      </ReloadedLayout>
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByTestId('child-empty').closest('main')).toBeInTheDocument();
    vi.doUnmock('next/font/google');
    vi.resetModules();
  });

  // --- Data integrity: className well-formed ---

  it('data_html_class_string_well_formed', () => {
    const { container } = render(
      <RootLayout>
        <div>page content</div>
      </RootLayout>
    );
    const cls = container.ownerDocument.documentElement.className;
    expect(cls).not.toMatch(/\s{2,}/);
    expect(cls).toBe(cls.trim());
    const tokens = cls.split(/\s+/);
    expect(tokens).toContain('--font-display');
    expect(tokens).toContain('--font-body');
    expect(tokens).toContain('--font-mono');
    expect(tokens).toContain('h-full');
    expect(tokens).toContain('antialiased');
  });
});
