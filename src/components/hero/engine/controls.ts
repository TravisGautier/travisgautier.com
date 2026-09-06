import { Raycaster, type Camera, type Object3D } from 'three';
import {
  CLICK_MAX_MS,
  CLICK_MAX_TRAVEL_PX,
  DRAG_SENSITIVITY,
  KEY_ORBIT_STEP,
  RAYCAST_THROTTLE_MS,
  TILT_MAX,
  TILT_MIN,
  TILT_SENSITIVITY,
  TOUCH_DRAG_SENSITIVITY,
  type Side,
} from '../constants';
import type { HeroStore } from '../heroStore';
import type { HeroState } from './state';

export interface NDC {
  x: number;
  y: number;
}

// Container-relative normalized device coordinates.
export function toNDC(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): NDC {
  const w = rect.width || 1;
  const h = rect.height || 1;
  return { x: ((clientX - rect.left) / w) * 2 - 1, y: -((clientY - rect.top) / h) * 2 + 1 };
}

export function checkPortalHover(raycaster: Raycaster, camera: Camera, ndc: NDC, surfaces: Object3D[]): Object3D | null {
  raycaster.setFromCamera({ x: ndc.x, y: ndc.y } as import('three').Vector2, camera);
  const hits = raycaster.intersectObjects(surfaces, false);
  return hits.length > 0 ? hits[0].object : null;
}

export function isClick(travelPx: number, elapsedMs: number): boolean {
  return travelPx < CLICK_MAX_TRAVEL_PX && elapsedMs < CLICK_MAX_MS;
}

export function sideOfSurface(obj: Object3D | null, surfA: Object3D, surfB: Object3D): Side | null {
  if (obj === surfA) return 'gold';
  if (obj === surfB) return 'purple';
  return null;
}

export interface ControlsOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  state: HeroState;
  camera: Camera;
  surfA: Object3D;
  surfB: Object3D;
  store: HeroStore;
  onPortalActivate(side: Side): void;
  onEscape(): void;
  now?: () => number;
}

export interface Controls {
  unbind(): void;
  orbitBy(deltaRad: number): void;
  setTargetAngle(angle: number): void;
  getScrollTarget(): number;
}

