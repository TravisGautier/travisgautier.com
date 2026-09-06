import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import { skyFrag, skyVert } from '../../shaders/sky';
import { portalVert } from '../../shaders/portal';
import { clouds1Frag, clouds2Frag } from '../../shaders/clouds';
import type { TierConfig } from '../../quality';
import { PALETTE } from '../palette';

export interface Environment {
  skyMat: ShaderMaterial;
  cloudSeaMat: ShaderMaterial | null;
  cloudSea2Mat: ShaderMaterial | null;
  particles: Points;
  particleSpeeds: Float32Array;
  particleMat: PointsMaterial;
}

export function createEnvironment(scene: Scene, config: Pick<TierConfig, 'cloudLayers' | 'particleCount' | 'skyCloudNoise'>, random: () => number = Math.random): Environment {
  const skyMat = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms: { uHold: { value: 0 }, uTime: { value: 0 }, uSkyCloudNoise: { value: config.skyCloudNoise ? 1.0 : 0.0 } },
    vertexShader: skyVert,
    fragmentShader: skyFrag,
  });
  scene.add(new Mesh(new SphereGeometry(200, 64, 32), skyMat));

  const cloudSeaGeo = new PlaneGeometry(300, 300, 1, 1);
  let cloudSeaMat: ShaderMaterial | null = null;
  let cloudSea2Mat: ShaderMaterial | null = null;

  if (config.cloudLayers >= 1) {
    cloudSeaMat = new ShaderMaterial({
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uHold: { value: 0 } },
      vertexShader: portalVert,
      fragmentShader: clouds1Frag,
    });
    const cloudSea = new Mesh(cloudSeaGeo, cloudSeaMat);
    cloudSea.rotation.x = -Math.PI / 2;
    cloudSea.position.y = -3.5;
    scene.add(cloudSea);
  }

  if (config.cloudLayers >= 2) {
    cloudSea2Mat = new ShaderMaterial({
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uHold: { value: 0 } },
      vertexShader: portalVert,
      fragmentShader: clouds2Frag,
    });
    const cloudSea2 = new Mesh(cloudSeaGeo.clone(), cloudSea2Mat);
    cloudSea2.rotation.x = -Math.PI / 2;
    cloudSea2.position.y = -5.5;
    scene.add(cloudSea2);
  }

  const mtMat = new MeshStandardMaterial({ color: PALETTE.mountain, roughness: 0.85, metalness: 0.0 });
  const mtGeo = new ConeGeometry(18, 14, 6);
  const mountains: Array<{ p: [number, number, number]; s: [number, number, number] }> = [
    { p: [-35, -12, -50], s: [1.2, 0.8, 1.4] },
    { p: [40, -14, -55], s: [1.5, 0.9, 1.2] },
    { p: [8, -15, -65], s: [2.0, 1.1, 1.5] },
    { p: [-20, -13, -60], s: [1.1, 0.7, 1.3] },
    { p: [55, -16, -70], s: [1.8, 1.0, 1.6] },
  ];
  for (const m of mountains) {
    const mt = new Mesh(mtGeo, mtMat);
    mt.position.set(...m.p);
    mt.scale.set(...m.s);
    scene.add(mt);
  }

  const snowMat = new MeshStandardMaterial({ color: PALETTE.snow, roughness: 0.6, metalness: 0.0 });
  const snowGeo = new ConeGeometry(6, 3, 6);
  const caps: Array<{ p: [number, number, number]; s: [number, number, number] }> = [
    { p: [-35, -3.8, -50], s: [1.2, 0.8, 1.4] },
    { p: [40, -5, -55], s: [1.5, 0.9, 1.2] },
    { p: [8, -5.5, -65], s: [2.0, 1.1, 1.5] },
  ];
  for (const m of caps) {
    const s = new Mesh(snowGeo, snowMat);
    s.position.set(...m.p);
    s.scale.set(...m.s);
    scene.add(s);
  }

  const count = Math.max(0, config.particleCount);
  const particleGeo = new BufferGeometry();
  const particlePos = new Float32Array(count * 3);
  const particleSpeeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    particlePos[i * 3] = (random() - 0.5) * 16;
    particlePos[i * 3 + 1] = random() * 8 - 1;
    particlePos[i * 3 + 2] = (random() - 0.5) * 16;
    particleSpeeds[i] = 0.002 + random() * 0.006;
  }
  particleGeo.setAttribute('position', new BufferAttribute(particlePos, 3));
  const particleMat = new PointsMaterial({ color: PALETTE.particle, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false });
  const particles = new Points(particleGeo, particleMat);
  particles.visible = count > 0;
  scene.add(particles);

  return { skyMat, cloudSeaMat, cloudSea2Mat, particles, particleSpeeds, particleMat };
}
