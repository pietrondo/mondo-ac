import { HeightMap } from './heightmap';
import { SimplexNoise } from '../utils/noise';
import { WATER_LEVEL, PLAIN_LEVEL, MOUNTAIN_LEVEL, MOISTURE_FREQUENCY } from '../config';

export enum BiomeType {
  COAST = 'coast',
  PLAINS = 'plains',
  FOREST = 'forest',
  DESERT = 'desert',
  MOUNTAIN = 'mountain',
  SNOW = 'snow'
}

export class BiomeMap {
  private moistureNoise: SimplexNoise;
  private heightMap: HeightMap;

  constructor(heightMap: HeightMap, moistureSeed: number) {
    this.heightMap = heightMap;
    this.moistureNoise = new SimplexNoise(moistureSeed);
  }

  getMoisture(x: number, z: number): number {
    return (this.moistureNoise.noise2D(x * MOISTURE_FREQUENCY, z * MOISTURE_FREQUENCY) + 1) * 0.5;
  }

  getElevation(x: number, z: number): number {
    return this.heightMap.get(x, z);
  }

  getBiome(x: number, z: number): BiomeType {
    const elevation = this.getElevation(x, z);
    const moisture = this.getMoisture(x, z);

    if (elevation < WATER_LEVEL) {
      return BiomeType.COAST;
    }
    if (elevation >= MOUNTAIN_LEVEL) {
      return BiomeType.SNOW;
    }
    if (elevation >= PLAIN_LEVEL) {
      return BiomeType.MOUNTAIN;
    }
    if (moisture > 0.7) {
      return BiomeType.FOREST;
    }
    if (moisture < 0.3) {
      return BiomeType.DESERT;
    }
    return BiomeType.PLAINS;
  }
}
