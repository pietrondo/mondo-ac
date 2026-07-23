import * as THREE from 'three';

const SHARED_MATERIALS = new WeakSet<THREE.Material>();

export function disposeObject3D(root: THREE.Object3D, opts?: { keepSharedMaterials?: boolean }): void {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
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
  if (opts?.keepSharedMaterials && SHARED_MATERIALS.has(material)) return;
  const mats = material as THREE.Material & { map?: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture; emissiveMap?: THREE.Texture };
  for (const key of ['map', 'normalMap', 'roughnessMap', 'emissiveMap'] as const) {
    mats[key]?.dispose();
  }
  material.dispose();
}

export function markSharedMaterial(material: THREE.Material): void {
  SHARED_MATERIALS.add(material);
}
