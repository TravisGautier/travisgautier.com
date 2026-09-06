'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { PORTALS, type Side } from './constants';
import { useHeroSnapshot, type HeroStore } from './heroStore';
import styles from './hero.module.css';

interface HeroOverlayProps {
  store: HeroStore;
  onEnter(side: Side, event?: MouseEvent<HTMLAnchorElement>): void;
  coarsePointer?: boolean;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function labelOpacity(p: number, side: Side): number {
  const towardPurple = smoothstep(0.35, 0.65, p);
  return side === 'gold' ? 1 - towardPurple : towardPurple;
}

export function HeroOverlay({ store, onEnter, coarsePointer = false }: HeroOverlayProps) {
  const snap = useHeroSnapshot(store);
  const sides: Side[] = ['gold', 'purple'];

  return (
    <div className={styles.overlay} data-testid="hero-overlay">
      {sides.map((side) => {
        const dest = PORTALS[side];
        const opacity = labelOpacity(snap.p, side);
        const hidden = opacity < 0.05;
        const showEnter = snap.dwellReady && snap.snappedTo === side;
        const cls = [styles.sideLabel, side === 'gold' ? styles.left : styles.right, styles[side], hidden ? styles.hidden : '']
          .filter(Boolean)
          .join(' ');
        const linkProps = {
          className: `display-3 ${styles.title}`,
          'data-side': side,
          tabIndex: hidden ? -1 : 0,
          'aria-hidden': hidden ? true : undefined,
          onClick: (e: MouseEvent<HTMLAnchorElement>) => onEnter(side, e),
        };
        return (
          <div key={side} className={cls} style={{ opacity }} data-testid={`hero-label-${side}`}>
            <span className={`label ${styles.num}`} aria-hidden="true">
              {dest.num}
            </span>
            {dest.external ? (
              <a href={dest.href} rel="noreferrer" {...linkProps}>
                {dest.title}
              </a>
            ) : (
              <Link href={dest.href} prefetch {...linkProps}>
                {dest.title}
              </Link>
            )}
            <span className={`body-3 ${styles.subtitle}`}>{dest.subtitle}</span>
            <span className={`label ${styles.enter} ${showEnter ? styles.enterVisible : ''}`} aria-hidden={!showEnter}>
              Enter →
            </span>
          </div>
        );
      })}

      <p className={`label ${styles.hint}`} style={{ opacity: snap.engaged ? 0 : 1 }} aria-hidden={snap.engaged}>
        <span>{coarsePointer ? 'Swipe to explore' : 'Drag to explore'}</span>
        <span className={styles.rule} aria-hidden="true">
          <span className={`${styles.fill} ${snap.side === 'purple' ? styles.fillPurple : ''}`} style={{ width: `${Math.round(snap.p * 100)}%` }} />
        </span>
      </p>

      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="hero-announcer">
        {PORTALS[snap.side].announce}
      </div>
    </div>
  );
}
