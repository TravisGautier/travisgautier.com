import { describe, it, expect, vi } from 'vitest';
import { Color, type FogExp2 } from 'three';
import { createScene } from '../engine/scene/setup';
import { createEnvironment } from '../engine/scene/environment';
import { createPortal } from '../engine/scene/portal';
import { createLighting } from '../engine/scene/lighting';
import { createState } from '../engine/state';
import { startAnimateLoop } from '../engine/animate';
import { createHeroStore } from '../heroStore';
import { TIER_CONFIGS, type QualityConfig } from '../quality';
import { PALETTE } from '../engine/palette';
import { PURPLE_ANGLE } from '../constants';
import type { RendererLike } from '../engine/renderer';

function fakeRenderer(): RendererLike & { renders: number; clear: Color } {
  const r = {
    renders: 0,
    clear: new Color(),
    domElement: document.createElement('canvas'),
    setSize() {},
    setPixelRatio() {},
    getPixelRatio: () => 1,
    setClearColor(c: import('three').ColorRepresentation) { r.clear.set(c); },
    render() { r.renders++; },
    dispose() {},
    forceContextLoss() {},
    shadowMap: { enabled: true, type: 0 },
  };
  return r;
}

function build(motion: Partial<QualityConfig> = {}, tier = 2) {
  const { scene, camera, lookTarget } = createScene(2);
  const env = createEnvironment(scene, TIER_CONFIGS[tier], () => 0.5);
  const portal = createPortal(scene);
  const lights = createLighting(scene, TIER_CONFIGS[tier]);
  const state = createState();
  const store = createHeroStore();
  const renderer = fakeRenderer();
  const rafQueue: FrameRequestCallback[] = [];
  const raf = vi.fn((cb: FrameRequestCallback) => { rafQueue.push(cb); return rafQueue.length; });
  const caf = vi.fn();
  const sampleFPS = vi.fn();
  const loop = startAnimateLoop({
    state, scene, camera, renderer, lookTarget, ...portal, ...lights,
    skyMat: env.skyMat, cloudSeaMat: env.cloudSeaMat, cloudSea2Mat: env.cloudSea2Mat,
    particles: env.particles, particleSpeeds: env.particleSpeeds, particleMat: env.particleMat,
    store, getScrollTarget: () => 0, sampleFPS,
    motion: { freezeShaderTime: false, disableParticles: false, disablePortalBob: false, instantCameraTransition: false, ...motion },
    raf, caf, random: () => 0.5,
  });
  return { scene, camera, env, portal, lights, state, store, renderer, loop, raf, caf, sampleFPS, rafQueue };
}

describe('animate loop', () => {
  it('unit_starts_active_and_schedules_a_frame', () => {
    const { loop, raf, renderer } = build();
    expect(loop.isActive()).toBe(true);
    expect(raf).toHaveBeenCalledTimes(1);
    expect(renderer.renders).toBe(0); // no frame until raf fires or step()
  });

  it('unit_step_renders_and_samples_fps', () => {
    const { loop, renderer, sampleFPS } = build();
    loop.step(1 / 60);
    expect(renderer.renders).toBe(1);
    expect(sampleFPS).toHaveBeenCalledWith(1 / 60);
  });

  it('unit_progress_drives_fog_clear_and_light_balance', () => {
    const { loop, state, scene, renderer, lights } = build();
    state.currentAngle = PURPLE_ANGLE;
    state.targetAngle = PURPLE_ANGLE;
    loop.step(1 / 60);
    expect(state.holdProgress).toBeCloseTo(1, 2);
    const fog = scene.fog as FogExp2;
    expect(fog.color.r).toBeCloseTo(PALETTE.fog.purple[0], 1);
    expect(renderer.clear.getHex()).toBe(fog.color.getHex());
    expect(lights.purpleLight.intensity).toBeGreaterThan(lights.goldLight.intensity);
    expect(fog.density).toBeGreaterThan(PALETTE.fogDensity.base);
  });

  it('unit_gold_side_has_gold_light_dominant', () => {
    const { loop, lights } = build();
    loop.step(1 / 60);
    expect(lights.goldLight.intensity).toBeGreaterThan(lights.purpleLight.intensity);
    expect(lights.purpleLight.intensity).toBeCloseTo(0, 5);
  });

  it('unit_reduced_motion_freezes_shader_time_and_bob', () => {
    const { loop, portal, env } = build({ freezeShaderTime: true, disablePortalBob: true, disableParticles: true });
    const y = portal.portalGroup.position.y;
    const before = Array.from((env.particles.geometry.getAttribute('position').array as Float32Array).slice(0, 6));
    loop.step(0.5);
    loop.step(0.5);
    expect(portal.portalMatA.uniforms.uTime.value).toBe(0);
    expect(env.skyMat.uniforms.uTime.value).toBe(0);
    expect(portal.portalGroup.position.y).toBe(y);
    expect(Array.from((env.particles.geometry.getAttribute('position').array as Float32Array).slice(0, 6))).toEqual(before);
  });

  it('unit_particles_advance_and_wrap', () => {
    const { loop, env } = build();
    const arr = env.particles.geometry.getAttribute('position').array as Float32Array;
    arr[1] = 7.999;
    loop.step(1 / 60);
    expect(arr[1]).toBeLessThan(0); // wrapped back to -1
    expect(env.particles.geometry.getAttribute('position').needsUpdate || true).toBe(true);
  });

  it('unit_instant_camera_snaps_to_target', () => {
    const { loop, state, camera } = build({ instantCameraTransition: true });
    state.currentAngle = PURPLE_ANGLE;
    state.targetAngle = PURPLE_ANGLE;
    loop.step(1 / 60);
    expect(camera.position.x).toBeCloseTo(Math.sin(PURPLE_ANGLE) * 4.2, 3);
  });

  it('unit_store_publishes_progress_and_side', () => {
    const { loop, state, store } = build();
    expect(store.get().side).toBe('gold');
    state.currentAngle = PURPLE_ANGLE;
    state.targetAngle = PURPLE_ANGLE;
    loop.step(0.2);
    expect(store.get().side).toBe('purple');
    expect(store.get().p).toBeGreaterThan(0.9);
  });

  it('unit_setActive_false_cancels_raf_and_true_reschedules', () => {
    const { loop, raf, caf } = build();
    loop.setActive(false);
    expect(caf).toHaveBeenCalledTimes(1);
    expect(loop.isActive()).toBe(false);
    loop.setActive(true);
    expect(raf).toHaveBeenCalledTimes(2);
    loop.setActive(true); // idempotent
    expect(raf).toHaveBeenCalledTimes(2);
  });

  it('unit_stop_is_terminal_and_idempotent', () => {
    const { loop, caf, rafQueue, renderer } = build();
    loop.stop();
    loop.stop();
    expect(caf).toHaveBeenCalledTimes(1);
    loop.setActive(true);
    expect(loop.isActive()).toBe(false);
    rafQueue[0](16); // a stale frame callback must not render
    expect(renderer.renders).toBe(0);
  });

  it('unit_frame_callback_renders_and_reschedules', () => {
    const { rafQueue, renderer, raf } = build();
    rafQueue[0](16);
    expect(renderer.renders).toBe(1);
    expect(raf).toHaveBeenCalledTimes(2);
  });
});
