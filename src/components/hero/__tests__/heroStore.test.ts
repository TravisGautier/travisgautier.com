import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createHeroStore, INITIAL_SNAPSHOT, useHeroSnapshot } from '../heroStore';

describe('heroStore', () => {
  it('unit_initial_snapshot_is_gold_at_rest', () => {
    const s = createHeroStore();
    expect(s.get()).toEqual(INITIAL_SNAPSHOT);
    expect(s.get()).not.toBe(INITIAL_SNAPSHOT); // copied, not shared
  });

  it('unit_set_notifies_subscribers_only_on_change', () => {
    const s = createHeroStore();
    const cb = vi.fn();
    const unsub = s.subscribe(cb);
    s.set({ p: 0 });
    expect(cb).not.toHaveBeenCalled();
    s.set({ p: 0.5 });
    expect(cb).toHaveBeenCalledTimes(1);
    s.set({ pointer: { x: 0, y: 0, visible: false } });
    expect(cb).toHaveBeenCalledTimes(1);
    s.set({ pointer: { x: 1, y: 0, visible: false } });
    expect(cb).toHaveBeenCalledTimes(2);
    unsub();
    s.set({ p: 0.9 });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('unit_snapshots_are_immutable_between_sets', () => {
    const s = createHeroStore();
    const a = s.get();
    s.set({ side: 'purple' });
    expect(s.get()).not.toBe(a);
    expect(a.side).toBe('gold');
  });

  it('unit_useHeroSnapshot_rerenders_on_change', () => {
    const s = createHeroStore();
    const { result } = renderHook(() => useHeroSnapshot(s));
    expect(result.current.side).toBe('gold');
    act(() => s.set({ side: 'purple', p: 1 }));
    expect(result.current.side).toBe('purple');
    expect(result.current.p).toBe(1);
  });
});
