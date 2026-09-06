import { describe, it, expect, vi } from 'vitest';

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

// metadata.icons shapes for assertion (Next.js IconDescriptor).
interface IconEntry {
  url: string;
  type?: string;
  sizes?: string;
}
function getIcons() {
  return metadata.icons as { icon: IconEntry[]; apple: IconEntry[] };
}

describe('layout metadata.icons (styling-overhaul-8.1)', () => {
  /// Tests checklist item: 9
  it('unit_metadata_icons_defined: metadata.icons has icon[] and apple[] arrays', () => {
    const icons = getIcons();
    expect(icons).toBeDefined();
    expect(Array.isArray(icons.icon)).toBe(true);
    expect(Array.isArray(icons.apple)).toBe(true);
  });

  /// Tests checklist items: 9,1
  it('unit_metadata_icons_svg_entry: icon[] includes /favicon.svg with type image/svg+xml', () => {
    const { icon } = getIcons();
    const svg = icon.find((e) => e.url === '/favicon.svg');
    expect(svg).toBeDefined();
    expect(svg?.type).toBe('image/svg+xml');
  });

  /// Tests checklist items: 9,3
  it('unit_metadata_icons_android_192: icon[] includes /android-chrome-192.png 192x192 image/png', () => {
    const { icon } = getIcons();
    const png = icon.find((e) => e.url === '/android-chrome-192.png');
    expect(png).toBeDefined();
    expect(png?.sizes).toBe('192x192');
    expect(png?.type).toBe('image/png');
  });

  /// Tests checklist items: 9,4
  it('unit_metadata_icons_android_512: icon[] includes /android-chrome-512.png 512x512 image/png', () => {
    const { icon } = getIcons();
    const png = icon.find((e) => e.url === '/android-chrome-512.png');
    expect(png).toBeDefined();
    expect(png?.sizes).toBe('512x512');
    expect(png?.type).toBe('image/png');
  });

  /// Tests checklist items: 9,2
  it('unit_metadata_icons_apple_180: apple[] includes /apple-touch-icon.png 180x180', () => {
    const { apple } = getIcons();
    const touch = apple.find((e) => e.url === '/apple-touch-icon.png');
    expect(touch).toBeDefined();
    expect(touch?.sizes).toBe('180x180');
  });

  /// Tests checklist item: 9 — edge: SVG-first ordering so SVG-capable browsers prefer it
  it('edge_icon_array_svg_first_ordering: icon[0] is the /favicon.svg svg+xml entry', () => {
    const { icon } = getIcons();
    expect(icon[0]?.url).toBe('/favicon.svg');
    expect(icon[0]?.type).toBe('image/svg+xml');
  });

  /// Tests checklist item: 9 — integration: existing metadata preserved alongside icons
  it('i_metadata_preserves_existing_fields_alongside_icons: metadataBase/openGraph/twitter/robots/title/description intact', () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect((metadata.title as { default: string }).default).toBe(site.name);
    expect(metadata.description).toBe('One person. An agent team. Full SaaS delivery.');
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.twitter).toBeDefined();
    expect(metadata.robots).toBeDefined();
  });

  /// Tests checklist item: 9 — integration: shell still renders with icons present
  it('i_layout_shell_renders_with_icons_metadata: header/main/footer mount with icons metadata', () => {
    render(
      <RootLayout>
        <div data-testid="child">page content</div>
      </RootLayout>
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByTestId('child').closest('main')).toBeInTheDocument();
  });

  /// Tests checklist item: 9 — error recovery: module imports + metadata constructable
  it('err_layout_module_imports_without_throwing_with_icons: metadata accessible, shell mounts', () => {
    expect(() => getIcons()).not.toThrow();
    const { container } = render(
      <RootLayout>
        <div>page content</div>
      </RootLayout>
    );
    expect(container.ownerDocument.documentElement.className).toContain('--font-display');
  });
});
