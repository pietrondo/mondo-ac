import * as THREE from 'three';
import { HeightMap } from './heightmap';
import { BiomeMap, BiomeType } from './biomeMap';
import { WORLD_SIZE, WORLD_SCALE } from '../config';

const MAX_ATTEMPTS = 100;
const MIN_GRID_MARGIN = 20;
const MIN_HEIGHT_FOR_SPAWN = 14;

export function findRandomSpawnPoint(
  heightMap: HeightMap,
  biomeMap: BiomeMap,
  rng: () => number = Math.random
): THREE.Vector3 {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const hx = Math.floor(MIN_GRID_MARGIN + rng() * (WORLD_SIZE - MIN_GRID_MARGIN * 2));
    const hz = Math.floor(MIN_GRID_MARGIN + rng() * (WORLD_SIZE - MIN_GRID_MARGIN * 2));
    const h = heightMap.get(hx, hz);
    const biome = biomeMap.getBiome(hx, hz);
    if (biome !== BiomeType.COAST && h > MIN_HEIGHT_FOR_SPAWN) {
      const worldX = (hx - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldZ = (hz - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldY = heightMap.getInterpolated(hx, hz);
      return new THREE.Vector3(worldX, worldY, worldZ);
    }
  }

  const centerY = heightMap.getInterpolated(WORLD_SIZE / 2, WORLD_SIZE / 2);
  return new THREE.Vector3(0, centerY, 0);
}
