import * as THREE from 'three';

const SHARED_MATERIALS = new WeakSet<THREE.Material>();
const SHARED_GEOMETRIES = new WeakSet<THREE.BufferGeometry>();

const disposeStats = {
  disposeCalls: 0,
  geometriesDisposed: 0,
  materialsDisposed: 0,
  texturesDisposed: 0,
  sharedGeometriesSkipped: 0,
  sharedMaterialsSkipped: 0,
};

export function getDisposeStats() {
  return { ...disposeStats };
}

export function resetDisposeStats(): void {
  disposeStats.disposeCalls = 0;
  disposeStats.geometriesDisposed = 0;
  disposeStats.materialsDisposed = 0;
  disposeStats.texturesDisposed = 0;
  disposeStats.sharedGeometriesSkipped = 0;
  disposeStats.sharedMaterialsSkipped = 0;
}

export function disposeObject3D(root: THREE.Object3D, opts?: { keepSharedMaterials?: boolean }): void {
  disposeStats.disposeCalls++;
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (SHARED_GEOMETRIES.has(mesh.geometry)) {
        disposeStats.sharedGeometriesSkipped++;
      } else {
        mesh.geometry?.dispose();
        disposeStats.geometriesDisposed++;
      }
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        for (const m of mat) disposeMaterial(m, opts);
      } else if (mat) {
        disposeMaterial(mat, opts);
      }
    }
  });
}

function disposeMaterial(material: THREE.Material, opts?: { keepSharedMaterials?: boolean }): void {
  const isShared = SHARED_MATERIALS.has(material) || opts?.keepSharedMaterials === true;
  if (isShared) {
    disposeStats.sharedMaterialsSkipped++;
    return;
  }
  const mats = material as THREE.Material & { map?: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture; emissiveMap?: THREE.Texture };
  for (const key of ['map', 'normalMap', 'roughnessMap', 'emissiveMap'] as const) {
    if (mats[key]) {
      mats[key]!.dispose();
      disposeStats.texturesDisposed++;
    }
  }
  material.dispose();
  disposeStats.materialsDisposed++;
}

export function markSharedMaterial(material: THREE.Material): void {
  SHARED_MATERIALS.add(material);
}

export function markSharedGeometry(geometry: THREE.BufferGeometry): void {
  SHARED_GEOMETRIES.add(geometry);
}
