import { AmbientLight, DirectionalLight, HemisphereLight, PointLight, Scene } from 'three';
import type { TierConfig } from '../../quality';
import { PALETTE } from '../palette';

export interface Lighting {
  goldLight: PointLight;
  purpleLight: PointLight;
  groundGlow: PointLight;
  pillarLight1: PointLight;
  pillarLight2: PointLight;
  hemiLight: HemisphereLight;
  sunLight: DirectionalLight;
}

function point(color: number, base: number, distance: number): PointLight {
  const light = new PointLight(color, base * PALETTE.point.scale, distance, PALETTE.point.decay);
  return light;
}

export function createLighting(scene: Scene, config: Pick<TierConfig, 'shadowMapSize' | 'shadowsEnabled'>): Lighting {
  scene.add(new AmbientLight(PALETTE.ambient.color, PALETTE.ambient.intensity));

  const hemiLight = new HemisphereLight(0xffffff, PALETTE.hemiGround, PALETTE.hemiIntensity);
  hemiLight.color.setRGB(...PALETTE.hemiSky.gold);
  scene.add(hemiLight);

  const sunLight = new DirectionalLight(PALETTE.sun.color, PALETTE.sun.intensity);
  sunLight.position.set(12, 20, -10);
  sunLight.castShadow = config.shadowsEnabled;
  const size = Math.max(256, config.shadowMapSize || 1024);
  sunLight.shadow.mapSize.set(size, size);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 50;
  sunLight.shadow.camera.left = -12;
  sunLight.shadow.camera.right = 12;
  sunLight.shadow.camera.top = 12;
  sunLight.shadow.camera.bottom = -6;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  const fillLight = new DirectionalLight(PALETTE.fill.color, PALETTE.fill.intensity);
  fillLight.position.set(-8, 10, 8);
  scene.add(fillLight);

  const P = PALETTE.point;
  const goldLight = point(P.gold.color, P.gold.base, P.gold.distance);
  goldLight.position.set(0, 2.5, 3);
  goldLight.castShadow = config.shadowsEnabled;
  scene.add(goldLight);

  const purpleLight = point(P.purple.color, P.purple.base, P.purple.distance);
  purpleLight.position.set(0, 2.5, -3);
  scene.add(purpleLight);

  const pillarLight1 = point(P.pillar.color, P.pillar.base, P.pillar.distance);
  pillarLight1.position.set(5, 3, 0);
  scene.add(pillarLight1);

  const pillarLight2 = point(P.pillar.color, P.pillar.base, P.pillar.distance);
  pillarLight2.position.set(-5, 3, 0);
  scene.add(pillarLight2);

  const groundGlow = point(P.ground.color, P.ground.base, P.ground.distance);
  groundGlow.position.set(0, 0.1, 0);
  scene.add(groundGlow);

  return { goldLight, purpleLight, groundGlow, pillarLight1, pillarLight2, hemiLight, sunLight };
}
