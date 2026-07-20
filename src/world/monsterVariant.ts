import * as THREE from 'three';
import { BiomeMap } from './biomeMap';
import { WORLD_SCALE } from '../config';

export type MonsterVariant = 'scout' | 'brute' | 'stalker' | 'golem' | 'crawler' | 'drone' | 'sentinel' | 'annihilator' | 'phantom' | 'titan' | 'barbone' | 'punk';

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
  barbone: {
    scale: 1.25,
    bodyWidth: 1.2,
    bodyHeight: 1.4,
    bodyDepth: 1.1,
    hp: 95,
    speed: 3.2,
    bodyColor: 0x4E342E,
    eyeColor: 0xFFAB00,
  },
  punk: {
    scale: 0.95,
    bodyWidth: 0.9,
    bodyHeight: 1.2,
    bodyDepth: 0.8,
    hp: 55,
    speed: 4.8,
    bodyColor: 0x880E4F,
    eyeColor: 0x00E5FF,
  },
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
  sentinel: {
    scale: 1.1,
    bodyWidth: 0.9,
    bodyHeight: 1.3,
    bodyDepth: 0.9,
    hp: 65,
    speed: 2.8,
    bodyColor: 0x00ACC1,
    eyeColor: 0x84FFFF,
  },
  annihilator: {
    scale: 1.4,
    bodyWidth: 1.5,
    bodyHeight: 1.5,
    bodyDepth: 1.5,
    hp: 200,
    speed: 1.2,
    bodyColor: 0x37474F,
    eyeColor: 0xFF6D00,
  },
  phantom: {
    scale: 0.9,
    bodyWidth: 0.7,
    bodyHeight: 1.4,
    bodyDepth: 0.6,
    hp: 45,
    speed: 5.2,
    bodyColor: 0x4A148C,
    eyeColor: 0xEA80FC,
  },
  titan: {
    scale: 2.2,
    bodyWidth: 2.2,
    bodyHeight: 2.4,
    bodyDepth: 2.0,
    hp: 350,
    speed: 1.0,
    bodyColor: 0x212121,
    eyeColor: 0xFF1744,
  },
};

import { selectMonsterVariantForBiome } from './spawnSelection';

export function chooseMonsterVariant(
  position: THREE.Vector3,
  index = 0,
  biomeMap?: BiomeMap
): MonsterVariant {
  if (biomeMap) {
    const hx = (position.x / WORLD_SCALE) + 128;
    const hz = (position.z / WORLD_SCALE) + 128;
    const biome = biomeMap.getBiome(hx, hz);
    const rng = () => {
      const raw = Math.abs(Math.floor(position.x * 17 + position.z * 31 + position.y * 11 + index * 13));
      return (raw % 1000) / 1000;
    };
    return selectMonsterVariantForBiome(biome, rng);
  }
  const raw = Math.abs(
    Math.floor(position.x * 17 + position.z * 31 + position.y * 11 + index * 13)
  );
  const variants: MonsterVariant[] = ['scout', 'brute', 'stalker', 'crawler', 'drone', 'sentinel', 'annihilator', 'phantom', 'titan'];
  return variants[raw % variants.length];
}

export function getMonsterVariantProfile(variant: MonsterVariant): MonsterVariantProfile {
  return variantProfiles[variant];
}
