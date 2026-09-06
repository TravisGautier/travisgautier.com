import { PORTALS, type Side } from './constants';
import styles from './hero.module.css';

// Full-screen scrim shown between "Enter" and navigation. Solid marble for
// The Work, solid bone for The Library — no gradients.
export function HeroTransition({ side }: { side: Side }) {
  const dest = PORTALS[side];
  return (
    <div className={`${styles.transition} ${side === 'purple' ? styles.transitionPurple : ''}`} role="status" aria-live="assertive" data-testid="hero-transition">
      <span className="label">Entering</span>
      <span className="display-2">{dest.title}</span>
      <span className="body-3">Press Escape to stay</span>
    </div>
  );
}
