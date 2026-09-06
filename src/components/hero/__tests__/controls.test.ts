import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Mesh, PerspectiveCamera, PlaneGeometry, MeshBasicMaterial, Raycaster } from 'three';
import { bindControls, checkPortalHover, isClick, sideOfSurface, toNDC } from '../engine/controls';
import { createState } from '../engine/state';
import { createHeroStore } from '../heroStore';
import { CLICK_MAX_MS, CLICK_MAX_TRAVEL_PX, GOLD_ANGLE, KEY_ORBIT_STEP, PURPLE_ANGLE } from '../constants';

const rect = { left: 100, top: 50, width: 800, height: 400 };

// jsdom has no PointerEvent; a MouseEvent subclass carrying the pointer fields is enough.
class PointerEventPolyfill extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, init: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
    super(type, { bubbles: true, cancelable: true, ...init });
    this.pointerId = init.pointerId ?? 0;
    this.pointerType = init.pointerType ?? 'mouse';
  }
}
if (typeof globalThis.PointerEvent === 'undefined') {
  (globalThis as unknown as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent = PointerEventPolyfill;
}

describe('controls — pure helpers', () => {
  it('unit_toNDC_maps_container_corners', () => {
    expect(toNDC(100, 50, rect)).toEqual({ x: -1, y: 1 });
    expect(toNDC(900, 450, rect)).toEqual({ x: 1, y: -1 });
    const c = toNDC(500, 250, rect);
    expect(c.x).toBeCloseTo(0);
    expect(c.y).toBeCloseTo(0);
  });

  it('edge_toNDC_survives_zero_size_rect', () => {
    const r = toNDC(10, 10, { left: 0, top: 0, width: 0, height: 0 });
    expect(Number.isFinite(r.x) && Number.isFinite(r.y)).toBe(true);
  });

  it('unit_isClick_thresholds', () => {
    expect(isClick(0, 0)).toBe(true);
    expect(isClick(CLICK_MAX_TRAVEL_PX - 1, CLICK_MAX_MS - 1)).toBe(true);
    expect(isClick(CLICK_MAX_TRAVEL_PX, 10)).toBe(false);
    expect(isClick(1, CLICK_MAX_MS)).toBe(false);
  });

  it('unit_sideOfSurface', () => {
    const a = new Mesh();
    const b = new Mesh();
    expect(sideOfSurface(a, a, b)).toBe('gold');
    expect(sideOfSurface(b, a, b)).toBe('purple');
    expect(sideOfSurface(new Mesh(), a, b)).toBeNull();
    expect(sideOfSurface(null, a, b)).toBeNull();
  });

  it('unit_checkPortalHover_hits_a_plane_in_front_of_camera', () => {
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const plane = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial());
    plane.updateMatrixWorld();
    const rc = new Raycaster();
    expect(checkPortalHover(rc, camera, { x: 0, y: 0 }, [plane])).toBe(plane);
    expect(checkPortalHover(rc, camera, { x: 0.99, y: 0.99 }, [plane])).toBeNull();
  });
});

