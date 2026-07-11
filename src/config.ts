import { RNG } from './utils/rng';

// World config - data-driven per spec
export const WORLD_SIZE = 256; // cells
export const WORLD_SCALE = 8; // meters per cell
export const WORLD_HEIGHT_MIN = 0;
export const WORLD_HEIGHT_MAX = 60;
export const SEED = 12345;

// Biome thresholds (in elevation units 0-60)
export const WATER_LEVEL = 0.15 * 60; // 9 meters
export const PLAIN_LEVEL = 0.4 * 60;  // 24 meters
export const MOUNTAIN_LEVEL = 0.7 * 60; // 42 meters

// FBM params for heightmap
export const HEIGHTMAP_OCTAVES = 5;
export const HEIGHTMAP_PERSISTENCE = 0.5;
export const HEIGHTMAP_LACUNARITY = 2.0;
export const HEIGHTMAP_FREQUENCY = 0.005;

// Moisture noise params
export const MOISTURE_FREQUENCY = 0.01;

export const rng = new RNG(SEED);
