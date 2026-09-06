import { GOLD_ANGLE, PURPLE_ANGLE, type Side } from '../constants';
import type { HeroStore } from '../heroStore';
import { probeWebGL, type QualityConfig } from '../quality';
import { startAnimateLoop, type AnimateLoop } from './animate';
import { bindControls, type Controls } from './controls';
import { disposeScene } from './dispose';
import { applyRuntimeDowngrade, createFPSMonitor } from './fpsMonitor';
import { createRenderer as defaultCreateRenderer, type CreateRenderer, type RendererLike } from './renderer';
import { createEnvironment } from './scene/environment';
import { createLighting } from './scene/lighting';
import { createPortal } from './scene/portal';
import { createScene } from './scene/setup';
import { createTemple } from './scene/temple';
import { createState } from './state';

export class WebGLUnavailableError extends Error {
  constructor(message = 'WebGL is not available') {
    super(message);
    this.name = 'WebGLUnavailableError';
  }
}

export interface HeroEngineOptions {
  quality: QualityConfig;
  store: HeroStore;
  onReady?(): void;
  onContextLost?(): void;
  onContextRestored?(): void;
  onPortalActivate?(side: Side): void;
  onEscape?(): void;
}

export interface HeroEngineDeps {
  createRenderer?: CreateRenderer;
  probe?: (canvas: HTMLCanvasElement) => unknown;
  ResizeObserverImpl?: typeof ResizeObserver;
  IntersectionObserverImpl?: typeof IntersectionObserver;
  raf?: (cb: FrameRequestCallback) => number;
  caf?: (id: number) => void;
}

export interface HeroEngine {
  dispose(): void;
  setActive(active: boolean): void;
  orbitBy(deltaRad: number): void;
  snapTo(side: Side): void;
  step(dt: number): void;
  readonly canvas: HTMLCanvasElement;
  readonly renderer: RendererLike;
  readonly loop: AnimateLoop;
  readonly controls: Controls;
}

const CANVAS_MARK = 'data-hero-canvas';

// Builds the whole scene inside `container`. Idempotent: a stale canvas from a
// previous (StrictMode) mount is removed first. `dispose()` reverses everything.
export function createHero(container: HTMLElement, opts: HeroEngineOptions, deps: HeroEngineDeps = {}): HeroEngine {
  container.querySelectorAll(`canvas[${CANVAS_MARK}]`).forEach((el) => el.remove());

  const canvas = document.createElement('canvas');
  canvas.setAttribute(CANVAS_MARK, '');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'pan-y pinch-zoom';
  container.appendChild(canvas);

  const probe = deps.probe ?? probeWebGL;
  if (!probe(canvas)) {
    canvas.remove();
    throw new WebGLUnavailableError();
  }

  const cleanups: Array<() => void> = [];
  let disposed = false;

  const w = container.clientWidth || 1;
  const h = container.clientHeight || 1;
  const { scene, camera, lookTarget } = createScene(w / h);
  const state = createState();
  const env = createEnvironment(scene, opts.quality);
  createTemple(scene, opts.quality);
  const portal = createPortal(scene);
  const lights = createLighting(scene, opts.quality);

  const makeRenderer = deps.createRenderer ?? defaultCreateRenderer;
  const renderer = makeRenderer(canvas, opts.quality);
  renderer.setSize(w, h, false);

  const onLost = (e: Event) => {
    e.preventDefault();
    loop.setActive(false);
    opts.onContextLost?.();
  };
  const onRestored = () => opts.onContextRestored?.();
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  cleanups.push(() => {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
  });

  const controls = bindControls({
    canvas,
    container,
    state,
    camera,
    surfA: portal.surfA,
    surfB: portal.surfB,
    store: opts.store,
    onPortalActivate: (side) => opts.onPortalActivate?.(side),
    onEscape: () => opts.onEscape?.(),
  });
  cleanups.push(() => controls.unbind());

  const sampleFPS = createFPSMonitor(() => applyRuntimeDowngrade({ renderer, particleMat: env.particleMat, skyMat: env.skyMat }));

  const loop = startAnimateLoop({
    state,
    scene,
    camera,
    renderer,
    lookTarget,
    ...portal,
    ...lights,
    skyMat: env.skyMat,
    cloudSeaMat: env.cloudSeaMat,
    cloudSea2Mat: env.cloudSea2Mat,
    particles: env.particles,
    particleSpeeds: env.particleSpeeds,
    particleMat: env.particleMat,
    store: opts.store,
    getScrollTarget: controls.getScrollTarget,
    sampleFPS,
    motion: opts.quality,
    raf: deps.raf,
    caf: deps.caf,
  });

  const RO = deps.ResizeObserverImpl ?? (typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined);
  if (RO) {
    const ro = new RO(() => {
      const cw = container.clientWidth || 1;
      const ch = container.clientHeight || 1;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch, false);
    });
    ro.observe(container);
    cleanups.push(() => ro.disconnect());
  }

  let visible = true;
  let intersecting = true;
  const applyActive = () => loop.setActive(visible && intersecting);
  const IO = deps.IntersectionObserverImpl ?? (typeof IntersectionObserver !== 'undefined' ? IntersectionObserver : undefined);
  if (IO) {
    const io = new IO((entries) => {
      intersecting = entries.some((e) => e.isIntersecting);
      applyActive();
    }, { threshold: 0 });
    io.observe(container);
    cleanups.push(() => io.disconnect());
  }
  const onVisibility = () => {
    visible = !document.hidden;
    applyActive();
  };
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

  // One synchronous frame so the first paint is not the clear colour.
  loop.step(0);
  opts.onReady?.();

  return {
    canvas,
    renderer,
    loop,
    controls,
    setActive: (a) => loop.setActive(a),
    orbitBy: (d) => controls.orbitBy(d),
    snapTo: (side) => controls.setTargetAngle(side === 'gold' ? GOLD_ANGLE : PURPLE_ANGLE),
    step: (dt) => loop.step(dt),
    dispose() {
      if (disposed) return;
      disposed = true;
      loop.stop();
      cleanups.splice(0).forEach((fn) => fn());
      disposeScene(scene);
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* already lost */ }
      canvas.remove();
    },
  };
}