// All listeners are scoped to the canvas/container (plus one window `blur` and
// one passive window `scroll`), and every one is removed by `unbind()`.
export function bindControls(opts: ControlsOptions): Controls {
  const { canvas, container, state, camera, surfA, surfB, store, onPortalActivate, onEscape } = opts;
  const now = opts.now ?? (() => performance.now());
  const raycaster = new Raycaster();
  const cleanups: Array<() => void> = [];
  let lastRaycast = 0;
  let lastMoveTime = 0;
  let downX = 0;
  let downY = 0;
  let downTime = 0;
  let travel = 0;
  let activePointer: number | null = null;
  let scrollTarget = 0;

  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window, type: K | string, fn: EventListener, options?: AddEventListenerOptions) => {
    el.addEventListener(type, fn, options);
    cleanups.push(() => el.removeEventListener(type, fn, options));
  };

  const rect = () => container.getBoundingClientRect();

  function startDrag(x: number, y: number) {
    state.dragging = true;
    state.lastDragX = x;
    state.lastDragY = y;
    state.dragVelocity = 0;
    state.tiltVelocity = 0;
    state.snappedTo = null;
    state.dwellTimer = 0;
    state.dwellReady = false;
    lastMoveTime = now();
  }

  function endDrag() {
    state.dragging = false;
  }

  function handleDragMove(x: number, y: number, sensitivity: number) {
    const deltaX = x - state.lastDragX;
    const deltaY = y - state.lastDragY;
    state.targetAngle -= deltaX * sensitivity;
    state.targetTilt = Math.max(TILT_MIN, Math.min(TILT_MAX, state.targetTilt + deltaY * TILT_SENSITIVITY));
    const t = now();
    const moveDt = (t - lastMoveTime) / 1000;
    if (moveDt > 0 && moveDt < 0.1) {
      state.dragVelocity = (-deltaX * sensitivity) / moveDt;
      state.tiltVelocity = (deltaY * TILT_SENSITIVITY) / moveDt;
    }
    lastMoveTime = t;
    travel += Math.abs(deltaX) + Math.abs(deltaY);
    state.lastDragX = x;
    state.lastDragY = y;
  }

  function updateHover(clientX: number, clientY: number, force = false) {
    const t = now();
    if (!force && t - lastRaycast < RAYCAST_THROTTLE_MS) return;
    lastRaycast = t;
    const hit = checkPortalHover(raycaster, camera, toNDC(clientX, clientY, rect()), [surfA, surfB]);
    state.hoverPortal = hit !== null;
  }

  on(canvas, 'pointerdown', ((e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType !== 'mouse') state.isTouchDevice = true;
    activePointer = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* jsdom */ }
    downX = e.clientX; downY = e.clientY; downTime = now(); travel = 0;
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  }) as EventListener);

  on(canvas, 'pointermove', ((e: PointerEvent) => {
    const r = rect();
    state.mouse.x = e.clientX - r.left;
    state.mouse.y = e.clientY - r.top;
    store.set({ pointer: { x: state.mouse.x, y: state.mouse.y, visible: e.pointerType === 'mouse' } });
    if (state.dragging && e.pointerId === activePointer) {
      handleDragMove(e.clientX, e.clientY, e.pointerType === 'mouse' ? DRAG_SENSITIVITY : TOUCH_DRAG_SENSITIVITY);
    } else {
      const ndc = toNDC(e.clientX, e.clientY, r);
      state.mouse.nx = ndc.x;
      state.mouse.ny = ndc.y;
    }
    updateHover(e.clientX, e.clientY);
  }) as EventListener);

  const release = ((e: PointerEvent) => {
    if (activePointer !== null && e.pointerId !== activePointer) return;
    const wasDragging = state.dragging;
    endDrag();
    activePointer = null;
    if (wasDragging && e.type === 'pointerup' && isClick(travel + Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY), now() - downTime)) {
      updateHover(e.clientX, e.clientY, true);
      const hit = checkPortalHover(raycaster, camera, toNDC(e.clientX, e.clientY, rect()), [surfA, surfB]);
      const side = sideOfSurface(hit, surfA, surfB);
      if (side) onPortalActivate(side);
    }
  }) as EventListener;
  on(canvas, 'pointerup', release);
  on(canvas, 'pointercancel', release);
  on(canvas, 'lostpointercapture', release);

  on(container, 'pointerleave', (() => {
    state.hoverPortal = false;
    store.set({ pointer: { ...store.get().pointer, visible: false } });
  }) as EventListener);

  on(window, 'blur', (() => endDrag()) as EventListener);

  // Page scroll drives the parallax dolly; the hero never captures wheel.
  const onScroll = () => {
    const h = container.clientHeight || 1;
    scrollTarget = Math.max(0, Math.min(1, window.scrollY / h));
  };
  on(window, 'scroll', onScroll as EventListener, { passive: true });
  onScroll();

  on(container, 'keydown', ((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { orbitBy(KEY_ORBIT_STEP); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { orbitBy(-KEY_ORBIT_STEP); e.preventDefault(); }
    else if (e.key === 'Home') { setTargetAngle(0.25); e.preventDefault(); }
    else if (e.key === 'End') { setTargetAngle(Math.PI + 0.25); e.preventDefault(); }
    else if (e.key === 'Escape') onEscape();
  }) as EventListener);

  on(canvas, 'contextmenu', ((e: Event) => e.preventDefault()) as EventListener);

  function orbitBy(deltaRad: number) {
    state.snappedTo = null;
    state.dwellTimer = 0;
    state.targetAngle += deltaRad;
    state.hasEngaged = true;
  }

  function setTargetAngle(angle: number) {
    state.snappedTo = null;
    state.dwellTimer = 0;
    state.dragVelocity = 0;
    state.targetAngle = angle;
    state.hasEngaged = true;
  }

  return {
    unbind() {
      cleanups.splice(0).forEach((fn) => fn());
      endDrag();
    },
    orbitBy,
    setTargetAngle,
    getScrollTarget: () => scrollTarget,
  };
}
