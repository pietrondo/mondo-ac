import { describe, it, expect } from 'vitest';
import { RNG } from '../../src/utils/rng';

describe('RNG', () => {
  it('is deterministic with same seed', () => {
    const rng1 = new RNG(42);
    const rng2 = new RNG(42);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('produces values in [0, 1)', () => {
    const rng = new RNG(123);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('nextInt returns int in range', () => {
    const rng = new RNG(456);
    for (let i = 0; i < 50; i++) {
      const v = rng.nextInt(10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('clone produces same sequence', () => {
    const rng1 = new RNG(789);
    const clone = rng1.clone();

    for (let i = 0; i < 50; i++) {
      expect(rng1.next()).toBe(clone.next());
    }
  });
});
