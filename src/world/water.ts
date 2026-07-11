import * as THREE from 'three';
import { WATER_LEVEL, WORLD_SIZE, WORLD_SCALE } from '../config';

export function createWater(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(
    WORLD_SIZE * WORLD_SCALE * 1.5,
    WORLD_SIZE * WORLD_SCALE * 1.5
  );
  geometry.rotateX(-Math.PI * 0.5);

  const material = new THREE.MeshStandardMaterial({
    color: 0x4A90D9,
    transparent: true,
    opacity: 0.7,
    metalness: 0.1,
    roughness: 0.2
  });

  const water = new THREE.Mesh(geometry, material);
  water.position.y = WATER_LEVEL;
  return water;
}
