import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Logo } from '../Logo';
import * as brandBarrel from '..';

const SIZES = ['sm', 'md', 'lg'] as const;
type Size = (typeof SIZES)[number];

const sizeExpectations: Record<Size, { wordmark: string; mark: string; gap: string }> = {
  sm: { wordmark: '1rem', mark: '0.875rem', gap: '0.25rem' },
  md: { wordmark: '1.5rem', mark: '1.25rem', gap: '0.375rem' },
  lg: { wordmark: '2.5rem', mark: '2rem', gap: '0.5rem' },
};

function getWrapperSpan(container: HTMLElement): HTMLSpanElement | null {
  return container.querySelector('span[aria-label="Travis Gautier"]');
}

function getInnerSpans(container: HTMLElement): HTMLSpanElement[] {
  const wrapper = getWrapperSpan(container);
  if (!wrapper) return [];
  return Array.from(wrapper.querySelectorAll('span[aria-hidden="true"]'));
}

function getWordmarkSpan(container: HTMLElement): HTMLSpanElement | null {
  return getInnerSpans(container)[0] ?? null;
}

function getMarkSpan(container: HTMLElement): HTMLSpanElement | null {
  return getInnerSpans(container)[1] ?? null;
}

describe('Logo', () => {
  // --- Unit ---

  it('unit_logo_renders_TRAVIS_GAUTIER_wordmark', () => {
    const { container } = render(<Logo />);
    const wordmark = getWordmarkSpan(container);
    expect(wordmark).not.toBeNull();
    expect(wordmark?.textContent).toBe('TRAVIS GAUTIER');
  });

  it('unit_logo_renders_curly_brace_mark', () => {
    const { container } = render(<Logo />);
    const mark = getMarkSpan(container);
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe('{tg}');
  });

  it('unit_logo_sm_size_dimensions', () => {
    const { container } = render(<Logo size="sm" />);
    const wrapper = getWrapperSpan(container);
    const wordmark = getWordmarkSpan(container);
    const mark = getMarkSpan(container);
    expect(wordmark?.style.fontSize).toBe(sizeExpectations.sm.wordmark);
    expect(mark?.style.fontSize).toBe(sizeExpectations.sm.mark);
    expect(wrapper?.style.gap).toBe(sizeExpectations.sm.gap);
  });

  it('unit_logo_md_size_dimensions', () => {
    const { container } = render(<Logo size="md" />);
    const wrapper = getWrapperSpan(container);
    const wordmark = getWordmarkSpan(container);
    const mark = getMarkSpan(container);
    expect(wordmark?.style.fontSize).toBe(sizeExpectations.md.wordmark);
    expect(mark?.style.fontSize).toBe(sizeExpectations.md.mark);
    expect(wrapper?.style.gap).toBe(sizeExpectations.md.gap);
  });

  it('unit_logo_lg_size_dimensions', () => {
    const { container } = render(<Logo size="lg" />);
    const wrapper = getWrapperSpan(container);
    const wordmark = getWordmarkSpan(container);
    const mark = getMarkSpan(container);
    expect(wordmark?.style.fontSize).toBe(sizeExpectations.lg.wordmark);
    expect(mark?.style.fontSize).toBe(sizeExpectations.lg.mark);
    expect(wrapper?.style.gap).toBe(sizeExpectations.lg.gap);
  });

  it('unit_logo_default_size_is_md', () => {
    const { container: defaulted } = render(<Logo />);
    const { container: explicit } = render(<Logo size="md" />);
    expect(getWordmarkSpan(defaulted)?.style.fontSize).toBe(
      getWordmarkSpan(explicit)?.style.fontSize
    );
    expect(getMarkSpan(defaulted)?.style.fontSize).toBe(getMarkSpan(explicit)?.style.fontSize);
    expect(getWrapperSpan(defaulted)?.style.gap).toBe(getWrapperSpan(explicit)?.style.gap);
  });

  it('unit_logo_mono_uses_currentColor_for_both_parts', () => {
    const { container } = render(<Logo mono />);
    const wordmark = getWordmarkSpan(container);
    const mark = getMarkSpan(container);
    // jsdom lowercases CSS color keywords; assert case-insensitively.
    expect(wordmark?.style.color?.toLowerCase()).toBe('currentcolor');
    expect(mark?.style.color?.toLowerCase()).toBe('currentcolor');
  });

  it('unit_logo_default_mono_uses_brand_tokens', () => {
    const { container } = render(<Logo />);
    const wordmark = getWordmarkSpan(container);
    const mark = getMarkSpan(container);
    expect(wordmark?.style.color).toBe('var(--color-ink)');
    expect(mark?.style.color).toBe('var(--color-oxblood)');
  });

  it('unit_logo_wordmark_font_family_display', () => {
    const { container } = render(<Logo />);
    const wordmark = getWordmarkSpan(container);
    expect(wordmark?.style.fontFamily).toBe('var(--font-display), serif');
  });

  it('unit_logo_wordmark_font_weight_900', () => {
    const { container } = render(<Logo />);
    const wordmark = getWordmarkSpan(container);
    expect(wordmark?.style.fontWeight).toBe('900');
  });

  it('unit_logo_wordmark_uppercase_textTransform', () => {
    const { container } = render(<Logo />);
    const wordmark = getWordmarkSpan(container);
    expect(wordmark?.style.textTransform).toBe('uppercase');
  });

  it('unit_logo_wordmark_letter_spacing_06em', () => {
    const { container } = render(<Logo />);
    const wordmark = getWordmarkSpan(container);
    expect(wordmark?.style.letterSpacing).toBe('0.06em');
  });

  it('unit_logo_wordmark_line_height_1', () => {
    const { container } = render(<Logo />);
    const wordmark = getWordmarkSpan(container);
    expect(wordmark?.style.lineHeight).toBe('1');
  });

  it('unit_logo_mark_font_family_mono', () => {
    const { container } = render(<Logo />);
    const mark = getMarkSpan(container);
    expect(mark?.style.fontFamily).toBe('var(--font-mono), ui-monospace, monospace');
  });

  it('unit_logo_mark_font_weight_500', () => {
    const { container } = render(<Logo />);
    const mark = getMarkSpan(container);
    expect(mark?.style.fontWeight).toBe('500');
  });

  it('unit_logo_mark_line_height_1', () => {
    const { container } = render(<Logo />);
    const mark = getMarkSpan(container);
    expect(mark?.style.lineHeight).toBe('1');
  });

  it('unit_logo_wrapper_inline_flex_items_baseline', () => {
    const { container } = render(<Logo />);
    const wrapper = getWrapperSpan(container);
    expect(wrapper?.className).toMatch(/\binline-flex\b/);
    expect(wrapper?.className).toMatch(/\bitems-baseline\b/);
  });

  it('unit_logo_wrapper_gap_from_size_scale', () => {
    for (const size of SIZES) {
      const { container, unmount } = render(<Logo size={size} />);
      const wrapper = getWrapperSpan(container);
      expect(wrapper?.style.gap).toBe(sizeExpectations[size].gap);
      unmount();
    }
  });

  it('unit_logo_inner_spans_aria_hidden_true', () => {
    const { container } = render(<Logo />);
    const spans = getInnerSpans(container);
    expect(spans).toHaveLength(2);
    for (const span of spans) {
      expect(span.getAttribute('aria-hidden')).toBe('true');
    }
  });

  // --- Integration ---

  it('integration_logo_inside_header_link_context', () => {
    const { container } = render(
      <a href="#logo" className="inline-flex">
        <Logo size="md" className="custom-wrap" />
      </a>
    );
    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    const wrapper = getWrapperSpan(container);
    expect(wrapper).not.toBeNull();
    expect(anchor?.contains(wrapper)).toBe(true);
    expect(wrapper?.className).toMatch(/\bcustom-wrap\b/);
    expect(wrapper?.textContent).toBe('TRAVIS GAUTIER{tg}');
  });

  it('integration_logo_barrel_export', () => {
    expect(brandBarrel).toHaveProperty('Logo');
    expect((brandBarrel as Record<string, unknown>).Logo).toBe(Logo);
  });

  it('integration_logo_svg_file_reachable_via_public', () => {
    const svgPath = join(process.cwd(), 'public/logo.svg');
    expect(existsSync(svgPath)).toBe(true);
    const stat = readFileSync(svgPath, 'utf8');
    expect(stat.length).toBeGreaterThan(0);
  });

  // --- Accessibility ---

  it('a11y_logo_wrapper_announces_brand_label', () => {
    const { container } = render(<Logo />);
    const wrapper = getWrapperSpan(container);
    expect(wrapper?.getAttribute('aria-label')).toBe('Travis Gautier');
    expect(wrapper?.getAttribute('role')).toBeNull();
    expect(wrapper?.getAttribute('aria-labelledby')).toBeNull();
  });

  it('a11y_logo_inner_parts_hidden_from_screen_readers', () => {
    const { container } = render(<Logo />);
    const spans = getInnerSpans(container);
    expect(spans).toHaveLength(2);
    for (const span of spans) {
      expect(span.getAttribute('aria-hidden')).toBe('true');
      expect(span.getAttribute('aria-label')).toBeNull();
      expect(span.getAttribute('role')).toBeNull();
    }
  });

  it('a11y_logo_text_content_matches_visual', () => {
    const { container } = render(<Logo />);
    const wrapper = getWrapperSpan(container);
    expect(wrapper?.textContent).toBe('TRAVIS GAUTIER{tg}');
  });

  it('a11y_logo_mono_preserves_aria', () => {
    const { container } = render(<Logo mono />);
    const wrapper = getWrapperSpan(container);
    expect(wrapper?.getAttribute('aria-label')).toBe('Travis Gautier');
    const spans = getInnerSpans(container);
    expect(spans).toHaveLength(2);
    for (const span of spans) {
      expect(span.getAttribute('aria-hidden')).toBe('true');
    }
  });

  // --- Infrastructure ---

  it('infra_brand_barrel_re_exports_logo', () => {
    expect(brandBarrel).toHaveProperty('Logo');
  });

  it('infra_logo_no_use_client_directive', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/brand/Logo.tsx'),
      'utf8'
    );
    expect(source).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_logo_svg_file_exists', () => {
    expect(existsSync(join(process.cwd(), 'public/logo.svg'))).toBe(true);
  });

  it('infra_logo_svg_has_valid_root_element', () => {
    const svg = readFileSync(join(process.cwd(), 'public/logo.svg'), 'utf8');
    expect(svg).toMatch(/<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toMatch(/viewBox="0 0 960 80"/);
  });

  it('infra_surface_barrel_export_count_includes_logo', () => {
    // Cross-section sentinel sync (precedent: so-3.2 BrushstrokeSeam added itself).
    // The canonical assertion lives in Surfaces.test.tsx; mirror the check here so
    // Logo's red phase exercises the same closed-set invariant.
    const expected = new Set([
      'DropAccent',
      'Marble',
      'Parchment',
      'Bone',
      'Shadow',
      'BrushstrokeSeam',
      'HeroBackdrop',
      'Logo',
      'Section',
      'SectionDivider',
      'Button',
      'EditorialCard',
    ]);
    const actual = new Set(
      Object.keys(brandBarrel).filter((key) => /^[A-Z]/.test(key))
    );
    expect(actual).toEqual(expected);
  });

  // --- Edge cases ---

  it('edge_logo_empty_className_no_double_space', () => {
    const { container } = render(<Logo />);
    const wrapper = getWrapperSpan(container);
    expect(wrapper?.className).not.toMatch(/ {2,}/);
  });

  it('edge_logo_className_passthrough', () => {
    const { container } = render(<Logo className="custom-x" />);
    const wrapper = getWrapperSpan(container);
    expect(wrapper?.className).toMatch(/\binline-flex\b/);
    expect(wrapper?.className).toMatch(/\bitems-baseline\b/);
    expect(wrapper?.className).toMatch(/\bcustom-x\b/);
  });

  it('edge_logo_mono_combined_with_each_size', () => {
    for (const size of SIZES) {
      const { container, unmount } = render(<Logo mono size={size} />);
      const wordmark = getWordmarkSpan(container);
      const mark = getMarkSpan(container);
      expect(wordmark?.style.color?.toLowerCase()).toBe('currentcolor');
      expect(mark?.style.color?.toLowerCase()).toBe('currentcolor');
      expect(wordmark?.style.fontSize).toBe(sizeExpectations[size].wordmark);
      expect(mark?.style.fontSize).toBe(sizeExpectations[size].mark);
      unmount();
    }
  });

  it('edge_logo_mono_false_explicit', () => {
    const { container: defaulted } = render(<Logo />);
    const { container: explicit } = render(<Logo mono={false} />);
    expect(getWordmarkSpan(defaulted)?.style.color).toBe(
      getWordmarkSpan(explicit)?.style.color
    );
    expect(getMarkSpan(defaulted)?.style.color).toBe(getMarkSpan(explicit)?.style.color);
  });

  it('edge_logo_renders_in_currentColor_context', () => {
    const { container } = render(
      <div style={{ color: 'red' }}>
        <Logo mono />
      </div>
    );
    const wordmark = getWordmarkSpan(container);
    const mark = getMarkSpan(container);
    expect(wordmark?.style.color?.toLowerCase()).toBe('currentcolor');
    expect(mark?.style.color?.toLowerCase()).toBe('currentcolor');
  });

  // --- Data integrity (SVG file) ---

  it('data_logo_svg_contains_TRAVIS_GAUTIER_word', () => {
    const svg = readFileSync(join(process.cwd(), 'public/logo.svg'), 'utf8');
    expect(svg).toMatch(/TRAVIS GAUTIER/);
  });

  it('data_logo_svg_contains_curly_mark', () => {
    const svg = readFileSync(join(process.cwd(), 'public/logo.svg'), 'utf8');
    expect(svg).toMatch(/\{tg\}/);
  });

  it('data_logo_svg_uses_brand_colors_ink_and_oxblood', () => {
    const svg = readFileSync(join(process.cwd(), 'public/logo.svg'), 'utf8');
    expect(svg).toMatch(/fill="#1C1814"/);
    expect(svg).toMatch(/fill="#6B2020"/);
  });

  it('data_logo_svg_uses_brand_fonts_in_text_attrs', () => {
    const svg = readFileSync(join(process.cwd(), 'public/logo.svg'), 'utf8');
    expect(svg).toMatch(/Cinzel/);
    expect(svg).toMatch(/JetBrains Mono/);
  });
});
