// Every colour and light intensity the scene uses, in one tunable table.
// Pairs are [gold-side, purple-side] and are lerped by p = holdProgress.
// Stone, sky and fog live in the site's marble/parchment/bone world; only the
// two portal accents (gold / purple) sit outside the palette by design.

export type RGB = readonly [number, number, number];

const PI = Math.PI;

export const PALETTE = {
  // Fog + clear colour (clear is set from fog every frame)
  fog: { gold: [0.94, 0.91, 0.85] as RGB, purple: [0.86, 0.8, 0.84] as RGB },
  fogDensity: { base: 0.007, purpleAdd: 0.003 },

  // Hemisphere light
  hemiSky: { gold: [0.85, 0.8, 0.72] as RGB, purple: [0.55, 0.47, 0.62] as RGB },
  hemiGround: 0xd4c4a8,
  hemiIntensity: 0.6 * PI,

  // Key / fill
  ambient: { color: 0xfff5e6, intensity: 0.7 * PI },
  sun: { color: 0xfff0d4, intensity: 1.8 * PI },
  fill: { color: 0xe8dcc4, intensity: 0.4 * PI },

  // Point lights. r155+ uses physical falloff; decay is pinned to 1 and the
  // legacy intensities are scaled to land in a similar visual range.
  point: {
    decay: 1,
    scale: 3.0,
    gold: { color: 0xc9a84c, base: 2.5, distance: 12 },
    purple: { color: 0x9b6dff, base: 2.5, distance: 12 },
    pillar: { color: 0xffe8c4, base: 0.5, distance: 8 },
    ground: { color: 0xc9a84c, base: 0.8, distance: 4 },
  },

  // Accent colour driven by p (edge trim, ground glow, particles)
  accent: { gold: [0.78, 0.66, 0.3] as RGB, purple: [0.61, 0.43, 1.0] as RGB },
  pillarTint: { gold: [1.0, 0.91, 0.77] as RGB, purple: [0.75, 0.6, 1.0] as RGB },
  particleTint: { gold: [1.0, 0.97, 0.88] as RGB, purple: [0.88, 0.82, 1.0] as RGB },

  // Stone
  marbleWhite: 0xe8e0d4,
  marbleCream: 0xf0e8dc,
  marbleWarm: 0xd8ccbc,
  stoneFloor: 0xccc4b4,
  stoneStep: 0xbeb6a6,
  floorRing: 0xb8a888,
  mountain: 0x8a8078,
  snow: 0xe8e4e0,

  // Portal frame
  frame: 0x1a1a1e,
  frameEmissive: 0x080808,
  trim: 0xc9a84c,

  particle: 0xfff8e0,

  toneMappingExposure: 1.15,
} as const;

export function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
