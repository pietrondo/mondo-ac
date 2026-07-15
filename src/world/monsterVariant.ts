import * as THREE from 'three';
import { BiomeMap, BiomeType } from './biomeMap';
import { WORLD_SCALE } from '../config';

export type MonsterVariant = 'scout' | 'brute' | 'stalker' | 'golem' | 'crawler' | 'drone';

export interface MonsterVariantProfile {
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
  bodyDepth: number;
  hp: number;
  speed: number;
  bodyColor: number;
  eyeColor: number;
}

const variantProfiles: Record<MonsterVariant, MonsterVariantProfile> = {
  scout: {
    scale: 0.86,
    bodyWidth: 0.8,
    bodyHeight: 1.0,
    bodyDepth: 0.8,
    hp: 30,
    speed: 4.6,
    bodyColor: 0x4caf50,
    eyeColor: 0xb2ff59,
  },
  brute: {
    scale: 1.18,
    bodyWidth: 1.35,
    bodyHeight: 1.35,
    bodyDepth: 1.4,
    hp: 85,
    speed: 2.3,
    bodyColor: 0xd32f2f,
    eyeColor: 0xffd54f,
  },
  stalker: {
    scale: 1.0,
    bodyWidth: 1.0,
    bodyHeight: 1.1,
    bodyDepth: 0.7,
    hp: 50,
    speed: 3.6,
    bodyColor: 0x7b1fa2,
    eyeColor: 0x80deea,
  },
  golem: {
    scale: 1.6,
    bodyWidth: 1.6,
    bodyHeight: 1.8,
    bodyDepth: 1.6,
    hp: 150,
    speed: 1.5,
    bodyColor: 0x607D8B,
    eyeColor: 0x00E5FF,
  },
  crawler: {
    scale: 0.8,
    bodyWidth: 1.0,
    bodyHeight: 0.5,
    bodyDepth: 1.0,
    hp: 50,
    speed: 4.0,
    bodyColor: 0xd32f2f,
    eyeColor: 0xffeb3b,
  },
  drone: {
    scale: 0.6,
    bodyWidth: 0.8,
    bodyHeight: 0.8,
    bodyDepth: 0.8,
    hp: 40,
    speed: 3.0,
    bodyColor: 0x00bcd4,
    eyeColor: 0xffffff,
  },
};

export function chooseMonsterVariant(
  position: THREE.Vector3,
  index = 0,
  biomeMap?: BiomeMap
): MonsterVariant {
  if (biomeMap) {
    const hx = (position.x / WORLD_SCALE) + 128;
    const hz = (position.z / WORLD_SCALE) + 128;
    const biome = biomeMap.getBiome(hx, hz);
    if (biome === BiomeType.MOUNTAIN || biome === BiomeType.DESERT) {
      return 'golem';
    }
  }
  const raw = Math.abs(
    Math.floor(position.x * 17 + position.z * 31 + position.y * 11 + index * 13)
  );
  const variants: MonsterVariant[] = ['scout', 'brute', 'stalker', 'crawler', 'drone'];
  return variants[raw % variants.length];
}

export function getMonsterVariantProfile(variant: MonsterVariant): MonsterVariantProfile {
  return variantProfiles[variant];
}
