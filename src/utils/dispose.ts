import * as THREE from 'three';

const SHARED_MATERIALS = new WeakSet<THREE.Material>();
const SHARED_GEOMETRIES = new WeakSet<THREE.BufferGeometry>();

export function disposeObject3D(root: THREE.Object3D, opts?: { keepSharedMaterials?: boolean }): void {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (!SHARED_GEOMETRIES.has(mesh.geometry)) {
        mesh.geometry?.dispose();
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
  if (isShared) return;
  const mats = material as THREE.Material & { map?: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture; emissiveMap?: THREE.Texture };
  for (const key of ['map', 'normalMap', 'roughnessMap', 'emissiveMap'] as const) {
    mats[key]?.dispose();
  }
  material.dispose();
}

export function markSharedMaterial(material: THREE.Material): void {
  SHARED_MATERIALS.add(material);
}

export function markSharedGeometry(geometry: THREE.BufferGeometry): void {
  SHARED_GEOMETRIES.add(geometry);
}
