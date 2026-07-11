import { SimplexNoise, fbm2D } from '../utils/noise';
import {
  WORLD_SIZE,
  WORLD_HEIGHT_MIN,
  WORLD_HEIGHT_MAX,
  HEIGHTMAP_OCTAVES,
  HEIGHTMAP_PERSISTENCE,
  HEIGHTMAP_LACUNARITY,
  HEIGHTMAP_FREQUENCY
} from '../config';

export class HeightMap {
  private data: Float32Array;
  private noise: SimplexNoise;

  constructor(seed: number) {
    this.data = new Float32Array(WORLD_SIZE * WORLD_SIZE);
    this.noise = new SimplexNoise(seed);
    this.generate();
  }

  private generate(): void {
    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        const nx = x * HEIGHTMAP_FREQUENCY;
        const nz = z * HEIGHTMAP_FREQUENCY;

        let height = fbm2D(
          this.noise, nx, nz,
          HEIGHTMAP_OCTAVES,
          HEIGHTMAP_PERSISTENCE,
          HEIGHTMAP_LACUNARITY
        );

        // Normalize from [-1, 1] to [0, 1]
        height = (height + 1) * 0.5;

        // Map to world height
        height = WORLD_HEIGHT_MIN + height * (WORLD_HEIGHT_MAX - WORLD_HEIGHT_MIN);

        this.data[z * WORLD_SIZE + x] = height;
      }
    }
  }

  get(x: number, z: number): number {
    const ix = Math.floor(Math.max(0, Math.min(WORLD_SIZE - 1, x)));
    const iz = Math.floor(Math.max(0, Math.min(WORLD_SIZE - 1, z)));
    return this.data[iz * WORLD_SIZE + ix];
  }

  // Bilinear interpolation for smooth values
  getInterpolated(x: number, z: number): number {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const x1 = Math.min(x0 + 1, WORLD_SIZE - 1);
    const z1 = Math.min(z0 + 1, WORLD_SIZE - 1);

    const tx = x - x0;
    const tz = z - z0;

    const h00 = this.get(x0, z0);
    const h10 = this.get(x1, z0);
    const h01 = this.get(x0, z1);
    const h11 = this.get(x1, z1);

    return h00 * (1 - tx) * (1 - tz) +
           h10 * tx * (1 - tz) +
           h01 * (1 - tx) * tz +
           h11 * tx * tz;
  }

  // Expose raw data for serialization/tests
  getData(): Float32Array {
    return this.data;
  }
}
