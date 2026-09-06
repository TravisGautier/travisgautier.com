import { describe, it, expect, vi } from 'vitest';
import { buildQualityConfig, determineQuality, isMobile, isSmallScreen, lowCoreCount, TIER_CONFIGS, type GLContext } from '../quality';

const env = { mobile: false, smallScreen: false, reducedMotion: false, lowCores: false, devicePixelRatio: 2 };
const fakeGl = { getExtension: () => null } as unknown as GLContext;
const probeOk = () => fakeGl;
const probeNone = () => null;

type GetTier = NonNullable<NonNullable<Parameters<typeof determineQuality>[0]>['getGPUTier']>;
type TierResult = Awaited<ReturnType<GetTier>>;
const tierOf = (tier: number, type: TierResult['type'] = 'BENCHMARK') =>
  vi.fn(async () => ({ tier, type }) as TierResult);

describe('quality — tier table', () => {
  it('unit_four_tiers_monotonic', () => {
    expect(TIER_CONFIGS).toHaveLength(4);
    for (let i = 1; i < 4; i++) {
      expect(TIER_CONFIGS[i].particleCount).toBeGreaterThanOrEqual(TIER_CONFIGS[i - 1].particleCount);
      expect(TIER_CONFIGS[i].pillarCount).toBeGreaterThanOrEqual(TIER_CONFIGS[i - 1].pillarCount);
    }
    expect(TIER_CONFIGS[0].shadowsEnabled).toBe(false);
    expect(TIER_CONFIGS[3].pillarFluting).toBe(true);
  });

  it('unit_buildQualityConfig_caps_mobile_and_small_screens', () => {
    expect(buildQualityConfig(3, { ...env, mobile: true }).tier).toBe(1);
    expect(buildQualityConfig(3, { ...env, smallScreen: true }).tier).toBe(2);
    expect(buildQualityConfig(3, { ...env, lowCores: true }).tier).toBe(1);
    expect(buildQualityConfig(3, env).tier).toBe(3);
  });

  it('unit_tier3_uses_device_pixel_ratio_capped_at_2', () => {
    expect(buildQualityConfig(3, { ...env, devicePixelRatio: 3 }).pixelRatio).toBe(2);
    expect(buildQualityConfig(3, { ...env, devicePixelRatio: 1.5 }).pixelRatio).toBe(1.5);
    expect(buildQualityConfig(2, env).pixelRatio).toBe(1.5);
  });

  it('unit_reduced_motion_sets_all_four_flags', () => {
    const c = buildQualityConfig(2, { ...env, reducedMotion: true });
    expect(c.freezeShaderTime && c.disableParticles && c.disablePortalBob && c.instantCameraTransition).toBe(true);
    const d = buildQualityConfig(2, env);
    expect(d.freezeShaderTime || d.disableParticles || d.disablePortalBob || d.instantCameraTransition).toBe(false);
  });

  it('edge_out_of_range_tiers_clamp', () => {
    expect(buildQualityConfig(-3, env).tier).toBe(0);
    expect(buildQualityConfig(9, env).tier).toBe(3);
  });
});

describe('quality — determineQuality', () => {
  it('unit_no_webgl_is_tier_0', async () => {
    const getGPUTier = tierOf(3);
    const c = await determineQuality({ ...env, probe: probeNone, getGPUTier });
    expect(c.tier).toBe(0);
    expect(getGPUTier).not.toHaveBeenCalled();
  });

  it('unit_benchmark_result_passes_through', async () => {
    const c = await determineQuality({ ...env, probe: probeOk, getGPUTier: tierOf(3) });
    expect(c.tier).toBe(3);
  });

  it('unit_blocklisted_or_unsupported_is_tier_0', async () => {
    expect((await determineQuality({ ...env, probe: probeOk, getGPUTier: tierOf(2, 'BLOCKLISTED') })).tier).toBe(0);
    expect((await determineQuality({ ...env, probe: probeOk, getGPUTier: tierOf(2, 'WEBGL_UNSUPPORTED') })).tier).toBe(0);
  });

  it('err_thrown_lookup_degrades_to_tier_2_on_desktop_1_on_mobile', async () => {
    const boom = vi.fn(async () => { throw new Error('offline'); });
    expect((await determineQuality({ ...env, probe: probeOk, getGPUTier: boom })).tier).toBe(2);
    expect((await determineQuality({ ...env, mobile: true, probe: probeOk, getGPUTier: boom })).tier).toBe(1);
  });

  it('edge_timeout_degrades_to_tier_2_not_0', async () => {
    const never = vi.fn(() => new Promise<never>(() => {}));
    const c = await determineQuality({ ...env, probe: probeOk, getGPUTier: never, timeoutMs: 5 });
    expect(c.tier).toBe(2);
  });

  it('unit_passes_self_hosted_benchmarks_url', async () => {
    const getGPUTier = tierOf(2);
    await determineQuality({ ...env, probe: probeOk, getGPUTier, benchmarksURL: '/benchmarks' });
    expect(getGPUTier).toHaveBeenCalledWith(expect.objectContaining({ benchmarksURL: '/benchmarks' }));
  });

  it('unit_releases_probe_context', async () => {
    const lose = vi.fn();
    const gl = { getExtension: () => ({ loseContext: lose }) } as unknown as GLContext;
    await determineQuality({ ...env, probe: () => gl, getGPUTier: tierOf(2) });
    expect(lose).toHaveBeenCalled();
  });
});

describe('quality — environment helpers', () => {
  it('unit_isMobile_ua', () => {
    expect(isMobile('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
    expect(isMobile('Mozilla/5.0 (X11; Linux x86_64)')).toBe(false);
    expect(isMobile(undefined)).toBe(false);
  });
  it('unit_isSmallScreen', () => {
    expect(isSmallScreen(400)).toBe(true);
    expect(isSmallScreen(1200)).toBe(false);
    expect(isSmallScreen(undefined)).toBe(false);
  });
  it('unit_lowCoreCount', () => {
    expect(lowCoreCount(2)).toBe(true);
    expect(lowCoreCount(8)).toBe(false);
    expect(lowCoreCount(undefined)).toBe(false);
  });
});
