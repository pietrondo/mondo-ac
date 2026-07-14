import { describe, it, expect } from 'vitest';
import { BiomeMap, BiomeType } from '../../src/world/biomeMap';
import { HeightMap } from '../../src/world/heightmap';

describe('BiomeMap', () => {
  it('returns valid biome types', () => {
    const heightMap = new HeightMap(42);
    const biomeMap = new BiomeMap(heightMap, 43);

    for (let x = 0; x < 256; x += 10) {
      for (let z = 0; z < 256; z += 10) {
        const biome = biomeMap.getBiome(x, z);
        expect(Object.values(BiomeType)).toContain(biome);
      }
    }
  });

  it('moisture is in [0, 1]', () => {
    const heightMap = new HeightMap(42);
    const biomeMap = new BiomeMap(heightMap, 43);

    for (let x = 0; x < 100; x++) {
      for (let z = 0; z < 100; z++) {
        const m = biomeMap.getMoisture(x, z);
        expect(m).toBeGreaterThanOrEqual(0);
        expect(m).toBeLessThanOrEqual(1);
      }
    }
  });

  it('coast at low elevation', () => {
    const heightMap = new HeightMap(42);
    const biomeMap = new BiomeMap(heightMap, 43);

    let found = false;
    for (let x = 0; x < 256 && !found; x++) {
      for (let z = 0; z < 256 && !found; z++) {
        if (heightMap.get(x, z) < 20) {
          const biome = biomeMap.getBiome(x, z);
          expect([
            BiomeType.COAST,
            BiomeType.PLAINS,
            BiomeType.FOREST,
            BiomeType.DESERT
          ]).toContain(biome);
          found = true;
        }
      }
    }
    expect(found).toBe(true);
  });

  it('snow at high elevation', () => {
    const heightMap = new HeightMap(42);
    const biomeMap = new BiomeMap(heightMap, 43);

    let found = false;
    for (let x = 0; x < 256 && !found; x++) {
      for (let z = 0; z < 256 && !found; z++) {
        if (heightMap.get(x, z) > 50) {
          expect(biomeMap.getBiome(x, z)).toBe(BiomeType.SNOW);
          found = true;
        }
      }
    }
    expect(found).toBe(true);
  });
});
