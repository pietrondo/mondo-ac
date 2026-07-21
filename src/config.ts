import { RNG } from './utils/rng';

// World config - data-driven per spec
export const WORLD_SIZE = 512; // cells (massive 512x512 grid = 4096m x 4096m)
export const WORLD_SCALE = 8; // meters per cell
export const WORLD_HEIGHT_MIN = 0;
export const WORLD_HEIGHT_MAX = 85;
export const SEED = 12345;

// Biome thresholds (in elevation units 0-85)
export const WATER_LEVEL = 12;  // 12 meters (inland lakes & oceans)
export const PLAIN_LEVEL = 28;  // 28 meters
export const MOUNTAIN_LEVEL = 48; // 48 meters (snowy alpine peaks)

// FBM params for heightmap
export const HEIGHTMAP_OCTAVES = 5;
export const HEIGHTMAP_PERSISTENCE = 0.5;
export const HEIGHTMAP_LACUNARITY = 2.0;
export const HEIGHTMAP_FREQUENCY = 0.005;

// Moisture noise params
export const MOISTURE_FREQUENCY = 0.01;

export const rng = new RNG(SEED);
