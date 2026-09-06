import { describe, it, expect } from 'vitest';
import { createState } from '../engine/state';
import { GOLD_ANGLE } from '../constants';

describe('createState', () => {
  it('unit_defaults_start_on_the_gold_face', () => {
    const s = createState();
    expect(s.currentAngle).toBe(GOLD_ANGLE);
    expect(s.targetAngle).toBe(GOLD_ANGLE);
    expect(s.holdProgress).toBe(0);
    expect(s.snappedTo).toBeNull();
    expect(s.dragging).toBe(false);
    expect(s.hasEngaged).toBe(false);
    expect(s.dwellReady).toBe(false);
  });

  it('unit_instances_are_independent', () => {
    const a = createState();
    const b = createState();
    a.targetAngle = 3;
    a.mouse.x = 99;
    expect(b.targetAngle).toBe(GOLD_ANGLE);
    expect(b.mouse.x).toBe(0);
  });
});
