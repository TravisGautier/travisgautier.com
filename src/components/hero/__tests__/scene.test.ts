import { describe, it, expect } from 'vitest';
import { Mesh, PointLight, ShaderMaterial, type Object3D } from 'three';
import { createScene } from '../engine/scene/setup';
import { createEnvironment } from '../engine/scene/environment';
import { createTemple, PILLAR_RADIUS } from '../engine/scene/temple';
import { createPortal } from '../engine/scene/portal';
import { createLighting } from '../engine/scene/lighting';
import { disposeScene } from '../engine/dispose';
import { TIER_CONFIGS } from '../quality';
import { PALETTE } from '../engine/palette';
import { CAM_HEIGHT, CAM_ORBIT_RADIUS } from '../constants';

function countPointLights(root: Object3D): PointLight[] {
  const out: PointLight[] = [];
  root.traverse((o) => { if ((o as PointLight).isPointLight) out.push(o as PointLight); });
  return out;
}

describe('scene — setup', () => {
  it('unit_camera_starts_on_the_gold_orbit', () => {
    const { camera, lookTarget } = createScene(2);
    expect(camera.aspect).toBe(2);
    expect(Math.hypot(camera.position.x, camera.position.z)).toBeCloseTo(CAM_ORBIT_RADIUS);
    expect(camera.position.y).toBe(CAM_HEIGHT);
    expect(lookTarget.y).toBe(1.2);
  });

  it('brand_fog_is_warm_marble_not_sky_blue', () => {
    const { scene } = createScene();
    const fog = scene.fog as import('three').FogExp2;
    expect(fog.color.b).toBeLessThan(fog.color.r);
    expect(fog.density).toBe(PALETTE.fogDensity.base);
  });
});

describe('scene — environment respects tier config', () => {
  it('unit_tier1_one_cloud_layer_50_particles_no_sky_noise', () => {
    const { scene } = createScene();
    const env = createEnvironment(scene, TIER_CONFIGS[1]);
    expect(env.cloudSeaMat).toBeInstanceOf(ShaderMaterial);
    expect(env.cloudSea2Mat).toBeNull();
    expect(env.particleSpeeds.length).toBe(50);
    expect(env.skyMat.uniforms.uSkyCloudNoise.value).toBe(0);
  });

  it('unit_tier3_two_cloud_layers_200_particles', () => {
    const { scene } = createScene();
    const env = createEnvironment(scene, TIER_CONFIGS[3]);
    expect(env.cloudSea2Mat).toBeInstanceOf(ShaderMaterial);
    expect(env.particleSpeeds.length).toBe(200);
    expect(env.skyMat.uniforms.uSkyCloudNoise.value).toBe(1);
  });

  it('edge_zero_particles_hides_points_and_never_calls_random', () => {
    const { scene } = createScene();
    let calls = 0;
    const env = createEnvironment(scene, TIER_CONFIGS[0], () => { calls++; return 0.5; });
    expect(env.particles.visible).toBe(false);
    expect(calls).toBe(0);
    expect(env.cloudSeaMat).toBeNull();
  });
});

describe('scene — temple', () => {
  it('unit_pillar_count_and_ring_radius_follow_config', () => {
    const { scene } = createScene();
    const t = createTemple(scene, { pillarCount: 8, pillarFluting: false });
    expect(t.pillars).toHaveLength(8);
    for (const p of t.pillars) expect(Math.hypot(p.position.x, p.position.z)).toBeCloseTo(PILLAR_RADIUS);
    // no fluting → base, shaft, echinus, abacus only
    expect(t.pillars[0].children).toHaveLength(4);
  });

  it('unit_fluting_adds_eight_flutes_per_pillar', () => {
    const { scene } = createScene();
    const t = createTemple(scene, { pillarCount: 12, pillarFluting: true });
    expect(t.pillars).toHaveLength(12);
    expect(t.pillars[0].children).toHaveLength(12);
  });
});

describe('scene — portal', () => {
  it('unit_two_faces_back_to_back_with_independent_uniforms', () => {
    const { scene } = createScene();
    const p = createPortal(scene);
    expect(p.surfA.position.z).toBeGreaterThan(0);
    expect(p.surfB.position.z).toBeLessThan(0);
    expect(p.surfB.rotation.y).toBeCloseTo(Math.PI);
    expect(p.portalMatA.uniforms.uMouse.value).not.toBe(p.portalMatB.uniforms.uMouse.value);
    expect(p.portalGroup.position.y).toBe(1.0);
    expect(p.surfA.name).toBe('portal-gold');
    expect(p.surfB.name).toBe('portal-purple');
  });
});

describe('scene — lighting', () => {
  it('unit_five_point_lights_all_pin_decay_1', () => {
    const { scene } = createScene();
    createLighting(scene, TIER_CONFIGS[2]);
    const points = countPointLights(scene);
    expect(points).toHaveLength(5);
    for (const l of points) expect(l.decay).toBe(PALETTE.point.decay);
  });

  it('unit_shadow_map_size_follows_tier_and_shadows_toggle', () => {
    const { scene } = createScene();
    const hi = createLighting(scene, TIER_CONFIGS[3]);
    expect(hi.sunLight.shadow.mapSize.x).toBe(2048);
    expect(hi.sunLight.castShadow).toBe(true);
    const { scene: s2 } = createScene();
    const lo = createLighting(s2, TIER_CONFIGS[1]);
    expect(lo.sunLight.castShadow).toBe(false);
    expect(lo.goldLight.castShadow).toBe(false);
  });

  it('brand_hemisphere_sky_is_warm', () => {
    const { scene } = createScene();
    const { hemiLight } = createLighting(scene, TIER_CONFIGS[2]);
    expect(hemiLight.color.r).toBeGreaterThan(hemiLight.color.b);
  });
});

describe('scene — dispose', () => {
  it('unit_disposeScene_disposes_each_geometry_and_material_once_and_clears', () => {
    const { scene } = createScene();
    createEnvironment(scene, TIER_CONFIGS[2]);
    createTemple(scene, TIER_CONFIGS[2]);
    createPortal(scene);
    createLighting(scene, TIER_CONFIGS[2]);
    const disposables = new Set<{ dispose(): void }>();
    let disposeCalls = 0;
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.geometry) disposables.add(m.geometry);
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mat of mats) disposables.add(mat);
    });
    for (const d of disposables) {
      const orig = d.dispose.bind(d);
      d.dispose = () => { disposeCalls++; orig(); };
    }
    const n = disposeScene(scene);
    expect(n).toBe(disposables.size);
    expect(disposeCalls).toBe(disposables.size);
    expect(scene.children).toHaveLength(0);
  });
});
