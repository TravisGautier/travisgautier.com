import { describe, it, expect } from 'vitest';
import {
  angularDistance,
  computeSnapTarget,
  dampFactor,
  deriveHoldProgress,
  normalizeAngle,
  shortestAngularDiff,
  sideForProgress,
  updateDragPhysics,
  updateDwell,
} from '../engine/dragOrbit';
import { createState } from '../engine/state';
import { GOLD_ANGLE, PURPLE_ANGLE, SNAP_ZONE_HALF_WIDTH, SNAP_HYSTERESIS, SNAP_VELOCITY_THRESHOLD, TRANSITION_DWELL_TIME } from '../constants';

const TWO_PI = Math.PI * 2;

describe('dragOrbit — angle math', () => {
  it('unit_normalizeAngle_wraps_into_0_2pi', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(TWO_PI)).toBeCloseTo(0);
    expect(normalizeAngle(-0.5)).toBeCloseTo(TWO_PI - 0.5);
    expect(normalizeAngle(7 * Math.PI)).toBeCloseTo(Math.PI);
  });

  it('unit_angularDistance_is_symmetric_and_bounded_by_pi', () => {
    expect(angularDistance(0.2, 0.2)).toBe(0);
    expect(angularDistance(0, Math.PI)).toBeCloseTo(Math.PI);
    expect(angularDistance(0.1, TWO_PI - 0.1)).toBeCloseTo(0.2);
    expect(angularDistance(1, 2)).toBeCloseTo(angularDistance(2, 1));
  });

  it('unit_shortestAngularDiff_picks_the_short_way_round', () => {
    expect(shortestAngularDiff(0.1, TWO_PI - 0.1)).toBeCloseTo(0.2);
    expect(shortestAngularDiff(TWO_PI - 0.1, 0.1)).toBeCloseTo(-0.2);
    expect(Math.abs(shortestAngularDiff(3, 0))).toBeLessThanOrEqual(Math.PI);
  });

  it('unit_dampFactor_is_zero_at_dt0_and_approaches_one', () => {
    expect(dampFactor(0.5, 0)).toBe(0);
    expect(dampFactor(0.5, 1)).toBeCloseTo(0.5);
    expect(dampFactor(0.5, 10)).toBeGreaterThan(0.99);
  });
});

describe('dragOrbit — hold progress', () => {
  it('unit_progress_is_0_at_gold_1_at_purple_half_between', () => {
    expect(deriveHoldProgress(GOLD_ANGLE)).toBe(0);
    expect(deriveHoldProgress(PURPLE_ANGLE)).toBeCloseTo(1);
    expect(deriveHoldProgress(GOLD_ANGLE + Math.PI / 2)).toBeCloseTo(0.5);
    expect(deriveHoldProgress(GOLD_ANGLE - Math.PI / 2)).toBeCloseTo(0.5);
  });

  it('unit_sideForProgress_flips_at_half', () => {
    expect(sideForProgress(0)).toBe('gold');
    expect(sideForProgress(0.5)).toBe('gold');
    expect(sideForProgress(0.51)).toBe('purple');
  });
});

