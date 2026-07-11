// Mulberry32 PRNG - deterministic and seeded
export class RNG {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed >>> 0;
  }

  // Returns float [0, 1)
  next(): number {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns int [min, max)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min) + min);
  }

  // Returns float [min, max)
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  clone(): RNG {
    const r = new RNG(0);
    r.state = this.state;
    return r;
  }
}

export const defaultSeed = 12345;
