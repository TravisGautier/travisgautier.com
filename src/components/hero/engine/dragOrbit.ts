import {
  GOLD_ANGLE,
  PURPLE_ANGLE,
  MOMENTUM_DECAY_BASE,
  MOMENTUM_CUTOFF,
  TILT_MIN,
  TILT_MAX,
  SNAP_ZONE_HALF_WIDTH,
  SNAP_HYSTERESIS,
  SNAP_STRENGTH,
  SNAP_VELOCITY_THRESHOLD,
  TRANSITION_DWELL_TIME,
  type Side,
} from '../constants';
import type { HeroState } from './state';

const TWO_PI = Math.PI * 2;

export function normalizeAngle(a: number): number {
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
}

export function angularDistance(a: number, b: number): number {
  const d = normalizeAngle(a - b);
  return d > Math.PI ? TWO_PI - d : d;
}

export function shortestAngularDiff(target: number, current: number): number {
  let d = (target - current) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}

export interface SnapResult {
  snapTarget: number | null;
  snappedTo: Side | null;
}

export function computeSnapTarget(currentAngle: number, velocity: number, snappedTo: Side | null): SnapResult {
  const distToGold = angularDistance(currentAngle, GOLD_ANGLE);
  const distToPurple = angularDistance(currentAngle, PURPLE_ANGLE);
  const absVel = Math.abs(velocity);

  if (snappedTo === null) {
    if (distToGold < SNAP_ZONE_HALF_WIDTH && absVel < SNAP_VELOCITY_THRESHOLD) {
      return { snapTarget: GOLD_ANGLE, snappedTo: 'gold' };
    }
    if (distToPurple < SNAP_ZONE_HALF_WIDTH && absVel < SNAP_VELOCITY_THRESHOLD) {
      return { snapTarget: PURPLE_ANGLE, snappedTo: 'purple' };
    }
    return { snapTarget: null, snappedTo: null };
  }

  if (snappedTo === 'gold') {
    if (distToGold > SNAP_ZONE_HALF_WIDTH + SNAP_HYSTERESIS) return { snapTarget: null, snappedTo: null };
    return { snapTarget: GOLD_ANGLE, snappedTo: 'gold' };
  }

  if (distToPurple > SNAP_ZONE_HALF_WIDTH + SNAP_HYSTERESIS) return { snapTarget: null, snappedTo: null };
  return { snapTarget: PURPLE_ANGLE, snappedTo: 'purple' };
}

// 0 at the gold face, 1 at the purple face, 0.5 exactly between.
export function deriveHoldProgress(currentAngle: number): number {
  const distToGold = angularDistance(currentAngle, GOLD_ANGLE);
  const distToPurple = angularDistance(currentAngle, PURPLE_ANGLE);
  const sum = distToGold + distToPurple;
  if (sum === 0) return 0;
  return Math.max(0, Math.min(1, distToGold / sum));
}

export function dampFactor(base: number, dt: number): number {
  return 1 - Math.pow(base, dt);
}

export function sideForProgress(p: number): Side {
  return p > 0.5 ? 'purple' : 'gold';
}

export function updateDragPhysics(state: HeroState, dt: number): void {
  if (state.transitioning) return;

  if (!state.dragging) {
    const decay = dampFactor(MOMENTUM_DECAY_BASE, dt);
    state.dragVelocity *= 1 - decay;
    if (Math.abs(state.dragVelocity) < MOMENTUM_CUTOFF) state.dragVelocity = 0;
    state.tiltVelocity *= 1 - decay;
    if (Math.abs(state.tiltVelocity) < MOMENTUM_CUTOFF) state.tiltVelocity = 0;

    state.targetAngle += state.dragVelocity * dt;
    state.targetTilt += state.tiltVelocity * dt;
    state.targetTilt = Math.max(TILT_MIN, Math.min(TILT_MAX, state.targetTilt));

    const snap = computeSnapTarget(state.targetAngle, state.dragVelocity, state.snappedTo);
    state.snappedTo = snap.snappedTo;

    if (snap.snapTarget !== null) {
      const diff = shortestAngularDiff(snap.snapTarget, state.targetAngle);
      state.targetAngle += diff * SNAP_STRENGTH;
      state.dragVelocity *= 0.9;
    }
  }

  state.holdProgress = deriveHoldProgress(state.currentAngle);
  if (state.holdProgress > 0.5) state.hasEngaged = true;
}

// Dwell: after resting on a snapped face for TRANSITION_DWELL_TIME the
// "Enter" affordance appears. Never navigates on its own.
export function updateDwell(state: HeroState, dt: number): void {
  if (state.transitioning) return;
  if (state.snappedTo !== null && !state.dragging) {
    state.dwellTimer += dt;
  } else {
    state.dwellTimer = 0;
  }
  state.dwellReady = state.dwellTimer >= TRANSITION_DWELL_TIME;
}
