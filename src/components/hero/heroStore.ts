import { useSyncExternalStore } from 'react';
import type { Side } from './constants';

export type HeroMode = 'loading' | 'scene' | 'fallback' | 'contextLost' | 'transition';

export interface HeroSnapshot {
  p: number;
  side: Side;
  snappedTo: Side | null;
  hovering: boolean;
  engaged: boolean;
  dwellReady: boolean;
  dragging: boolean;
  pointer: { x: number; y: number; visible: boolean };
  enteringSide: Side | null;
}

export interface HeroStore {
  get(): HeroSnapshot;
  set(patch: Partial<HeroSnapshot>): void;
  subscribe(cb: () => void): () => void;
}

export const INITIAL_SNAPSHOT: HeroSnapshot = {
  p: 0,
  side: 'gold',
  snappedTo: 'gold',
  hovering: false,
  engaged: false,
  dwellReady: false,
  dragging: false,
  pointer: { x: 0, y: 0, visible: false },
  enteringSide: null,
};

// Small external store: the engine publishes at ~10 Hz (plus immediately on
// discrete changes); React subscribes via useSyncExternalStore. Patches that
// change nothing do not notify, so a steady scene causes zero re-renders.
export function createHeroStore(initial: HeroSnapshot = INITIAL_SNAPSHOT): HeroStore {
  let snap: HeroSnapshot = { ...initial, pointer: { ...initial.pointer } };
  const subs = new Set<() => void>();
  return {
    get: () => snap,
    set(patch) {
      let changed = false;
      for (const key of Object.keys(patch) as Array<keyof HeroSnapshot>) {
        const next = patch[key];
        const prev = snap[key];
        if (key === 'pointer') {
          const a = prev as HeroSnapshot['pointer'];
          const b = next as HeroSnapshot['pointer'];
          if (a.x !== b.x || a.y !== b.y || a.visible !== b.visible) changed = true;
        } else if (prev !== next) {
          changed = true;
        }
      }
      if (!changed) return;
      snap = { ...snap, ...patch, pointer: { ...(patch.pointer ?? snap.pointer) } };
      subs.forEach((cb) => cb());
    },
    subscribe(cb) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
  };
}

export function useHeroSnapshot(store: HeroStore): HeroSnapshot {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