describe('controls — binding lifecycle', () => {
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  const camera = new PerspectiveCamera(50, 2, 0.1, 100);
  const surfA = new Mesh();
  const surfB = new Mesh();

  beforeEach(() => {
    container = document.createElement('div');
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
    document.body.appendChild(container);
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ ...rect, right: 900, bottom: 450, x: 100, y: 50, toJSON: () => ({}) } as DOMRect);
  });
  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  function bind(overrides: Partial<Parameters<typeof bindControls>[0]> = {}) {
    const state = createState();
    const store = createHeroStore();
    const onPortalActivate = vi.fn();
    const onEscape = vi.fn();
    let t = 1000;
    const controls = bindControls({ canvas, container, state, camera, surfA, surfB, store, onPortalActivate, onEscape, now: () => t, ...overrides });
    return { state, store, controls, onPortalActivate, onEscape, tick: (ms: number) => { t += ms; } };
  }

  it('unit_unbind_removes_every_listener_it_added', () => {
    const addC = vi.spyOn(canvas, 'addEventListener');
    const remC = vi.spyOn(canvas, 'removeEventListener');
    const addK = vi.spyOn(container, 'addEventListener');
    const remK = vi.spyOn(container, 'removeEventListener');
    const addW = vi.spyOn(window, 'addEventListener');
    const remW = vi.spyOn(window, 'removeEventListener');
    const { controls } = bind();
    controls.unbind();
    expect(remC).toHaveBeenCalledTimes(addC.mock.calls.length);
    expect(remK).toHaveBeenCalledTimes(addK.mock.calls.length);
    expect(remW).toHaveBeenCalledTimes(addW.mock.calls.length);
    expect(addW.mock.calls.map((c) => c[0]).sort()).toEqual(['blur', 'scroll']);
  });

  it('unit_pointer_drag_rotates_target_angle_and_marks_dragging', () => {
    const { state, controls } = bind();
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 400, clientY: 200, bubbles: true }));
    expect(state.dragging).toBe(true);
    const before = state.targetAngle;
    canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 460, clientY: 200, bubbles: true }));
    expect(state.targetAngle).toBeLessThan(before);
    canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: 460, clientY: 200, bubbles: true }));
    expect(state.dragging).toBe(false);
    controls.unbind();
  });

  it('unit_secondary_mouse_button_does_not_start_drag', () => {
    const { state, controls } = bind();
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 2, clientX: 400, clientY: 200 }));
    expect(state.dragging).toBe(false);
    controls.unbind();
  });

  it('unit_touch_marks_touch_device', () => {
    const { state, controls } = bind();
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, pointerType: 'touch', button: 0, clientX: 400, clientY: 200 }));
    expect(state.isTouchDevice).toBe(true);
    controls.unbind();
  });

  it('unit_hover_move_publishes_pointer_into_store', () => {
    const { store, state, controls } = bind();
    canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 500, clientY: 250 }));
    expect(store.get().pointer).toEqual({ x: 400, y: 200, visible: true });
    expect(state.mouse.nx).toBeCloseTo(0);
    controls.unbind();
  });

  it('unit_pointerleave_hides_cursor_and_clears_hover', () => {
    const { store, state, controls } = bind();
    canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 500, clientY: 250 }));
    state.hoverPortal = true;
    container.dispatchEvent(new PointerEvent('pointerleave'));
    expect(store.get().pointer.visible).toBe(false);
    expect(state.hoverPortal).toBe(false);
    controls.unbind();
  });

  it('unit_keyboard_orbits_and_snaps', () => {
    const { state, controls, onEscape } = bind();
    const start = state.targetAngle;
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(state.targetAngle).toBeCloseTo(start + KEY_ORBIT_STEP);
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(state.targetAngle).toBeCloseTo(start);
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(state.targetAngle).toBeCloseTo(PURPLE_ANGLE);
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(state.targetAngle).toBeCloseTo(GOLD_ANGLE);
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(state.hasEngaged).toBe(true);
    controls.unbind();
  });

  it('unit_window_blur_ends_drag', () => {
    const { state, controls } = bind();
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 400, clientY: 200 }));
    window.dispatchEvent(new Event('blur'));
    expect(state.dragging).toBe(false);
    controls.unbind();
  });

  it('unit_scroll_target_tracks_page_scroll_relative_to_hero_height', () => {
    Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });
    const { controls } = bind();
    Object.defineProperty(window, 'scrollY', { value: 250, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(controls.getScrollTarget()).toBeCloseTo(0.5);
    Object.defineProperty(window, 'scrollY', { value: 5000, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(controls.getScrollTarget()).toBe(1);
    controls.unbind();
  });

  it('unit_click_on_portal_surface_activates_side', () => {
    const cam = new PerspectiveCamera(50, 2, 0.1, 100);
    cam.position.set(0, 0, 5);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const a = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial());
    a.updateMatrixWorld();
    const b = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial());
    b.position.set(50, 0, 0);
    b.updateMatrixWorld();
    const { controls, onPortalActivate } = bind({ camera: cam, surfA: a, surfB: b });
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 500, clientY: 250 }));
    canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: 501, clientY: 250 }));
    expect(onPortalActivate).toHaveBeenCalledWith('gold');
    controls.unbind();
  });

  it('edge_long_drag_release_is_not_a_click', () => {
    const cam = new PerspectiveCamera(50, 2, 0.1, 100);
    cam.position.set(0, 0, 5);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const a = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial());
    a.updateMatrixWorld();
    const { controls, onPortalActivate, tick } = bind({ camera: cam, surfA: a });
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 500, clientY: 250 }));
    tick(CLICK_MAX_MS + 50);
    canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: 500, clientY: 250 }));
    expect(onPortalActivate).not.toHaveBeenCalled();
    controls.unbind();
  });
});
