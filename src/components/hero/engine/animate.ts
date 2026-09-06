import { Clock, Vector3, type Group, type HemisphereLight, type MeshStandardMaterial, type PerspectiveCamera, type PointLight, type Points, type PointsMaterial, type Scene, type ShaderMaterial } from 'three';
import {
  CAM_HEIGHT,
  CAM_ORBIT_RADIUS,
  DAMP_ANGLE_BASE,
  DAMP_CAM_XZ_BASE,
  DAMP_CAM_Y_BASE,
  DAMP_HOVER_BASE,
  DAMP_SCROLL_BASE,
  DAMP_TILT_BASE,
  DT_CLAMP_MAX,
  MAX_ORBIT_RADIUS,
  MIN_ORBIT_RADIUS,
  STORE_PUBLISH_INTERVAL,
  TIME_WRAP_PERIOD,
} from '../constants';
import type { HeroStore } from '../heroStore';
import type { QualityConfig } from '../quality';
import { dampFactor, shortestAngularDiff, sideForProgress, updateDragPhysics, updateDwell } from './dragOrbit';
import type { FPSSampler } from './fpsMonitor';
import { lerpRGB, PALETTE } from './palette';
import type { RendererLike } from './renderer';
import type { HeroState } from './state';

export interface AnimateDeps {
  state: HeroState;
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: RendererLike;
  lookTarget: Vector3;
  portalGroup: Group;
  portalMatA: ShaderMaterial;
  portalMatB: ShaderMaterial;
  edgeMat: MeshStandardMaterial;
  goldLight: PointLight;
  purpleLight: PointLight;
  groundGlow: PointLight;
  pillarLight1: PointLight;
  pillarLight2: PointLight;
  hemiLight: HemisphereLight;
  skyMat: ShaderMaterial;
  cloudSeaMat: ShaderMaterial | null;
  cloudSea2Mat: ShaderMaterial | null;
  particles: Points;
  particleSpeeds: Float32Array;
  particleMat: PointsMaterial;
  store: HeroStore;
  getScrollTarget: () => number;
  sampleFPS?: FPSSampler;
  motion: Pick<QualityConfig, 'freezeShaderTime' | 'disableParticles' | 'disablePortalBob' | 'instantCameraTransition'>;
  raf?: (cb: FrameRequestCallback) => number;
  caf?: (id: number) => void;
  random?: () => number;
}

export interface AnimateLoop {
  stop(): void;
  setActive(active: boolean): void;
  /** Advance one frame with an explicit dt (tests / manual stepping). */
  step(dt: number): void;
  isActive(): boolean;
}

