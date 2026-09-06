'use client';

import { useEffect, useRef } from 'react';
import type { HeroStore } from './heroStore';
import styles from './hero.module.css';

// Scoped custom cursor. Positioned directly from the store inside its own
// small subscription so pointer motion never re-renders React.
export function HeroCursor({ store }: { store: HeroStore }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const { pointer, hovering, dragging } = store.get();
      el.style.transform = '';
      el.style.left = `${pointer.x}px`;
      el.style.top = `${pointer.y}px`;
      el.classList.toggle(styles.cursorHidden, !pointer.visible);
      el.classList.toggle(styles.cursorHover, hovering && !dragging);
      el.classList.toggle(styles.cursorGrab, dragging);
    };
    apply();
    return store.subscribe(apply);
  }, [store]);

  return <div ref={ref} className={`${styles.cursor} ${styles.cursorHidden}`} aria-hidden="true" data-testid="hero-cursor" />;
}
