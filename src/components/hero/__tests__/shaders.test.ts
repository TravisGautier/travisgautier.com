import { describe, it, expect } from 'vitest';
import { noise } from '../shaders/noise';
import { skyFrag, skyVert } from '../shaders/sky';
import { portalGoldFrag, portalPurpleFrag, portalVert } from '../shaders/portal';
import { clouds1Frag, clouds2Frag } from '../shaders/clouds';

const frags = { skyFrag, portalGoldFrag, portalPurpleFrag, clouds1Frag, clouds2Frag };

describe('hero shaders', () => {
  it('unit_noise_defines_snoise', () => {
    expect(noise).toMatch(/float snoise\(vec2 v\)/);
  });

  for (const [name, src] of Object.entries(frags)) {
    it(`unit_${name}_inlines_noise_without_include_directive`, () => {
      expect(src).toContain('float snoise(vec2 v)');
      expect(src).not.toMatch(/#include/);
      expect((src.match(/precision highp float;/g) ?? []).length).toBe(1);
      expect(src).toMatch(/void main\(\)/);
      expect(src).toMatch(/gl_FragColor/);
    });
  }

  it('unit_vertex_shaders_emit_gl_Position', () => {
    expect(skyVert).toMatch(/gl_Position/);
    expect(portalVert).toMatch(/gl_Position/);
    expect(skyVert).toMatch(/varying vec3 vPos/);
  });

  it('unit_sky_uses_hold_time_and_cloud_noise_uniforms', () => {
    for (const u of ['uHold', 'uTime', 'uSkyCloudNoise']) expect(skyFrag).toContain(`uniform float ${u}`);
  });

  it('unit_portal_frags_take_mouse_and_hover', () => {
    for (const f of [portalGoldFrag, portalPurpleFrag]) {
      expect(f).toContain('uniform vec2 uMouse');
      expect(f).toContain('uniform float uHover');
    }
  });

  it('brand_sky_has_no_cool_blue_zenith', () => {
    // The old r128 sky was vec3(0.30, 0.52, 0.85); the warm rewrite must not carry it.
    expect(skyFrag).not.toContain('0.30, 0.52, 0.85');
    expect(skyFrag).toContain('0.86, 0.80, 0.68');
  });
});