describe('dragOrbit — snapping', () => {
  it('unit_enters_gold_zone_when_slow_and_close', () => {
    const r = computeSnapTarget(GOLD_ANGLE + 0.1, 0.05, null);
    expect(r).toEqual({ snapTarget: GOLD_ANGLE, snappedTo: 'gold' });
  });

  it('unit_enters_purple_zone_when_slow_and_close', () => {
    const r = computeSnapTarget(PURPLE_ANGLE - 0.1, 0, null);
    expect(r).toEqual({ snapTarget: PURPLE_ANGLE, snappedTo: 'purple' });
  });

  it('edge_fast_pass_through_does_not_snap', () => {
    const r = computeSnapTarget(GOLD_ANGLE + 0.05, SNAP_VELOCITY_THRESHOLD + 0.1, null);
    expect(r.snappedTo).toBeNull();
  });

  it('edge_outside_both_zones_no_snap', () => {
    const r = computeSnapTarget(GOLD_ANGLE + Math.PI / 2, 0, null);
    expect(r.snappedTo).toBeNull();
    expect(r.snapTarget).toBeNull();
  });

  it('unit_hysteresis_keeps_snap_until_beyond_zone_plus_margin', () => {
    const inside = computeSnapTarget(GOLD_ANGLE + SNAP_ZONE_HALF_WIDTH + SNAP_HYSTERESIS / 2, 0, 'gold');
    expect(inside.snappedTo).toBe('gold');
    const outside = computeSnapTarget(GOLD_ANGLE + SNAP_ZONE_HALF_WIDTH + SNAP_HYSTERESIS + 0.01, 0, 'gold');
    expect(outside.snappedTo).toBeNull();
    const purpleOut = computeSnapTarget(PURPLE_ANGLE + SNAP_ZONE_HALF_WIDTH + SNAP_HYSTERESIS + 0.01, 0, 'purple');
    expect(purpleOut.snappedTo).toBeNull();
  });
});

describe('dragOrbit — physics step', () => {
  it('unit_momentum_decays_and_cuts_off', () => {
    const s = createState();
    s.dragVelocity = 1;
    s.targetAngle = GOLD_ANGLE + 1.2; // away from both snap zones
    for (let i = 0; i < 600; i++) updateDragPhysics(s, 1 / 60);
    expect(s.dragVelocity).toBe(0);
  });

  it('unit_snap_pulls_target_toward_gold', () => {
    const s = createState();
    s.targetAngle = GOLD_ANGLE + 0.2;
    s.currentAngle = s.targetAngle;
    const before = Math.abs(s.targetAngle - GOLD_ANGLE);
    updateDragPhysics(s, 1 / 60);
    expect(s.snappedTo).toBe('gold');
    expect(Math.abs(s.targetAngle - GOLD_ANGLE)).toBeLessThan(before);
  });

  it('unit_dragging_freezes_momentum_but_updates_progress', () => {
    const s = createState();
    s.dragging = true;
    s.dragVelocity = 5;
    s.currentAngle = PURPLE_ANGLE;
    updateDragPhysics(s, 0.1);
    expect(s.dragVelocity).toBe(5);
    expect(s.holdProgress).toBeCloseTo(1);
    expect(s.hasEngaged).toBe(true);
  });

  it('edge_transitioning_short_circuits', () => {
    const s = createState();
    s.transitioning = true;
    s.dragVelocity = 3;
    updateDragPhysics(s, 0.1);
    expect(s.dragVelocity).toBe(3);
  });

  it('unit_tilt_is_clamped', () => {
    const s = createState();
    s.tiltVelocity = 100;
    s.targetAngle = GOLD_ANGLE + 1.2;
    updateDragPhysics(s, 0.5);
    expect(s.targetTilt).toBeLessThanOrEqual(0.55);
  });
});

describe('dragOrbit — dwell', () => {
  it('unit_dwell_ready_after_resting_on_a_snapped_face', () => {
    const s = createState();
    s.snappedTo = 'gold';
    updateDwell(s, TRANSITION_DWELL_TIME / 2);
    expect(s.dwellReady).toBe(false);
    updateDwell(s, TRANSITION_DWELL_TIME / 2 + 0.01);
    expect(s.dwellReady).toBe(true);
  });

  it('unit_dwell_resets_when_dragging_or_unsnapped', () => {
    const s = createState();
    s.snappedTo = 'purple';
    updateDwell(s, 1);
    expect(s.dwellReady).toBe(true);
    s.dragging = true;
    updateDwell(s, 0.016);
    expect(s.dwellTimer).toBe(0);
    expect(s.dwellReady).toBe(false);
    s.dragging = false;
    s.snappedTo = null;
    updateDwell(s, 1);
    expect(s.dwellReady).toBe(false);
  });
});
