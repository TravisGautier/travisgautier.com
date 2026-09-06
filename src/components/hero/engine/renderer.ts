import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, WebGLRenderer, type Camera, type ColorRepresentation, type Scene } from 'three';
import type { QualityConfig } from '../quality';
import { PALETTE } from './palette';

// The only module that requires a live WebGL context. Everything else in the
// engine talks to this narrow interface so it can be faked in tests.
export interface RendererLike {
  domElement: HTMLCanvasElement;
  setSize(w: number, h: number, updateStyle?: boolean): void;
  setPixelRatio(r: number): void;
  getPixelRatio(): number;
  setClearColor(color: ColorRepresentation, alpha?: number): void;
  render(scene: Scene, camera: Camera): void;
  dispose(): void;
  forceContextLoss(): void;
  shadowMap: { enabled: boolean; type: number };
}

export type CreateRenderer = (canvas: HTMLCanvasElement, config: QualityConfig) => RendererLike;

export const createRenderer: CreateRenderer = (canvas, config) => {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: config.tier >= 2,
    alpha: false,
    powerPreference: config.tier >= 2 ? 'high-performance' : 'default',
    failIfMajorPerformanceCaveat: false,
  });
  renderer.setPixelRatio(config.pixelRatio || 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = PALETTE.toneMappingExposure;
  renderer.shadowMap.enabled = config.shadowsEnabled;
  renderer.shadowMap.type = PCFSoftShadowMap;
  return renderer;
};
