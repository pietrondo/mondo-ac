import * as THREE from 'three';

export function createTerrainMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    metalness: 0.1,
    roughness: 0.85,
    vertexColors: true,
    flatShading: true,
    side: THREE.FrontSide
  });
}
