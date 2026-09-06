import { site } from '@/lib/site';
import styles from './hero.module.css';

interface HeroLoadingProps {
  hidden: boolean;
  onFaded?(): void;
}

// Marble panel shown until the first frame renders; server-renderable so the
// page has a deterministic first paint before the client bundle arrives.
export function HeroLoading({ hidden, onFaded }: HeroLoadingProps) {
  return (
    <div
      className={`${styles.loading} ${hidden ? styles.loadingHidden : ''}`}
      aria-hidden="true"
      data-testid="hero-loading"
      onTransitionEnd={hidden ? onFaded : undefined}
    >
      <span className="display-3">{site.name}</span>
    </div>
  );
}
