import Image from 'next/image';
import Link from 'next/link';
import { PORTALS } from './constants';
import styles from './hero.module.css';

export const FALLBACK_STILL = '/hero/portal-still.jpg';

// Tier 0 / no-WebGL: a still of the scene with both destinations as plain
// links. Imports nothing from three, so the tier-0 bundle stays tiny.
export function HeroFallback() {
  return (
    <div className={styles.canvasHost} data-testid="hero-fallback">
      <Image src={FALLBACK_STILL} alt="" fill priority sizes="100vw" className={styles.fallbackImage} aria-hidden="true" />
      <div className={styles.overlay}>
        <div className={`${styles.sideLabel} ${styles.left} ${styles.gold}`}>
          <span className={`label ${styles.num}`} aria-hidden="true">{PORTALS.gold.num}</span>
          <Link href={PORTALS.gold.href} className={`display-3 ${styles.title}`}>{PORTALS.gold.title}</Link>
          <span className={`body-3 ${styles.subtitle}`}>{PORTALS.gold.subtitle}</span>
        </div>
        <div className={`${styles.sideLabel} ${styles.right} ${styles.purple}`}>
          <span className={`label ${styles.num}`} aria-hidden="true">{PORTALS.purple.num}</span>
          <a href={PORTALS.purple.href} rel="noreferrer" className={`display-3 ${styles.title}`}>{PORTALS.purple.title}</a>
          <span className={`body-3 ${styles.subtitle}`}>{PORTALS.purple.subtitle}</span>
        </div>
      </div>
    </div>
  );
}
