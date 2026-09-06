import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHero, WebGLUnavailableError } from '../engine';
import { createHeroStore } from '../heroStore';
import { buildQualityConfig } from '../quality';
import type { RendererLike } from '../engine/renderer';

const quality = buildQualityConfig(2, { mobile: false, smallScreen: false, reducedMotion: false, lowCores: false, devicePixelRatio: 1 });

function fakeRendererFactory() {
  const created: Array<RendererLike & { disposed: boolean; lost: boolean }> = [];
  const factory = (canvas: HTMLCanvasElement) => {
    const r = {
      disposed: false,
      lost: false,
      domElement: canvas,
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      getPixelRatio: () => 1,
      setClearColor: vi.fn(),
      render: vi.fn(),
      dispose() { r.disposed = true; },
      forceContextLoss() { r.lost = true; },
      shadowMap: { enabled: true, type: 0 },
    };
    created.push(r);
    return r;
  };
  return { factory, created };
}

class FakeObserver {
  static instances: FakeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(public cb: (entries: Array<{ isIntersecting: boolean }>) => void) { FakeObserver.instances.push(this); }
  observe(el: Element) { this.observed.push(el); }
  disconnect() { this.disconnected = true; }
  unobserve() {}
  takeRecords() { return []; }
}

describe('createHero', () => {
  let container: HTMLDivElement;
  const raf = vi.fn(() => 1);
  const caf = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });
    document.body.appendChild(container);
    FakeObserver.instances = [];
    raf.mockClear();
    caf.mockClear();
  });
  afterEach(() => container.remove());

  function make(extra: Partial<Parameters<typeof createHero>[1]> = {}) {
    const { factory, created } = fakeRendererFactory();
    const store = createHeroStore();
    const onReady = vi.fn();
    const engine = createHero(container, { quality, store, onReady, ...extra }, {
      createRenderer: factory,
      probe: () => ({}),
      ResizeObserverImpl: FakeObserver as unknown as typeof ResizeObserver,
      IntersectionObserverImpl: FakeObserver as unknown as typeof IntersectionObserver,
      raf, caf,
    });
    return { engine, created, store, onReady };
  }

  it('unit_appends_exactly_one_marked_canvas_and_calls_onReady', () => {
    const { engine, onReady, created } = make();
    expect(container.querySelectorAll('canvas[data-hero-canvas]')).toHaveLength(1);
    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(created[0].render).toHaveBeenCalledTimes(1); // first synchronous frame
    expect(created[0].setSize).toHaveBeenCalledWith(800, 400, false);
    engine.dispose();
  });

  it('unit_second_create_removes_stale_canvas_strict_mode_safe', () => {
    const first = make();
    const second = make();
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    first.engine.dispose();
    second.engine.dispose();
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('unit_dispose_tears_everything_down_once', () => {
    const addDoc = vi.spyOn(document, 'addEventListener');
    const remDoc = vi.spyOn(document, 'removeEventListener');
    const { engine, created } = make();
    engine.dispose();
    engine.dispose();
    expect(created[0].disposed).toBe(true);
    expect(created[0].lost).toBe(true);
    expect(container.querySelector('canvas')).toBeNull();
    expect(FakeObserver.instances.every((o) => o.disconnected)).toBe(true);
    expect(remDoc.mock.calls.filter((c) => c[0] === 'visibilitychange')).toHaveLength(addDoc.mock.calls.filter((c) => c[0] === 'visibilitychange').length);
    expect(engine.loop.isActive()).toBe(false);
    addDoc.mockRestore();
    remDoc.mockRestore();
  });

  it('err_throws_WebGLUnavailableError_when_probe_fails_and_leaves_no_canvas', () => {
    const { factory } = fakeRendererFactory();
    expect(() => createHero(container, { quality, store: createHeroStore() }, { createRenderer: factory, probe: () => null })).toThrow(WebGLUnavailableError);
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('unit_intersection_and_visibility_pause_and_resume_the_loop', () => {
    const { engine } = make();
    const io = FakeObserver.instances[1];
    io.cb([{ isIntersecting: false }]);
    expect(engine.loop.isActive()).toBe(false);
    io.cb([{ isIntersecting: true }]);
    expect(engine.loop.isActive()).toBe(true);
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(engine.loop.isActive()).toBe(false);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(engine.loop.isActive()).toBe(true);
    engine.dispose();
  });

  it('unit_resize_observer_updates_renderer_size', () => {
    const { engine, created } = make();
    Object.defineProperty(container, 'clientWidth', { value: 1200, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    FakeObserver.instances[0].cb([]);
    expect(created[0].setSize).toHaveBeenLastCalledWith(1200, 600, false);
    engine.dispose();
  });

  it('unit_context_lost_pauses_and_notifies_restored_notifies', () => {
    const onContextLost = vi.fn();
    const onContextRestored = vi.fn();
    const { engine } = make({ onContextLost, onContextRestored });
    engine.canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(onContextLost).toHaveBeenCalledTimes(1);
    expect(engine.loop.isActive()).toBe(false);
    engine.canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(onContextRestored).toHaveBeenCalledTimes(1);
    engine.dispose();
  });

  it('unit_snapTo_and_orbitBy_drive_progress_through_step', () => {
    const { engine, store } = make();
    engine.snapTo('purple');
    for (let i = 0; i < 240; i++) engine.step(1 / 60);
    expect(store.get().p).toBeGreaterThan(0.9);
    engine.orbitBy(Math.PI);
    for (let i = 0; i < 240; i++) engine.step(1 / 60);
    expect(store.get().p).toBeLessThan(0.2);
    engine.dispose();
  });
});
