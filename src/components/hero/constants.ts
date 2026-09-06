import { site } from '@/lib/site';

export type Side = 'gold' | 'purple';

// Camera orbit
export const GOLD_ANGLE = 0.25;
export const PURPLE_ANGLE = Math.PI + 0.25;
export const CAM_ORBIT_RADIUS = 4.2;
export const MIN_ORBIT_RADIUS = 2.8;
export const MAX_ORBIT_RADIUS = 5.0;
export const CAM_HEIGHT = 2.0;
export const LOOK_TARGET = { x: 0, y: 1.2, z: 0 } as const;

// Time
export const DT_CLAMP_MAX = 0.1;
export const TIME_WRAP_PERIOD = 10000.0;

// Damping (per-second bases; applied as 1 - base^dt)
export const DAMP_ANGLE_BASE = Math.pow(1 - 0.14, 60);
export const DAMP_SCROLL_BASE = Math.pow(1 - 0.1, 60);
export const DAMP_CAM_XZ_BASE = Math.pow(1 - 0.15, 60);
export const DAMP_CAM_Y_BASE = Math.pow(1 - 0.12, 60);
export const DAMP_HOVER_BASE = Math.pow(1 - 0.05, 60);
export const DAMP_TILT_BASE = Math.pow(1 - 0.14, 60);
export const MOMENTUM_DECAY_BASE = Math.pow(1 - 0.05, 60);
export const MOMENTUM_CUTOFF = 0.0001;

// Runtime quality monitor
export const FPS_SAMPLE_COUNT = 120;
export const FPS_THRESHOLD = 0.022;
export const FPS_DOWNGRADE_PIXEL_RATIO_DROP = 0.5;

// Pointer
export const RAYCAST_THROTTLE_MS = 50;
export const DRAG_SENSITIVITY = 0.005;
export const TOUCH_DRAG_SENSITIVITY = 0.008;
export const TILT_SENSITIVITY = 0.003;
export const TILT_MIN = -0.55;
export const TILT_MAX = 0.55;
export const KEY_ORBIT_STEP = 0.15;
export const CLICK_MAX_TRAVEL_PX = 6;
export const CLICK_MAX_MS = 300;

// Snapping
export const SNAP_ZONE_HALF_WIDTH = 0.3;
export const SNAP_HYSTERESIS = 0.08;
export const SNAP_STRENGTH = 0.04;
export const SNAP_VELOCITY_THRESHOLD = 0.3;

// Portal entry
export const TRANSITION_DWELL_TIME = 0.5;
export const TRANSITION_NAV_DELAY_MS = 600;

// Overlay publishing cadence (engine → React store)
export const STORE_PUBLISH_INTERVAL = 0.1;

export interface PortalDestination {
  num: string;
  title: string;
  subtitle: string;
  href: string;
  external: boolean;
  announce: string;
}

export const PORTALS: Record<Side, PortalDestination> = {
  gold: {
    num: '01',
    title: 'The Work',
    subtitle: 'Episodes · Cases · Build Log',
    href: '/episodes',
    external: false,
    announce: 'Now showing: The Work — episodes, case studies and the build log.',
  },
  purple: {
    num: '02',
    title: 'The Library',
    subtitle: 'The Large Language Library',
    href: site.sisterProjectUrl,
    external: true,
    announce: 'Now showing: The Library — The Large Language Library, the sister project.',
  },
};
