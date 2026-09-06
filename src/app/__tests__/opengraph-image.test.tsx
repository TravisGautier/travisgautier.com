import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidElement, type ReactNode } from 'react';

// Mock next/og so we capture ImageResponse construction without rendering Satori/WASM.
vi.mock('next/og', () => ({
  ImageResponse: vi
    .fn()
    .mockImplementation((element: ReactNode, options: Record<string, unknown>) => ({
      __element: element,
      __options: options,
    })),
}));

import { ImageResponse } from 'next/og';
import Image, { size, contentType, alt } from '../opengraph-image';
import EpisodeImage from '../episodes/[slug]/opengraph-image';
import CaseImage from '../cases/[slug]/opengraph-image';
import { site } from '@/lib/site';

const MockImageResponse = vi.mocked(ImageResponse);

const HERE = dirname(fileURLToPath(import.meta.url));
const ROUTE_SRCS = {
  root: readFileSync(join(HERE, '..', 'opengraph-image.tsx'), 'utf8'),
  episode: readFileSync(join(HERE, '..', 'episodes', '[slug]', 'opengraph-image.tsx'), 'utf8'),
  case: readFileSync(join(HERE, '..', 'cases', '[slug]', 'opengraph-image.tsx'), 'utf8'),
};

function collectText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return collectText(props.children);
  }
  return '';
}

interface Captured {
  __element: ReactNode;
  __options: { width?: number; height?: number; fonts?: unknown[] };
}

describe('root opengraph-image (styling-overhaul-8.2)', () => {
  // ---------- Unit: config exports ----------
  it('unit_root_config_exports', () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe('image/png');
    expect(typeof alt).toBe('string');
    expect((alt as string).length).toBeGreaterThan(0);
  });

  it('unit_default_exports_are_functions', () => {
    expect(typeof Image).toBe('function');
    expect(typeof EpisodeImage).toBe('function');
    expect(typeof CaseImage).toBe('function');
  });

  // ---------- Integration ----------
  it('int_root_constructs_imageresponse', async () => {
    MockImageResponse.mockClear();
    const res = (await Image()) as unknown as Captured;
    expect(MockImageResponse).toHaveBeenCalledTimes(1);
    expect(res.__options.width).toBe(1200);
    expect(res.__options.height).toBe(630);
    expect(res.__options.fonts).toHaveLength(3);
    const text = collectText(res.__element);
    expect(text).toContain('Build the whole');
    expect(text).toContain('thing alone');
    expect(text).toContain('?');
    expect(text).toContain(site.domain);
  });

  // ---------- Accessibility ----------
  it('a11y_robust_root_alt_text_present', () => {
    expect(typeof alt).toBe('string');
    expect((alt as string).trim().length).toBeGreaterThan(8);
    expect((alt as string).toLowerCase()).toContain('travis');
  });

  // ---------- Infrastructure (source sentinels across all 3 routes) ----------
  it('infra_routes_import_imageresponse_from_next_og', () => {
    Object.values(ROUTE_SRCS).forEach((src) => {
      expect(src).toMatch(/import\s*\{[^}]*ImageResponse[^}]*\}\s*from\s*['"]next\/og['"]/);
    });
  });

  // ---------- Permission ----------
  it('perm_anonymous_root_og_allow', async () => {
    // public route — anonymous invocation produces an ImageResponse, no auth gate
    const res = await Image();
    expect(res).toBeDefined();
  });
});
