import { BoxGeometry, FrontSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from 'three';
import { portalGoldFrag, portalPurpleFrag, portalVert } from '../../shaders/portal';
import { PALETTE } from '../palette';

export interface Portal {
  portalGroup: Group;
  portalMatA: ShaderMaterial;
  portalMatB: ShaderMaterial;
  edgeMat: MeshStandardMaterial;
  surfA: Mesh;
  surfB: Mesh;
}

export function createPortal(scene: Scene): Portal {
  const frameMat = new MeshStandardMaterial({ color: PALETTE.frame, metalness: 0.85, roughness: 0.2, emissive: PALETTE.frameEmissive, emissiveIntensity: 0.1 });
  const edgeMat = new MeshStandardMaterial({ color: PALETTE.trim, metalness: 0.95, roughness: 0.12, emissive: PALETTE.trim, emissiveIntensity: 0.1 });

  const portalGroup = new Group();
  portalGroup.position.y = 1.0;

  const W = 1.1, H = 1.5, D = 0.12, T = 0.1;

  const gatePillar = (x: number) => {
    const g = new Mesh(new BoxGeometry(T, H * 2 + T, D), frameMat);
    g.position.set(x, 0, 0);
    g.castShadow = true;
    portalGroup.add(g);
    const b = new Mesh(new BoxGeometry(T * 1.6, T * 0.5, D * 1.4), frameMat);
    b.position.set(x, -H - T * 0.5, 0);
    portalGroup.add(b);
  };
  gatePillar(-W - T / 2);
  gatePillar(W + T / 2);

  const kasagiW = W * 2 + T * 2 + 0.4;
  const bars: Array<[number, number, number, number]> = [
    [kasagiW, T * 1.3, D + 0.06, H + T * 0.65],
    [kasagiW + 0.12, T * 0.35, D + 0.1, H + T * 1.3],
    [W * 2 + T * 2 + 0.1, T * 0.45, D * 0.6, H - T * 0.6],
    [kasagiW, T * 0.4, D + 0.06, -H - T * 0.2],
  ];
  bars.forEach(([w, h, d, y], i) => {
    const m = new Mesh(new BoxGeometry(w, h, d), frameMat);
    m.position.set(0, y, 0);
    if (i === 0) m.castShadow = true;
    portalGroup.add(m);
  });

  const tw = 0.006;
  const tvG = new BoxGeometry(tw, H * 2, D + 0.01);
  const thG = new BoxGeometry(W * 2, tw, D + 0.01);
  for (const [geo, x, y] of [[tvG, -W, 0], [tvG, W, 0], [thG, 0, H], [thG, 0, -H]] as const) {
    const t = new Mesh(geo, edgeMat);
    t.position.set(x, y, 0);
    portalGroup.add(t);
  }
  const oTr = new Mesh(new BoxGeometry(kasagiW + 0.14, tw * 2, D + 0.12), edgeMat);
  oTr.position.set(0, H + T * 1.48, 0);
  portalGroup.add(oTr);

  const surfGeo = new PlaneGeometry(W * 2, H * 2);
  const makeSurface = (frag: string) =>
    new ShaderMaterial({
      transparent: true,
      side: FrontSide,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uMouse: { value: new Vector2() }, uHover: { value: 0 } },
      vertexShader: portalVert,
      fragmentShader: frag,
    });

  const portalMatA = makeSurface(portalGoldFrag);
  const surfA = new Mesh(surfGeo, portalMatA);
  surfA.position.z = 0.001;
  surfA.name = 'portal-gold';
  portalGroup.add(surfA);

  const portalMatB = makeSurface(portalPurpleFrag);
  const surfB = new Mesh(surfGeo, portalMatB);
  surfB.rotation.y = Math.PI;
  surfB.position.z = -0.001;
  surfB.name = 'portal-purple';
  portalGroup.add(surfB);

  scene.add(portalGroup);
  return { portalGroup, portalMatA, portalMatB, edgeMat, surfA, surfB };
}
