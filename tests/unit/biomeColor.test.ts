import { describe, it, expect } from 'vitest';
import { BiomeType } from '../../src/world/biomeMap';
import { biomeToColor } from '../../src/world/biomeColor';

describe('biomeToColor', () => {
  it('returns the correct hex for each known biome', () => {
    expect(biomeToColor(BiomeType.COAST).getHexString()).toBe('e8dcc4');
    expect(biomeToColor(BiomeType.PLAINS).getHexString()).toBe('8bc34a');
    expect(biomeToColor(BiomeType.FOREST).getHexString()).toBe('558b2f');
    expect(biomeToColor(BiomeType.DESERT).getHexString()).toBe('e6d690');
    expect(biomeToColor(BiomeType.MOUNTAIN).getHexString()).toBe('9e9e9e');
    expect(biomeToColor(BiomeType.SNOW).getHexString()).toBe('fafafa');
  });

  it('returns a fallback grey for unknown biomes', () => {
    expect(biomeToColor('unknown_biome' as BiomeType).getHexString()).toBe('888888');
  });

  it('returns a new THREE.Color instance each call (no shared mutable state)', () => {
    const a = biomeToColor(BiomeType.FOREST);
    const b = biomeToColor(BiomeType.FOREST);
    expect(a).not.toBe(b);
    a.set('#000000');
    expect(b.getHexString()).toBe('558b2f');
  });
});
