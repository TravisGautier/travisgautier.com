import { describe, it, expect, vi } from 'vitest';
import { applyRuntimeDowngrade, createFPSMonitor } from '../engine/fpsMonitor';
import { FPS_SAMPLE_COUNT, FPS_THRESHOLD } from '../constants';

describe('fpsMonitor', () => {
  it('unit_fires_downgrade_once_when_mean_frame_time_is_slow', () => {
    const onDowngrade = vi.fn();
    const sample = createFPSMonitor(onDowngrade);
    for (let i = 0; i < FPS_SAMPLE_COUNT * 2; i++) sample(FPS_THRESHOLD + 0.01);
    expect(onDowngrade).toHaveBeenCalledTimes(1);
  });

  it('unit_stays_quiet_when_fast', () => {
    const onDowngrade = vi.fn();
    const sample = createFPSMonitor(onDowngrade);
    for (let i = 0; i < FPS_SAMPLE_COUNT; i++) sample(1 / 60);
    expect(onDowngrade).not.toHaveBeenCalled();
  });

  it('edge_does_not_fire_before_enough_samples', () => {
    const onDowngrade = vi.fn();
    const sample = createFPSMonitor(onDowngrade);
    for (let i = 0; i < FPS_SAMPLE_COUNT - 1; i++) sample(1);
    expect(onDowngrade).not.toHaveBeenCalled();
  });

  it('unit_applyRuntimeDowngrade_reduces_everything_once', () => {
    const renderer = { pr: 2, getPixelRatio() { return this.pr; }, setPixelRatio(r: number) { this.pr = r; }, shadowMap: { enabled: true } };
    const particleMat = { visible: true };
    const skyMat = { uniforms: { uSkyCloudNoise: { value: 1 } } };
    applyRuntimeDowngrade({ renderer, particleMat, skyMat });
    expect(renderer.pr).toBe(1.5);
    expect(renderer.shadowMap.enabled).toBe(false);
    expect(particleMat.visible).toBe(false);
    expect(skyMat.uniforms.uSkyCloudNoise.value).toBe(0);
    applyRuntimeDowngrade({ renderer, particleMat, skyMat });
    expect(renderer.pr).toBe(1); // floor at 1
  });
});
