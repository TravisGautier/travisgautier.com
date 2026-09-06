import { BoxGeometry, CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, RingGeometry, Scene, TorusGeometry } from 'three';
import type { TierConfig } from '../../quality';
import { PALETTE } from '../palette';

export const PILLAR_RADIUS = 5.2;

export interface Temple {
  pillars: Group[];
}

export function createTemple(scene: Scene, config: Pick<TierConfig, 'pillarCount' | 'pillarFluting'>): Temple {
  const marbleWhite = new MeshStandardMaterial({ color: PALETTE.marbleWhite, metalness: 0.02, roughness: 0.45 });
  const marbleCream = new MeshStandardMaterial({ color: PALETTE.marbleCream, metalness: 0.02, roughness: 0.55 });
  const marbleWarm = new MeshStandardMaterial({ color: PALETTE.marbleWarm, metalness: 0.05, roughness: 0.5 });
  const stoneFloor = new MeshStandardMaterial({ color: PALETTE.stoneFloor, metalness: 0.02, roughness: 0.7 });
  const stoneStep = new MeshStandardMaterial({ color: PALETTE.stoneStep, metalness: 0.02, roughness: 0.75 });
  const ringMat = new MeshStandardMaterial({ color: PALETTE.floorRing, metalness: 0.15, roughness: 0.45, side: DoubleSide });

  const floor = new Mesh(new CylinderGeometry(6, 6.2, 0.3, 64), stoneFloor);
  floor.position.y = -0.15;
  floor.receiveShadow = true;
  scene.add(floor);

  const steps: Array<[number, number, number, number, MeshStandardMaterial]> = [
    [6.8, 7.0, 0.2, -0.4, stoneStep],
    [7.4, 7.6, 0.2, -0.6, stoneFloor],
    [8.0, 8.3, 0.25, -0.85, stoneStep],
  ];
  for (const [rt, rb, h, y, mat] of steps) {
    const step = new Mesh(new CylinderGeometry(rt, rb, h, 64), mat);
    step.position.y = y;
    step.receiveShadow = true;
    scene.add(step);
  }

  for (const [inner, outer] of [[2.8, 3.0], [1.5, 1.55]] as const) {
    const ring = new Mesh(new RingGeometry(inner, outer, 64), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);
  }

  const pillarCount = Math.max(0, config.pillarCount);
  const baseGeo = new BoxGeometry(0.6, 0.3, 0.6);
  const shaftGeo = new CylinderGeometry(0.17, 0.22, 3.8, 20);
  const fluteGeo = config.pillarFluting ? new CylinderGeometry(0.018, 0.024, 3.7, 4) : null;
  const echinusGeo = new CylinderGeometry(0.28, 0.17, 0.15, 16);
  const abacusGeo = new BoxGeometry(0.6, 0.1, 0.6);
  const pillars: Group[] = [];

  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2;
    const group = new Group();
    group.position.set(Math.cos(angle) * PILLAR_RADIUS, 0, Math.sin(angle) * PILLAR_RADIUS);

    const base = new Mesh(baseGeo, marbleCream);
    base.position.y = 0.15;
    base.castShadow = base.receiveShadow = true;
    group.add(base);

    const shaft = new Mesh(shaftGeo, marbleWhite);
    shaft.position.y = 2.2;
    shaft.castShadow = shaft.receiveShadow = true;
    group.add(shaft);

    if (fluteGeo) {
      for (let f = 0; f < 8; f++) {
        const a = (f / 8) * Math.PI * 2;
        const flute = new Mesh(fluteGeo, marbleWarm);
        flute.position.set(Math.cos(a) * 0.19, 2.2, Math.sin(a) * 0.19);
        group.add(flute);
      }
    }

    const echinus = new Mesh(echinusGeo, marbleCream);
    echinus.position.y = 4.15;
    group.add(echinus);
    const abacus = new Mesh(abacusGeo, marbleWhite);
    abacus.position.y = 4.28;
    group.add(abacus);

    group.name = 'pillar';
    scene.add(group);
    pillars.push(group);
  }

  const architrave = new Mesh(new TorusGeometry(PILLAR_RADIUS, 0.14, 8, 64), marbleCream);
  architrave.rotation.x = Math.PI / 2;
  architrave.position.y = 4.38;
  scene.add(architrave);

  return { pillars };
}
