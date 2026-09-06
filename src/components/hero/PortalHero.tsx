'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { PORTALS, TRANSITION_NAV_DELAY_MS, type Side } from './constants';
import { HeroCursor } from './HeroCursor';
import { HeroFallback } from './HeroFallback';
import { HeroLoading } from './HeroLoading';
import { HeroOverlay } from './HeroOverlay';
import { HeroTransition } from './HeroTransition';
import { createHeroStore, type HeroMode } from './heroStore';
import { determineQuality, tierOverrideFromSearch, type QualityConfig } from './quality';
import styles from './hero.module.css';
import type { HeroEngine } from './engine';

const ARIA_LABEL =
  'Interactive scene: a marble portal inside an open-air temple above the clouds. Drag or use the arrow keys to turn between The Work and The Library; press Enter on a destination to visit it.';

export interface PortalHeroProps {
  /** Test seam — defaults to the real quality probe. */
  quality?: () => Promise<QualityConfig>;
  /** Test seam — defaults to the dynamically imported engine. */
  loadEngine?: () => Promise<typeof import('./engine')>;
}

export function PortalHero({ quality, loadEngine }: PortalHeroProps = {}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HeroEngine | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const store = useMemo(createHeroStore, []);
  const router = useRouter();
  const [mode, setMode] = useState<HeroMode>('loading');
  const [loadingGone, setLoadingGone] = useState(false);
  const [engineKey, setEngineKey] = useState(0);
  const [finePointer, setFinePointer] = useState(false);
  const [entering, setEntering] = useState<Side | null>(null);
  const [tier, setTier] = useState<number | null>(null);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    try {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      setFinePointer(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setFinePointer(e.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    } catch {
      return undefined;
    }
  }, []);

  const cancelEnter = useCallback(() => {
    if (navTimer.current) clearTimeout(navTimer.current);
    navTimer.current = null;
    setEntering(null);
  }, []);

  const enter = useCallback(
    (side: Side, event?: MouseEvent<HTMLAnchorElement>) => {
      event?.preventDefault();
      if (navTimer.current) return;
      setEntering(side);
      const dest = PORTALS[side];
      navTimer.current = setTimeout(() => {
        navTimer.current = null;
        if (dest.external) window.location.assign(dest.href);
        else routerRef.current.push(dest.href);
      }, TRANSITION_NAV_DELAY_MS);
    },
    [],
  );

  const enterRef = useRef(enter);
  enterRef.current = enter;
  const cancelRef = useRef(cancelEnter);
  cancelRef.current = cancelEnter;

  useEffect(() => () => cancelEnter(), [cancelEnter]);

  useEffect(() => {
    let cancelled = false;
    let engine: HeroEngine | null = null;
    const host = hostRef.current;
    if (!host) return;

    (async () => {
      const q = await (quality ?? (() => determineQuality({
        benchmarksURL: '/benchmarks',
        timeoutMs: 3000,
        forceTier: tierOverrideFromSearch(window.location.search, process.env.NODE_ENV === 'production'),
      })))();
      if (cancelled) return;
      setTier(q.tier);
      if (q.tier === 0) {
        setMode('fallback');
        return;
      }
      const mod = await (loadEngine ?? (() => import('./engine')))();
      if (cancelled) return;
      try {
        engine = mod.createHero(host, {
          quality: q,
          store,
          onReady: () => setMode('scene'),
          onContextLost: () => setMode('contextLost'),
          onContextRestored: () => setEngineKey((k) => k + 1),
          onPortalActivate: (side) => enterRef.current(side),
          onEscape: () => cancelRef.current(),
        });
        engineRef.current = engine;
      } catch {
        setMode('fallback');
      }
    })();

    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, [engineKey, store, quality, loadEngine]);

  const restore = () => {
    setMode('loading');
    setLoadingGone(false);
    setEngineKey((k) => k + 1);
  };

  const showLoading = mode === 'loading' || (mode === 'scene' && !loadingGone);

  return (
    <section
      data-hero-root
      data-mode={mode}
      data-tier={tier ?? undefined}
      data-fine-pointer={finePointer ? 'true' : 'false'}
      className={styles.root}
      role="region"
      aria-label={ARIA_LABEL}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancelEnter();
      }}
    >
      <a href="#content" className={styles.skipLink}>
        Skip the scene
      </a>

      {mode === 'fallback' ? <HeroFallback /> : <div ref={hostRef} className={styles.canvasHost} data-testid="hero-canvas-host" />}

      {mode !== 'fallback' ? <HeroOverlay store={store} onEnter={enter} coarsePointer={!finePointer} /> : null}
      {mode === 'scene' && finePointer ? <HeroCursor store={store} /> : null}

      {showLoading ? <HeroLoading hidden={mode === 'scene'} onFaded={() => setLoadingGone(true)} /> : null}

      {mode === 'contextLost' ? (
        <div className={styles.notice} role="alert" data-testid="hero-context-lost">
          <span className="display-3">Session interrupted</span>
          <span className="body-2">The graphics session was paused by your device.</span>
          <button type="button" className={`label ${styles.noticeButton}`} onClick={restore}>
            Restore
          </button>
        </div>
      ) : null}

      {entering ? <HeroTransition side={entering} /> : null}
    </section>
  );
}
