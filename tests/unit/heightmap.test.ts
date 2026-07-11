import { describe, it, expect } from 'vitest';
import { HeightMap } from '../../src/world/heightmap';
import { WORLD_HEIGHT_MIN, WORLD_HEIGHT_MAX, WORLD_SIZE } from '../../src/config';

describe('HeightMap', () => {
  it('produces values in configured range', () => {
    const hm = new HeightMap(42);

    for (let x = 0; x < WORLD_SIZE; x += 16) {
      for (let z = 0; z < WORLD_SIZE; z += 16) {
        const h = hm.get(x, z);
        expect(h).toBeGreaterThanOrEqual(WORLD_HEIGHT_MIN);
        expect(h).toBeLessThanOrEqual(WORLD_HEIGHT_MAX);
      }
    }
  });

  it('is deterministic', () => {
    const hm1 = new HeightMap(123);
    const hm2 = new HeightMap(123);

    for (let x = 0; x < WORLD_SIZE; x += 10) {
      for (let z = 0; z < WORLD_SIZE; z += 10) {
        expect(hm1.get(x, z)).toBe(hm2.get(x, z));
      }
    }
  });

  it('different seeds produce different maps', () => {
    const hm1 = new HeightMap(1);
    const hm2 = new HeightMap(2);

    let different = 0;
    for (let x = 0; x < WORLD_SIZE; x += 8) {
      for (let z = 0; z < WORLD_SIZE; z += 8) {
        if (hm1.get(x, z) !== hm2.get(x, z)) different++;
      }
    }
    expect(different).toBeGreaterThan(0);
  });

  it('interpolated values are smooth', () => {
    const hm = new HeightMap(42);
    const h1 = hm.getInterpolated(10.5, 20.5);
    const h2 = hm.getInterpolated(10.6, 20.5);
    const h3 = hm.getInterpolated(10.5, 20.6);

    expect(Math.abs(h1 - h2)).toBeLessThan(5);
    expect(Math.abs(h1 - h3)).toBeLessThan(5);
    expect(Math.abs(h2 - h3)).toBeLessThan(5);
  });

  it('clamps out of bounds to edge values', () => {
    const hm = new HeightMap(42);

    expect(hm.get(-1, -1)).toBe(hm.get(0, 0));
    expect(hm.get(WORLD_SIZE + 10, WORLD_SIZE + 10)).toBe(hm.get(WORLD_SIZE - 1, WORLD_SIZE - 1));
  });
});
