import { GOLD_ANGLE, type Side } from '../constants';

export interface HeroState {
  mouse: { x: number; y: number; nx: number; ny: number };
  scroll: number;
  hoverPortal: boolean;
  time: number;
  holdProgress: number;
  currentAngle: number;
  targetAngle: number;
  hasEngaged: boolean;
  transitioning: boolean;
  dwellTimer: number;
  dwellReady: boolean;
  isTouchDevice: boolean;
  dragging: boolean;
  dragVelocity: number;
  tiltVelocity: number;
  lastDragX: number;
  lastDragY: number;
  targetTilt: number;
  currentTilt: number;
  snappedTo: Side | null;
}

// One state object per engine instance — never a module singleton, so
// StrictMode double-mounts and fast refresh cannot leak stale orbit state.
export function createState(): HeroState {
  return {
    mouse: { x: 0, y: 0, nx: 0, ny: 0 },
    scroll: 0,
    hoverPortal: false,
    time: 0,
    holdProgress: 0,
    currentAngle: GOLD_ANGLE,
    targetAngle: GOLD_ANGLE,
    hasEngaged: false,
    transitioning: false,
    dwellTimer: 0,
    dwellReady: false,
    isTouchDevice: false,
    dragging: false,
    dragVelocity: 0,
    tiltVelocity: 0,
    lastDragX: 0,
    lastDragY: 0,
    targetTilt: 0,
    currentTilt: 0,
    snappedTo: null,
  };
}
