import { FPS_SAMPLE_COUNT, FPS_THRESHOLD, FPS_DOWNGRADE_PIXEL_RATIO_DROP } from '../constants';

export type FPSSampler = (dt: number) => void;

// Collects the first FPS_SAMPLE_COUNT frame deltas; if the mean frame time is
// above FPS_THRESHOLD, fires onDowngrade once and then goes quiet forever.
export function createFPSMonitor(onDowngrade: () => void): FPSSampler {
  const samples: number[] = [];
  let settled = false;
  return (dt: number) => {
    if (settled) return;
    samples.push(dt);
    if (samples.length >= FPS_SAMPLE_COUNT) {
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      if (avg > FPS_THRESHOLD) onDowngrade();
      settled = true;
    }
  };
}

export interface DowngradeTargets {
  renderer: { getPixelRatio(): number; setPixelRatio(r: number): void; shadowMap: { enabled: boolean } };
  particleMat: { visible: boolean };
  skyMat: { uniforms: { [name: string]: { value: unknown } } };
}

export function applyRuntimeDowngrade({ renderer, particleMat, skyMat }: DowngradeTargets): void {
  renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - FPS_DOWNGRADE_PIXEL_RATIO_DROP));
  renderer.shadowMap.enabled = false;
  particleMat.visible = false;
  skyMat.uniforms.uSkyCloudNoise.value = 0.0;
}
