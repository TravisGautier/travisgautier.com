import type { getGPUTier as GetGPUTier } from 'detect-gpu';

export interface TierConfig {
  pixelRatio: number;
  shadowMapSize: number;
  shadowsEnabled: boolean;
  particleCount: number;
  pillarCount: number;
  pillarFluting: boolean;
  cloudLayers: 0 | 1 | 2;
  skyCloudNoise: boolean;
}

export interface QualityConfig extends TierConfig {
  tier: 0 | 1 | 2 | 3;
  freezeShaderTime: boolean;
  disableParticles: boolean;
  disablePortalBob: boolean;
  instantCameraTransition: boolean;
}

export const TIER_CONFIGS: readonly TierConfig[] = [
  { pixelRatio: 1, shadowMapSize: 0, shadowsEnabled: false, particleCount: 0, pillarCount: 6, pillarFluting: false, cloudLayers: 0, skyCloudNoise: false },
  { pixelRatio: 1, shadowMapSize: 0, shadowsEnabled: false, particleCount: 50, pillarCount: 8, pillarFluting: false, cloudLayers: 1, skyCloudNoise: false },
  { pixelRatio: 1.5, shadowMapSize: 1024, shadowsEnabled: true, particleCount: 100, pillarCount: 10, pillarFluting: false, cloudLayers: 1, skyCloudNoise: true },
  { pixelRatio: 0, shadowMapSize: 2048, shadowsEnabled: true, particleCount: 200, pillarCount: 12, pillarFluting: true, cloudLayers: 2, skyCloudNoise: true },
];

export type GLContext = WebGL2RenderingContext | WebGLRenderingContext;

export function probeWebGL(canvas?: HTMLCanvasElement): GLContext | null {
  try {
    if (typeof document === 'undefined') return null;
    const c = canvas ?? document.createElement('canvas');
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as GLContext | null;
    return gl ?? null;
  } catch {
    return null;
  }
}

export function releaseContext(gl: GLContext | null): void {
  try {
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    /* best effort */
  }
}

export function isMobile(ua: string | undefined = globalThis.navigator?.userAgent): boolean {
  return /Mobile|Android|iPhone|iPad/i.test(ua ?? '');
}

export function isSmallScreen(width: number | undefined = globalThis.innerWidth): boolean {
  return (width ?? Infinity) < 768;
}

export function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  } catch {
    return false;
  }
}

export function lowCoreCount(cores: number | undefined = globalThis.navigator?.hardwareConcurrency): boolean {
  return typeof cores === 'number' && cores > 0 && cores <= 2;
}

export interface DetermineQualityOptions {
  benchmarksURL?: string;
  timeoutMs?: number;
  getGPUTier?: typeof GetGPUTier;
  probe?: typeof probeWebGL;
  mobile?: boolean;
  smallScreen?: boolean;
  reducedMotion?: boolean;
  lowCores?: boolean;
  devicePixelRatio?: number;
}

export function buildQualityConfig(tierIn: number, opts: { mobile: boolean; smallScreen: boolean; reducedMotion: boolean; lowCores: boolean; devicePixelRatio: number }): QualityConfig {
  let tier = tierIn;
  if (opts.mobile && tier > 1) tier = 1;
  if (opts.lowCores && tier > 1) tier = 1;
  if (opts.smallScreen && tier > 2) tier = 2;
  tier = Math.max(0, Math.min(3, Math.round(tier)));
  const base = TIER_CONFIGS[tier];
  const config: QualityConfig = {
    tier: tier as QualityConfig['tier'],
    ...base,
    freezeShaderTime: opts.reducedMotion,
    disableParticles: opts.reducedMotion,
    disablePortalBob: opts.reducedMotion,
    instantCameraTransition: opts.reducedMotion,
  };
  if (tier === 3) config.pixelRatio = Math.min(opts.devicePixelRatio || 1, 2);
  return config;
}

// Tier 0 only when WebGL is genuinely unavailable or the GPU is blocklisted.
// A slow or failed benchmark lookup degrades to a *middle* tier, not to the
// static fallback — the runtime FPS monitor can still step down from there.
export async function determineQuality(options: DetermineQualityOptions = {}): Promise<QualityConfig> {
  const env = {
    mobile: options.mobile ?? isMobile(),
    smallScreen: options.smallScreen ?? isSmallScreen(),
    reducedMotion: options.reducedMotion ?? prefersReducedMotion(),
    lowCores: options.lowCores ?? lowCoreCount(),
    devicePixelRatio: options.devicePixelRatio ?? (globalThis.devicePixelRatio || 1),
  };
  const probe = options.probe ?? probeWebGL;
  const gl = probe();
  if (!gl) return buildQualityConfig(0, env);

  const fallbackTier = env.mobile ? 1 : 2;
  const timeoutMs = options.timeoutMs ?? 3000;
  let tier = fallbackTier;
  try {
    const getTier = options.getGPUTier ?? (await import('detect-gpu')).getGPUTier;
    const result = await Promise.race([
      getTier({ benchmarksURL: options.benchmarksURL ?? '/benchmarks', glContext: gl }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('gpu-tier-timeout')), timeoutMs)),
    ]);
    if (result.type === 'WEBGL_UNSUPPORTED' || result.type === 'BLOCKLISTED') tier = 0;
    else if (result.type === 'BENCHMARK' || result.type === 'FALLBACK') tier = result.tier;
    else tier = fallbackTier;
  } catch {
    tier = fallbackTier;
  } finally {
    releaseContext(gl);
  }
  return buildQualityConfig(tier, env);
}