export function startAnimateLoop(deps: AnimateDeps): AnimateLoop {
  const {
    state, scene, camera, renderer, lookTarget,
    portalGroup, portalMatA, portalMatB, edgeMat,
    goldLight, purpleLight, groundGlow, pillarLight1, pillarLight2, hemiLight,
    skyMat, cloudSeaMat, cloudSea2Mat, particles, particleSpeeds, particleMat,
    store, getScrollTarget, sampleFPS, motion,
  } = deps;
  const raf = deps.raf ?? ((cb) => requestAnimationFrame(cb));
  const caf = deps.caf ?? ((id) => cancelAnimationFrame(id));
  const random = deps.random ?? Math.random;
  const { freezeShaderTime, disableParticles, disablePortalBob, instantCameraTransition } = motion;

  const clock = new Clock(false);
  const lookScratch = new Vector3();
  const positions = particles.geometry.getAttribute('position');
  let publishAccumulator = STORE_PUBLISH_INTERVAL; // publish on first frame
  let lastSnapped = state.snappedTo;
  let lastDwell = state.dwellReady;
  let lastEngaged = state.hasEngaged;
  let lastHover = state.hoverPortal;
  let lastDragging = state.dragging;
  let lastSide = sideForProgress(state.holdProgress);
  let animationId: number | null = null;
  let active = false;
  let stopped = false;

  const P = PALETTE;
  const scaleGold = P.point.gold.base * P.point.scale;
  const scalePurple = P.point.purple.base * P.point.scale;
  const scalePillar = P.point.pillar.base * P.point.scale;
  const scaleGround = P.point.ground.base * P.point.scale;

  function publish(force: boolean, dt: number) {
    publishAccumulator += dt;
    const side = sideForProgress(state.holdProgress);
    const discrete =
      state.snappedTo !== lastSnapped || state.dwellReady !== lastDwell || state.hasEngaged !== lastEngaged ||
      state.hoverPortal !== lastHover || state.dragging !== lastDragging || side !== lastSide;
    if (!force && !discrete && publishAccumulator < STORE_PUBLISH_INTERVAL) return;
    publishAccumulator = 0;
    lastSnapped = state.snappedTo; lastDwell = state.dwellReady; lastEngaged = state.hasEngaged;
    lastHover = state.hoverPortal; lastDragging = state.dragging; lastSide = side;
    store.set({
      p: state.holdProgress,
      side,
      snappedTo: state.snappedTo,
      hovering: state.hoverPortal,
      engaged: state.hasEngaged,
      dwellReady: state.dwellReady,
      dragging: state.dragging,
    });
  }

  function step(dt: number) {
    sampleFPS?.(dt);
    state.time += dt;
    const wrappedTime = freezeShaderTime ? 0 : state.time % TIME_WRAP_PERIOD;

    updateDragPhysics(state, dt);
    updateDwell(state, dt);

    state.currentAngle += shortestAngularDiff(state.targetAngle, state.currentAngle) * dampFactor(DAMP_ANGLE_BASE, dt);
    const p = state.holdProgress;

    state.scroll += (getScrollTarget() - state.scroll) * dampFactor(DAMP_SCROLL_BASE, dt);

    if (!disablePortalBob) portalGroup.position.y = 1.0 + Math.sin(state.time * 0.4) * 0.015;

    const orbitRadius = Math.max(MIN_ORBIT_RADIUS, Math.min(MAX_ORBIT_RADIUS, CAM_ORBIT_RADIUS - state.scroll * 1.2));
    state.currentTilt += (state.targetTilt - state.currentTilt) * dampFactor(DAMP_TILT_BASE, dt);
    const camY = CAM_HEIGHT + state.scroll * 0.4;
    const targetX = Math.sin(state.currentAngle) * orbitRadius;
    const targetZ = Math.cos(state.currentAngle) * orbitRadius;
    if (instantCameraTransition) {
      camera.position.set(targetX, camY, targetZ);
    } else {
      camera.position.x += (targetX - camera.position.x) * dampFactor(DAMP_CAM_XZ_BASE, dt);
      camera.position.z += (targetZ - camera.position.z) * dampFactor(DAMP_CAM_XZ_BASE, dt);
      camera.position.y += (camY - camera.position.y) * dampFactor(DAMP_CAM_Y_BASE, dt);
    }
    lookScratch.set(lookTarget.x, lookTarget.y + state.currentTilt * 2.0, lookTarget.z);
    camera.lookAt(lookScratch);

    const hv = state.hoverPortal ? 1.0 : 0.0;
    for (const mat of [portalMatA, portalMatB]) {
      mat.uniforms.uTime.value = wrappedTime;
      (mat.uniforms.uMouse.value as { set(x: number, y: number): void }).set(state.mouse.nx, state.mouse.ny);
      mat.uniforms.uHover.value += (hv - mat.uniforms.uHover.value) * dampFactor(DAMP_HOVER_BASE, dt);
    }

    const accent = lerpRGB(P.accent.gold, P.accent.purple, p);
    edgeMat.color.setRGB(...accent);
    edgeMat.emissive.setRGB(accent[0] * 0.5, accent[1] * 0.5, accent[2] * 0.5);
    edgeMat.emissiveIntensity = 0.08 + Math.sin(state.time * 0.8) * 0.04;

    goldLight.intensity = (scaleGold + Math.sin(state.time * 0.5) * 0.3 + Math.sin(state.time * 1.3) * 0.1) * (1 - p);
    purpleLight.intensity = (scalePurple + Math.cos(state.time * 0.4) * 0.3 + Math.cos(state.time * 1.1) * 0.1) * p;

    groundGlow.color.setRGB(...accent);
    groundGlow.intensity = scaleGround * (1 + Math.sin(state.time * 0.6) * 0.25 + Math.sin(state.time * 1.7) * 0.12);

    const pillarTint = lerpRGB(P.pillarTint.gold, P.pillarTint.purple, p);
    pillarLight1.color.setRGB(...pillarTint);
    pillarLight2.color.setRGB(...pillarTint);
    const pillarBreath = scalePillar * (1 + Math.sin(state.time * 0.7) * 0.16 + Math.sin(state.time * 1.9) * 0.08);
    pillarLight1.intensity = pillarBreath;
    pillarLight2.intensity = pillarBreath;

    skyMat.uniforms.uHold.value = p;
    skyMat.uniforms.uTime.value = wrappedTime;
    if (cloudSeaMat) { cloudSeaMat.uniforms.uTime.value = wrappedTime; cloudSeaMat.uniforms.uHold.value = p; }
    if (cloudSea2Mat) { cloudSea2Mat.uniforms.uTime.value = wrappedTime; cloudSea2Mat.uniforms.uHold.value = p; }

    const fog = scene.fog as import('three').FogExp2 | null;
    if (fog) {
      fog.color.setRGB(...lerpRGB(P.fog.gold, P.fog.purple, p));
      fog.density = P.fogDensity.base + p * P.fogDensity.purpleAdd;
      renderer.setClearColor(fog.color);
    }

    hemiLight.color.setRGB(...lerpRGB(P.hemiSky.gold, P.hemiSky.purple, p));
    hemiLight.intensity = P.hemiIntensity * (1 + Math.sin(state.time * 0.35) * 0.08);

    if (!disableParticles && particleSpeeds.length > 0) {
      const arr = positions.array as Float32Array;
      for (let i = 0; i < particleSpeeds.length; i++) {
        arr[i * 3 + 1] += particleSpeeds[i];
        arr[i * 3] += Math.sin(state.time * 0.3 + i) * 0.001;
        const dx = -arr[i * 3];
        const dz = -arr[i * 3 + 2];
        const dist = Math.sqrt(dx * dx + dz * dz) + 0.1;
        arr[i * 3] += (dx / dist) * 0.0004;
        arr[i * 3 + 2] += (dz / dist) * 0.0004;
        if (arr[i * 3 + 1] > 8) {
          arr[i * 3 + 1] = -1;
          arr[i * 3] = (random() - 0.5) * 16;
          arr[i * 3 + 2] = (random() - 0.5) * 16;
        }
      }
      positions.needsUpdate = true;
      particleMat.opacity = 0.3 + 0.2 * Math.sin(state.time * 0.4);
      particleMat.color.setRGB(...lerpRGB(P.particleTint.gold, P.particleTint.purple, p));
    }

    publish(false, dt);
    renderer.render(scene, camera);
  }

  function frame() {
    if (!active || stopped) return;
    animationId = raf(frame);
    step(Math.min(clock.getDelta(), DT_CLAMP_MAX));
  }

  function setActive(next: boolean) {
    if (stopped || next === active) return;
    active = next;
    if (active) {
      clock.start();
      clock.getDelta();
      animationId = raf(frame);
    } else {
      clock.stop();
      if (animationId !== null) caf(animationId);
      animationId = null;
    }
  }

  publish(true, 0);
  setActive(true);

  return {
    stop() {
      if (stopped) return;
      setActive(false);
      stopped = true;
    },
    setActive,
    step,
    isActive: () => active,
  };
}
