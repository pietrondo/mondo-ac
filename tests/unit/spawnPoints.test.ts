import { describe, it, expect, vi } from 'vitest';
import { HeightMap } from '../../src/world/heightmap';
import { BiomeMap, BiomeType } from '../../src/world/biomeMap';
import { findRandomSpawnPoint } from '../../src/world/spawnPoints';

describe('findRandomSpawnPoint', () => {
  it('returns a land (non-coast) point with positive height', () => {
    const heightMap = new HeightMap(42);
    const biomeMap = new BiomeMap(heightMap, 99);
    const point = findRandomSpawnPoint(heightMap, biomeMap);
    expect(point.y).toBeGreaterThan(0);
  });

  it('honours an injected deterministic rng', () => {
    const heightMap = new HeightMap(42);
    const biomeMap = new BiomeMap(heightMap, 99);
    const rng = () => 0.5;
    const point = findRandomSpawnPoint(heightMap, biomeMap, rng);
    expect(point).toBeDefined();
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.z)).toBe(true);
  });

  it('returns the world center as fallback when no valid land is found', () => {
    const heightMap = new HeightMap(7);
    const biomeMap = new BiomeMap(heightMap, 7);
    const biomeSpy = vi.spyOn(biomeMap, 'getBiome').mockReturnValue(BiomeType.COAST);
    const hSpy = vi.spyOn(heightMap, 'get').mockReturnValue(0);
    const point = findRandomSpawnPoint(heightMap, biomeMap);
    expect(point.x).toBe(0);
    expect(point.z).toBe(0);
    biomeSpy.mockRestore();
    hSpy.mockRestore();
  });

  it('produces different points with different rng sequences', () => {
    const heightMap = new HeightMap(42);
    const biomeMap = new BiomeMap(heightMap, 99);
    let counter = 0;
    const rng1 = () => ((counter++ * 7919) % 1000) / 1000;
    const a = findRandomSpawnPoint(heightMap, biomeMap, rng1);
    counter = 0;
    const rng2 = () => ((counter++ * 6151 + 13) % 1000) / 1000;
    const b = findRandomSpawnPoint(heightMap, biomeMap, rng2);
    expect(a.x === b.x && a.z === b.z).toBe(false);
  });

  it('never selects COAST biome (water spawn invalid)', () => {
    const heightMap = new HeightMap(123);
    const biomeMap = new BiomeMap(heightMap, 456);
    for (let i = 0; i < 10; i++) {
      const point = findRandomSpawnPoint(heightMap, biomeMap, Math.random);
      const hx = Math.floor(point.x / 8 + 256);
      const hz = Math.floor(point.z / 8 + 256);
      const biome = biomeMap.getBiome(hx, hz);
      expect(biome).not.toBe(BiomeType.COAST);
    }
  });
});
