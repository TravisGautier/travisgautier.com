import type { Material, Object3D, Scene } from 'three';

interface Disposable {
  dispose(): void;
}

function isDisposable(x: unknown): x is Disposable {
  return !!x && typeof (x as Disposable).dispose === 'function';
}

// Frees every geometry and material reachable from the scene graph exactly
// once (shared geometries/materials are common here — pillars share shafts).
export function disposeScene(scene: Scene): number {
  const seen = new Set<Disposable>();
  scene.traverse((obj: Object3D) => {
    const mesh = obj as Object3D & { geometry?: unknown; material?: Material | Material[] };
    if (isDisposable(mesh.geometry)) seen.add(mesh.geometry);
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of mats) if (isDisposable(m)) seen.add(m);
  });
  seen.forEach((d) => d.dispose());
  scene.clear();
  return seen.size;
}
