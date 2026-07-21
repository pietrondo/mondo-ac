import * as THREE from 'three';
import { BiomeType } from './biomeMap';
import type { MonsterVariant } from './monsterVariant';

export interface SpawnConfig {
  minDistanceFromPlayer: number;
  maxDistanceFromPlayer: number;
  densityPerChunk: number;
}

export interface MonsterSpawnPoint {
  position: THREE.Vector3;
  biome: BiomeType;
  difficulty: number;
}

const BIOME_SPAWN_CONFIGS: Record<BiomeType, SpawnConfig> = {
  [BiomeType.COAST]: { minDistanceFromPlayer: 30, maxDistanceFromPlayer: 120, densityPerChunk: 1 },
  [BiomeType.PLAINS]: { minDistanceFromPlayer: 25, maxDistanceFromPlayer: 150, densityPerChunk: 2 },
  [BiomeType.FOREST]: { minDistanceFromPlayer: 20, maxDistanceFromPlayer: 100, densityPerChunk: 4 },
  [BiomeType.DESERT]: { minDistanceFromPlayer: 35, maxDistanceFromPlayer: 180, densityPerChunk: 3 },
  [BiomeType.MOUNTAIN]: { minDistanceFromPlayer: 40, maxDistanceFromPlayer: 200, densityPerChunk: 3 },
  [BiomeType.SNOW]: { minDistanceFromPlayer: 45, maxDistanceFromPlayer: 220, densityPerChunk: 2 },
};

const BIOME_VARIANT_WEIGHTS: Record<BiomeType, { variant: MonsterVariant; weight: number }[]> = {
  [BiomeType.COAST]: [
    { variant: 'crawler', weight: 0.35 },
    { variant: 'drone', weight: 0.25 },
    { variant: 'phantom', weight: 0.2 },
    { variant: 'scout', weight: 0.2 },
  ],
  [BiomeType.PLAINS]: [
    { variant: 'scout', weight: 0.25 },
    { variant: 'barbone', weight: 0.25 },
    { variant: 'punk', weight: 0.2 },
    { variant: 'stalker', weight: 0.15 },
    { variant: 'phantom', weight: 0.15 },
  ],
  [BiomeType.FOREST]: [
    { variant: 'barbone', weight: 0.3 },
    { variant: 'punk', weight: 0.25 },
    { variant: 'stalker', weight: 0.25 },
    { variant: 'phantom', weight: 0.2 },
  ],
  [BiomeType.DESERT]: [
    { variant: 'golem', weight: 0.25 },
    { variant: 'titan', weight: 0.25 },
    { variant: 'brute', weight: 0.2 },
    { variant: 'barbone', weight: 0.15 },
    { variant: 'sentinel', weight: 0.15 },
  ],
  [BiomeType.MOUNTAIN]: [
    { variant: 'golem', weight: 0.25 },
    { variant: 'titan', weight: 0.25 },
    { variant: 'barbone', weight: 0.2 },
    { variant: 'punk', weight: 0.15 },
    { variant: 'sentinel', weight: 0.15 },
  ],
  [BiomeType.SNOW]: [
    { variant: 'titan', weight: 0.25 },
    { variant: 'golem', weight: 0.25 },
    { variant: 'sentinel', weight: 0.25 },
    { variant: 'annihilator', weight: 0.15 },
    { variant: 'brute', weight: 0.1 },
  ],
};

export function selectMonsterVariantForBiome(biome: BiomeType, rng: () => number): MonsterVariant {
  const weights = BIOME_VARIANT_WEIGHTS[biome];
  const roll = rng();
  let cumulative = 0;
  for (const entry of weights) {
    cumulative += entry.weight;
    if (roll < cumulative) return entry.variant;
  }
  return weights[weights.length - 1].variant;
}

export function selectMonsterSpawns(
  candidates: THREE.Vector3[],
  anchor: THREE.Vector3,
  limit: number,
  maxDistance = 240,
  minDistance = 20
): THREE.Vector3[] {
  const filtered = candidates.filter((pos) => {
    const dist = pos.distanceTo(anchor);
    return dist >= minDistance && dist <= maxDistance;
  });

  const sorted = filtered.sort(
    (a, b) => a.distanceToSquared(anchor) - b.distanceToSquared(anchor)
  );

  const selected = sorted.slice(0, limit).map((position) => position.clone());

  if (selected.length > 0) {
    return selected;
  }

  const fallbackCount = Math.max(4, Math.min(limit, 6));
  const radius = Math.max(minDistance + 20, 35);
  const fallback: THREE.Vector3[] = [];

  for (let i = 0; i < fallbackCount; i++) {
    const angle = (i / fallbackCount) * Math.PI * 2;
    fallback.push(
      new THREE.Vector3(
        anchor.x + Math.cos(angle) * radius,
        anchor.y,
        anchor.z + Math.sin(angle) * radius
      )
    );
  }

  return fallback;
}

export function selectMonsterSpawnPoints(
  candidates: MonsterSpawnPoint[],
  anchor: THREE.Vector3,
  limit: number,
  maxDistance = 240,
  minDistance = 20
): MonsterSpawnPoint[] {
  const filtered = candidates.filter((sp) => {
    const dist = sp.position.distanceTo(anchor);
    return dist >= minDistance && dist <= maxDistance;
  });

  const sorted = filtered.sort(
    (a, b) => a.position.distanceToSquared(anchor) - b.position.distanceToSquared(anchor)
  );

  const selected = sorted.slice(0, limit).map((sp) => ({
    position: sp.position.clone(),
    biome: sp.biome,
    difficulty: sp.difficulty,
  }));

  if (selected.length > 0) {
    return selected;
  }

  const fallbackCount = Math.max(4, Math.min(limit, 6));
  const radius = Math.max(minDistance + 20, 80);
  const fallback: MonsterSpawnPoint[] = [];

  for (let i = 0; i < fallbackCount; i++) {
    const angle = (i / fallbackCount) * Math.PI * 2;
    fallback.push({
      position: new THREE.Vector3(
        anchor.x + Math.cos(angle) * radius,
        anchor.y,
        anchor.z + Math.sin(angle) * radius
      ),
      biome: BiomeType.PLAINS,
      difficulty: 1,
    });
  }

  return fallback;
}

export function getSpawnConfigForBiome(biome: BiomeType): SpawnConfig {
  return BIOME_SPAWN_CONFIGS[biome];
}

export function calculateDifficultyMultiplier(distanceFromOrigin: number): number {
  const maxDist = 1000;
  const normalized = Math.min(distanceFromOrigin / maxDist, 1);
  return 1 + normalized * 2;
}
