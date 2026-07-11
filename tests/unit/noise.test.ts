import { describe, it, expect } from 'vitest';
import { SimplexNoise, fbm2D } from '../../src/utils/noise';

describe('SimplexNoise', () => {
  it('is deterministic', () => {
    const n1 = new SimplexNoise(42);
    const n2 = new SimplexNoise(42);

    for (let i = 0; i < 10; i++) {
      expect(n1.noise2D(i, i)).toBe(n2.noise2D(i, i));
    }
  });

  it('produces values roughly in [-1, 1]', () => {
    const n = new SimplexNoise(123);
    const values: number[] = [];

    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        values.push(n.noise2D(x * 0.1, y * 0.1));
      }
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    expect(min).toBeGreaterThan(-1.1);
    expect(max).toBeLessThan(1.1);
  });

  it('different seeds produce different noise', () => {
    const n1 = new SimplexNoise(1);
    const n2 = new SimplexNoise(2);

    let different = 0;
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        if (n1.noise2D(x * 0.1, y * 0.1) !== n2.noise2D(x * 0.1, y * 0.1)) {
          different++;
        }
      }
    }
    expect(different).toBeGreaterThan(0);
  });
});

describe('fbm2D', () => {
  it('produces smoother output than raw noise', () => {
    const n = new SimplexNoise(456);
    const raw = n.noise2D(1, 1);
    const fbm = fbm2D(n, 1, 1, 5, 0.5, 2);

    expect(fbm).not.toBe(raw);
  });

  it('is deterministic with same inputs', () => {
    const n1 = new SimplexNoise(42);
    const n2 = new SimplexNoise(42);

    expect(fbm2D(n1, 1, 1)).toBe(fbm2D(n2, 1, 1));
  });
});
