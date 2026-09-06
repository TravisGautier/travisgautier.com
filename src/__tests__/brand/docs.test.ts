import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const brandIdentityPath = join(process.cwd(), 'docs/brand-identity.md');
const designSystemPath = join(process.cwd(), 'docs/design-system.md');
const globalsCssPath = join(process.cwd(), 'src/app/globals.css');

const safeRead = (p: string): string => (existsSync(p) ? readFileSync(p, 'utf8') : '');

const brandIdentity = safeRead(brandIdentityPath);
const designSystem = safeRead(designSystemPath);
const globalsCss = safeRead(globalsCssPath);

const visualIdentitySection = (() => {
  const match = brandIdentity.match(/##\s+Visual Identity Direction\s*\n([\s\S]*?)(?=\n##\s|$)/);
  return match ? match[1] : '';
})();

const designSystemSection = (heading: string): string => {
  const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`);
  const match = designSystem.match(re);
  return match ? match[1] : '';
};

describe('brand identity doc — Visual Identity Direction (so-1.3)', () => {
  it('unit_brand_identity_visual_section_exists: doc contains a "## Visual Identity Direction" heading', () => {
    expect(brandIdentity).toMatch(/##\s+Visual Identity Direction/);
  });

  it('unit_brand_identity_visual_mentions_editorial: section describes editorial direction', () => {
    expect(visualIdentitySection).toMatch(/editorial/i);
  });

  it('unit_brand_identity_visual_mentions_classical: section uses classical/restrained/material language', () => {
    expect(visualIdentitySection).toMatch(/classical|restrained|material/i);
  });

  it('unit_brand_identity_visual_anti_trend_language: section positions against neon/gamer/gradient/hype trends', () => {
    expect(visualIdentitySection).toMatch(/neon|gamer|gradient|hype/i);
  });

  it('unit_brand_identity_visual_references_design_system_doc: section points at docs/design-system.md', () => {
    expect(visualIdentitySection).toMatch(/docs\/design-system\.md/);
  });
});

describe('brand identity doc — preserved sections (regression guards)', () => {
  it('unit_brand_identity_preserves_channel_identity: Channel Identity section intact', () => {
    expect(brandIdentity).toMatch(/##\s+Channel Identity/);
    expect(brandIdentity).toMatch(/Travis Gautier/);
    expect(brandIdentity).toMatch(/travisgautier\.com/);
    expect(brandIdentity).toMatch(/formerly.*Fabled10X/i);
  });

  it('unit_brand_identity_preserves_mission: Mission Statement section intact', () => {
    expect(brandIdentity).toMatch(/##\s+Mission Statement/);
  });

  it('unit_brand_identity_preserves_voice: Brand Voice & Tone section intact', () => {
    expect(brandIdentity).toMatch(/##\s+Brand Voice (?:&|and) Tone/);
  });

  it('unit_brand_identity_preserves_tagline_options: Tagline Options section intact', () => {
    expect(brandIdentity).toMatch(/##\s+Tagline Options/);
  });

  it('unit_brand_identity_preserves_target_audience: Target Audience section intact', () => {
    expect(brandIdentity).toMatch(/##\s+Target Audience/);
  });
});

describe('design system doc — file + Palette section (so-1.3)', () => {
  it('unit_design_system_file_exists: docs/design-system.md exists and is non-empty', () => {
    expect(existsSync(designSystemPath)).toBe(true);
    expect(designSystem.length).toBeGreaterThan(0);
  });

  it('unit_design_system_palette_section_exists: doc contains a "## Palette" heading', () => {
    expect(designSystem).toMatch(/##\s+Palette/);
  });

  it('unit_design_system_palette_marble_hex: Palette documents Marble as #F7F4EC', () => {
    expect(designSystem).toMatch(/Marble[\s\S]{0,80}#F7F4EC/i);
  });

  it('unit_design_system_palette_parchment_hex: Palette documents Parchment as #F0E6D2', () => {
    expect(designSystem).toMatch(/Parchment[\s\S]{0,80}#F0E6D2/i);
  });

  it('unit_design_system_palette_ink_hex: Palette documents Ink as #1C1814', () => {
    expect(designSystem).toMatch(/Ink[\s\S]{0,80}#1C1814/i);
  });

  it('unit_design_system_palette_oxblood_hex: Palette documents Oxblood as #6B2020', () => {
    expect(designSystem).toMatch(/Oxblood[\s\S]{0,80}#6B2020/i);
  });

  it('unit_design_system_palette_verdigris_hex: Palette documents Verdigris as #2F5D50', () => {
    expect(designSystem).toMatch(/Verdigris[\s\S]{0,80}#2F5D50/i);
  });

  it('unit_design_system_palette_bone_hex: Palette documents Bone as #E8DCC4', () => {
    expect(designSystem).toMatch(/Bone[\s\S]{0,80}#E8DCC4/i);
  });

  it('unit_design_system_palette_shadow_hex: Palette documents Shadow as #2A2520', () => {
    expect(designSystem).toMatch(/Shadow[\s\S]{0,80}#2A2520/i);
  });
});

describe('design system doc — Contrast Pairs', () => {
  it('unit_design_system_contrast_pairs_section_exists: doc contains a "## Contrast Pairs" heading', () => {
    expect(designSystem).toMatch(/##\s+Contrast Pairs/);
  });

  it('unit_design_system_contrast_pairs_three_levels: section names all three pairs', () => {
    const section = designSystemSection('Contrast Pairs');
    expect(section).toMatch(/Marble\s*\+?\s*Ink|Marble and Ink/i);
    expect(section).toMatch(/Marble\s*\+?\s*Oxblood|Marble and Oxblood/i);
    expect(section).toMatch(/Ink\s*\+?\s*Oxblood|Ink and Oxblood/i);
  });
});

describe('design system doc — Typography', () => {
  it('unit_design_system_typography_section_exists: doc contains a "## Typography" heading', () => {
    expect(designSystem).toMatch(/##\s+Typography/);
  });

  it('unit_design_system_typography_lists_three_typefaces: Cinzel + Inter + JetBrains Mono named', () => {
    const section = designSystemSection('Typography');
    expect(section).toMatch(/Cinzel/);
    expect(section).toMatch(/Inter/);
    expect(section).toMatch(/JetBrains Mono/);
  });

  it('unit_design_system_typography_no_third_typeface_rule: section codifies "no third typeface" rule', () => {
    const section = designSystemSection('Typography');
    expect(section).toMatch(/no third typeface/i);
  });
});

describe('design system doc — Material Language', () => {
  it('unit_design_system_material_section_exists: doc contains a "## Material Language" heading', () => {
    expect(designSystem).toMatch(/##\s+Material Language/);
  });

  it('unit_design_system_material_allowed_list: Allowed list names marble/columns/arches/friezes/Roman or Greek', () => {
    const section = designSystemSection('Material Language');
    expect(section).toMatch(/Allowed/i);
    expect(section).toMatch(/marble|parchment|columns|arches|friezes|Roman|Greek/i);
  });

  it('unit_design_system_material_forbidden_list: Forbidden list names gradients/drop shadows/neural meshes/robot icons', () => {
    const section = designSystemSection('Material Language');
    expect(section).toMatch(/Forbidden/i);
    expect(section).toMatch(/gradient/i);
    expect(section).toMatch(/drop shadow/i);
  });
});

describe('design system doc — Composition', () => {
  it('unit_design_system_composition_section_exists: doc contains a "## Composition" heading', () => {
    expect(designSystem).toMatch(/##\s+Composition/);
  });

  it('unit_design_system_composition_brushstroke_seam: section describes brushstroke-seam composition', () => {
    const section = designSystemSection('Composition');
    expect(section).toMatch(/brushstroke[ -]seam/i);
  });
});

describe('design system doc — Mobile-first legibility', () => {
  it('unit_design_system_mobile_section_exists: doc contains a mobile-first legibility section', () => {
    expect(designSystem).toMatch(/##\s+Mobile-first legibility/i);
  });
});

describe('design system doc — Asset paths', () => {
  it('unit_design_system_asset_paths_section_exists: doc contains an "## Asset paths" heading', () => {
    expect(designSystem).toMatch(/##\s+Asset paths/);
  });

  it('unit_design_system_asset_paths_logo: Asset paths reference public/logo.svg', () => {
    const section = designSystemSection('Asset paths');
    expect(section).toMatch(/public\/logo\.svg/);
  });

  it('unit_design_system_asset_paths_fonts: Asset paths reference public/fonts/ for next/og', () => {
    const section = designSystemSection('Asset paths');
    expect(section).toMatch(/public\/fonts/);
  });
});

describe('design system doc — Implementation references', () => {
  it('unit_design_system_implementation_refs_section_exists: doc contains an "## Implementation references" heading', () => {
    expect(designSystem).toMatch(/##\s+Implementation references/);
  });

  it('unit_design_system_implementation_refs_globals_css: refs list points at src/app/globals.css token source', () => {
    const section = designSystemSection('Implementation references');
    expect(section).toMatch(/src\/app\/globals\.css/);
  });

  it('unit_design_system_implementation_refs_sentinels: refs list points at brand sentinels', () => {
    const section = designSystemSection('Implementation references');
    expect(section).toMatch(/forbidden-patterns|contrast|legibility/i);
  });
});

describe('brand docs — cross-doc + globals.css integrity (integration)', () => {
  it('integration_brand_docs_cross_reference: brand-identity points at design-system.md AND target file exists', () => {
    expect(visualIdentitySection).toMatch(/docs\/design-system\.md/);
    expect(existsSync(designSystemPath)).toBe(true);
  });

  it('integration_so_1_1_palette_preserved: so-1.1 palette hexes still in globals.css', () => {
    expect(globalsCss).toMatch(/--color-marble:\s*#F7F4EC/);
    expect(globalsCss).toMatch(/--color-parchment:\s*#F0E6D2/);
    expect(globalsCss).toMatch(/--color-ink:\s*#1C1814/);
    expect(globalsCss).toMatch(/--color-oxblood:\s*#6B2020/);
    expect(globalsCss).toMatch(/--color-verdigris:\s*#2F5D50/);
    expect(globalsCss).toMatch(/--color-bone:\s*#E8DCC4/);
    expect(globalsCss).toMatch(/--color-shadow:\s*#2A2520/);
  });

  it('integration_so_1_2_spacing_preserved: so-1.2 spacing + radius + edge tokens still in globals.css', () => {
    expect(globalsCss).toMatch(/--space-2:\s*0\.5rem/);
    expect(globalsCss).toMatch(/--space-8:\s*4rem/);
    expect(globalsCss).toMatch(/--radius-card:\s*4px/);
    expect(globalsCss).toMatch(/--radius-sharp:\s*0/);
    expect(globalsCss).toMatch(/--edge-color:/);
    expect(globalsCss).toMatch(/--section-y-md:\s*var\(--space-8\)/);
  });
});

describe('brand docs — infrastructure', () => {
  it('infra_brand_identity_file_exists: docs/brand-identity.md exists on disk', () => {
    expect(existsSync(brandIdentityPath)).toBe(true);
    expect(brandIdentity.length).toBeGreaterThan(0);
  });

  it('infra_design_system_file_exists: docs/design-system.md exists on disk', () => {
    expect(existsSync(designSystemPath)).toBe(true);
    expect(designSystem.length).toBeGreaterThan(0);
  });
});

describe('brand docs — edge cases (forbidden prose / forbidden palette)', () => {
  it('edge_no_old_visual_direction_prose: old "boutique consultancy" prose is scrubbed', () => {
    expect(visualIdentitySection).not.toMatch(/boutique consultancy/i);
    expect(visualIdentitySection).not.toMatch(/muted,?\s*confident colors/i);
  });

  it('edge_no_blue_in_design_system: design-system does NOT name blue as an allowed palette element', () => {
    const palette = designSystemSection('Palette');
    const material = designSystemSection('Material Language');
    expect(palette).not.toMatch(/\bblue\b/i);
    const materialAllowed = (() => {
      const m = material.match(/Allowed[\s\S]*?(?=Forbidden|$)/i);
      return m ? m[0] : '';
    })();
    expect(materialAllowed).not.toMatch(/\bblue\b/i);
  });

  it('edge_forbidden_list_explicitly_names_gradients: Forbidden list names gradient', () => {
    const section = designSystemSection('Material Language');
    const forbidden = section.match(/Forbidden[\s\S]*$/i)?.[0] ?? '';
    expect(forbidden).toMatch(/gradient/i);
  });

  it('edge_forbidden_list_explicitly_names_drop_shadow: Forbidden list names drop shadow', () => {
    const section = designSystemSection('Material Language');
    const forbidden = section.match(/Forbidden[\s\S]*$/i)?.[0] ?? '';
    expect(forbidden).toMatch(/drop shadow/i);
  });
});

describe('brand docs — data integrity (palette hex ↔ globals.css)', () => {
  it('data_palette_hex_matches_globals_css: every hex documented in design-system.md matches globals.css declarations', () => {
    const expected: Array<[string, string]> = [
      ['marble', '#F7F4EC'],
      ['parchment', '#F0E6D2'],
      ['ink', '#1C1814'],
      ['oxblood', '#6B2020'],
      ['verdigris', '#2F5D50'],
      ['bone', '#E8DCC4'],
      ['shadow', '#2A2520'],
    ];
    for (const [token, hex] of expected) {
      const tokenRe = new RegExp(`--color-${token}:\\s*${hex}`, 'i');
      expect(globalsCss).toMatch(tokenRe);
      const docRe = new RegExp(`${token}[\\s\\S]{0,80}${hex}`, 'i');
      expect(designSystem).toMatch(docRe);
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// styling-overhaul-8.4 — Design-system doc finalize
// Asset paths (final), Off-site brand surfaces, Regeneration notes,
// Implementation references. Doc must reflect what 8.1-8.3 actually shipped.
// ───────────────────────────────────────────────────────────────────────────

const allowedGlyphsSource = safeRead(
  join(process.cwd(), 'src/app/(internal)/thumb-preview/glyphs.ts'),
);
const thumbPreviewSource = safeRead(
  join(process.cwd(), 'src/app/(internal)/thumb-preview/page.tsx'),
);
// Mirrors ALLOWED_GLYPHS in src/app/(internal)/thumb-preview/glyphs.ts —
// the data_ test below asserts this set stays a subset of that source.
const ACCENT_GLYPHS = ['?', '.', '!', '→', '✕', '✓', '—'];

describe('design system doc — Asset paths finalize (styling-overhaul-8.4)', () => {
  const section = (): string => designSystemSection('Asset paths');

  it('unit_design_system_asset_paths_favicon: Asset paths reference public/favicon.svg', () => {
    expect(section()).toMatch(/public\/favicon\.svg/);
  });

  it('unit_design_system_asset_paths_apple_touch: references public/apple-touch-icon.png at 180×180', () => {
    const s = section();
    expect(s).toMatch(/public\/apple-touch-icon\.png/);
    expect(s).toMatch(/180\s*[×x]\s*180/);
  });

  it('unit_design_system_asset_paths_android_chrome: references android-chrome-192.png and android-chrome-512.png', () => {
    const s = section();
    expect(s).toMatch(/public\/android-chrome-192\.png/);
    expect(s).toMatch(/public\/android-chrome-512\.png/);
  });

  it('unit_design_system_asset_paths_fonts_individual: names each TTF on its own full path', () => {
    const s = section();
    expect(s).toMatch(/public\/fonts\/Cinzel-Black\.ttf/);
    expect(s).toMatch(/public\/fonts\/Inter-Regular\.ttf/);
    expect(s).toMatch(/public\/fonts\/Inter-SemiBold\.ttf/);
    expect(s).toMatch(/public\/fonts\/Inter-Bold\.ttf/);
  });

  it('unit_design_system_asset_paths_hero_texture: references the hero texture public/hero/floatbg.png', () => {
    expect(section()).toMatch(/public\/hero\/floatbg\.png/);
  });

  it('integration_design_system_asset_paths_exist_on_disk: every public/ asset named in Asset paths exists on disk', () => {
    const s = section();
    const paths = [...s.matchAll(/public\/[A-Za-z0-9._/-]+/g)].map((m) => m[0]);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of new Set(paths)) {
      expect(existsSync(join(process.cwd(), p))).toBe(true);
    }
  });
});

describe('design system doc — Off-site brand surfaces (styling-overhaul-8.4)', () => {
  const section = (): string => designSystemSection('Off-site brand surfaces');

  it('unit_design_system_offsite_section_exists: doc contains an "## Off-site brand surfaces" heading', () => {
    expect(designSystem).toMatch(/##\s+Off-site brand surfaces/);
  });

  it('unit_design_system_offsite_og_routes_named: names all three opengraph-image routes', () => {
    const s = section();
    expect(s).toMatch(/src\/app\/opengraph-image\.tsx/);
    expect(s).toMatch(/src\/app\/episodes\/\[slug\]\/opengraph-image\.tsx/);
    expect(s).toMatch(/src\/app\/cases\/\[slug\]\/opengraph-image\.tsx/);
  });

  it('unit_design_system_offsite_og_dimensions: documents 1200×630 OG dimensions', () => {
    expect(section()).toMatch(/1200\s*[×x]\s*630/);
  });

  it('unit_design_system_offsite_satori_clip_path: documents the Satori clip-path brushstroke workaround', () => {
    const s = section();
    expect(s).toMatch(/Satori/i);
    expect(s).toMatch(/clip-path|clip path/i);
  });

  it('unit_design_system_offsite_thumb_preview: documents /thumb-preview at 1280×720 that 404s in production', () => {
    const s = section();
    expect(s).toMatch(/thumb-preview/);
    expect(s).toMatch(/1280\s*[×x]\s*720/);
    expect(s).toMatch(/404|production/i);
  });

  it('unit_design_system_offsite_accent_glyphs: lists the allowed accent glyphs', () => {
    const s = section();
    for (const glyph of ACCENT_GLYPHS) {
      expect(s).toContain(glyph);
    }
  });

  it('integration_design_system_og_routes_exist_on_disk: every opengraph-image route named exists on disk', () => {
    const s = section();
    const routes = [...s.matchAll(/src\/app\/[A-Za-z0-9.\[\]/_-]+\.tsx/g)].map((m) => m[0]);
    expect(routes.length).toBeGreaterThanOrEqual(3);
    for (const r of new Set(routes)) {
      expect(existsSync(join(process.cwd(), r))).toBe(true);
    }
  });

  it('data_design_system_accent_glyphs_match_source: documented glyphs are a subset of ALLOWED_GLYPHS in glyphs.ts', () => {
    const s = section();
    const documented = ACCENT_GLYPHS.filter((g) => s.includes(g));
    expect(documented.length).toBeGreaterThan(0);
    for (const g of documented) {
      expect(allowedGlyphsSource).toContain(`'${g}'`);
    }
  });

  it('data_design_system_hero_default_matches_thumb_preview: documented hero path matches thumb-preview DEFAULTS.photo', () => {
    expect(designSystem).toMatch(/\/hero\/floatbg\.png/);
    expect(thumbPreviewSource).toContain('/hero/floatbg.png');
  });
});

describe('design system doc — Regeneration notes (styling-overhaul-8.4)', () => {
  const section = (): string => designSystemSection('Regeneration notes');

  it('unit_design_system_regeneration_section_exists: doc contains a "## Regeneration notes" heading', () => {
    expect(designSystem).toMatch(/##\s+Regeneration notes/);
  });

  it('unit_design_system_regeneration_icons_from_svg: explains regenerating raster icons from favicon.svg', () => {
    const s = section();
    expect(s).toMatch(/favicon\.svg/);
    expect(s).toMatch(/apple-touch-icon|android-chrome|icon/i);
  });

  it('unit_design_system_regeneration_fonts_google: explains updating TTFs from Google Fonts', () => {
    const s = section();
    expect(s).toMatch(/Google Fonts/i);
    expect(s).toMatch(/public\/fonts|\.ttf/i);
  });
});

describe('design system doc — Implementation references finalize (styling-overhaul-8.4)', () => {
  const section = (): string => designSystemSection('Implementation references');

  it('unit_design_system_impl_refs_new_components: refs include Button, Section/SectionDivider, DropAccent', () => {
    const s = section();
    expect(s).toMatch(/Button\.tsx/);
    expect(s).toMatch(/Section\.tsx|SectionDivider\.tsx/);
    expect(s).toMatch(/DropAccent\.tsx/);
  });

  it('integration_design_system_impl_ref_files_exist: every literal src/ path in Implementation references exists on disk', () => {
    const s = section();
    const paths = [...s.matchAll(/src\/[A-Za-z0-9.\[\]/_{}-]+\.(?:tsx?|css)/g)].map((m) => m[0]);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of new Set(paths)) {
      if (p.includes('{')) continue; // skip brace-expansion globs like {Marble,Parchment}.tsx
      expect(existsSync(join(process.cwd(), p))).toBe(true);
    }
  });
});

describe('design system doc — finalize edge + infra (styling-overhaul-8.4)', () => {
  it('edge_design_system_no_nonexistent_marble_column: doc never references the nonexistent marble-column asset', () => {
    expect(designSystem).not.toMatch(/marble-column/i);
  });

  it('edge_design_system_no_dangling_asset_paths: every public/ path anywhere in the doc resolves to a real file', () => {
    const paths = [...designSystem.matchAll(/public\/[A-Za-z0-9._/-]+\.[A-Za-z0-9]+/g)].map((m) => m[0]);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of new Set(paths)) {
      expect(existsSync(join(process.cwd(), p))).toBe(true);
    }
  });

  it('infra_design_system_doc_nonempty_after_finalize: doc is substantially larger than the 1.3 skeleton', () => {
    // 1.3 skeleton was ~3958 bytes / 96 lines; finalize adds 3 sections.
    expect(designSystem.length).toBeGreaterThan(4500);
  });
});
