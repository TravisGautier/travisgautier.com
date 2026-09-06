import { FogExp2, PerspectiveCamera, Scene, Vector3 } from 'three';
import { CAM_HEIGHT, CAM_ORBIT_RADIUS, GOLD_ANGLE, LOOK_TARGET } from '../../constants';
import { PALETTE } from '../palette';

export interface SceneSetup {
  scene: Scene;
  camera: PerspectiveCamera;
  lookTarget: Vector3;
}

// Scene + camera only. No renderer, no DOM — fully constructible in jsdom.
export function createScene(aspect = 16 / 9): SceneSetup {
  const scene = new Scene();
  scene.background = null;
  const [r, g, b] = PALETTE.fog.gold;
  const fog = new FogExp2(0xffffff, PALETTE.fogDensity.base);
  fog.color.setRGB(r, g, b);
  scene.fog = fog;

  const camera = new PerspectiveCamera(50, aspect, 0.1, 500);
  camera.position.set(Math.sin(GOLD_ANGLE) * CAM_ORBIT_RADIUS, CAM_HEIGHT, Math.cos(GOLD_ANGLE) * CAM_ORBIT_RADIUS);
  const lookTarget = new Vector3(LOOK_TARGET.x, LOOK_TARGET.y, LOOK_TARGET.z);
  camera.lookAt(lookTarget);

  return { scene, camera, lookTarget };
}
