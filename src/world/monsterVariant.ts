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
  fresnelColor: number;
  fresnelIntensity: number;
  torsoType: 'Box' | 'Capsule' | 'Dodecahedron' | 'Icosahedron' | 'Cylinder' | 'Torus';
  headType: 'Box' | 'Capsule' | 'Dodecahedron' | 'Icosahedron' | 'Cylinder' | 'Torus' | 'Sphere';
  limbType: 'Box' | 'Capsule' | 'Cylinder';
  accentType: 'None' | 'Box' | 'Torus' | 'Cylinder' | 'Capsule';
}

const variantProfiles: Record<MonsterVariant, MonsterVariantProfile> = {
  barbone: {
    scale: 1.25, bodyWidth: 1.2, bodyHeight: 1.4, bodyDepth: 1.1,
    hp: 95, speed: 3.2, bodyColor: 0x4E342E, eyeColor: 0xFFAB00,
    fresnelColor: 0xFFD54F, fresnelIntensity: 1.5,
    torsoType: 'Capsule', headType: 'Dodecahedron', limbType: 'Cylinder', accentType: 'Torus',
  },
  punk: {
    scale: 0.95, bodyWidth: 0.9, bodyHeight: 1.2, bodyDepth: 0.8,
    hp: 55, speed: 4.8, bodyColor: 0x880E4F, eyeColor: 0x00E5FF,
    fresnelColor: 0x00E5FF, fresnelIntensity: 2.0,
    torsoType: 'Cylinder', headType: 'Icosahedron', limbType: 'Capsule', accentType: 'Box',
  },
  scout: {
    scale: 0.86, bodyWidth: 0.8, bodyHeight: 1.0, bodyDepth: 0.8,
    hp: 30, speed: 4.6, bodyColor: 0x4caf50, eyeColor: 0xb2ff59,
    fresnelColor: 0xb2ff59, fresnelIntensity: 1.0,
    torsoType: 'Box', headType: 'Box', limbType: 'Box', accentType: 'None',
  },
  brute: {
    scale: 1.18, bodyWidth: 1.35, bodyHeight: 1.35, bodyDepth: 1.4,
    hp: 85, speed: 2.3, bodyColor: 0xd32f2f, eyeColor: 0xffd54f,
    fresnelColor: 0xffd54f, fresnelIntensity: 1.5,
    torsoType: 'Dodecahedron', headType: 'Box', limbType: 'Cylinder', accentType: 'Capsule',
  },
  stalker: {
    scale: 1.0, bodyWidth: 1.0, bodyHeight: 1.1, bodyDepth: 0.7,
    hp: 50, speed: 3.6, bodyColor: 0x7b1fa2, eyeColor: 0x80deea,
    fresnelColor: 0x80deea, fresnelIntensity: 2.0,
    torsoType: 'Capsule', headType: 'Icosahedron', limbType: 'Capsule', accentType: 'None',
  },
  golem: {
    scale: 1.6, bodyWidth: 1.6, bodyHeight: 1.8, bodyDepth: 1.6,
    hp: 150, speed: 1.5, bodyColor: 0x607D8B, eyeColor: 0x00E5FF,
    fresnelColor: 0x00E5FF, fresnelIntensity: 1.2,
    torsoType: 'Box', headType: 'Dodecahedron', limbType: 'Box', accentType: 'Box',
  },
  crawler: {
    scale: 0.8, bodyWidth: 1.0, bodyHeight: 0.5, bodyDepth: 1.0,
    hp: 50, speed: 4.0, bodyColor: 0xd32f2f, eyeColor: 0xffeb3b,
    fresnelColor: 0xffeb3b, fresnelIntensity: 1.5,
    torsoType: 'Capsule', headType: 'Sphere', limbType: 'Capsule', accentType: 'None',
  },
  drone: {
    scale: 0.6, bodyWidth: 0.8, bodyHeight: 0.8, bodyDepth: 0.8,
    hp: 40, speed: 3.0, bodyColor: 0x00bcd4, eyeColor: 0xffffff,
    fresnelColor: 0x00ffff, fresnelIntensity: 2.5,
    torsoType: 'Cylinder', headType: 'Sphere', limbType: 'Box', accentType: 'Torus',
  },
  sentinel: {
    scale: 1.1, bodyWidth: 0.9, bodyHeight: 1.3, bodyDepth: 0.9,
    hp: 65, speed: 2.8, bodyColor: 0x00ACC1, eyeColor: 0x84FFFF,
    fresnelColor: 0x84FFFF, fresnelIntensity: 2.0,
    torsoType: 'Dodecahedron', headType: 'Icosahedron', limbType: 'Capsule', accentType: 'Cylinder',
  },
  annihilator: {
    scale: 1.4, bodyWidth: 1.5, bodyHeight: 1.5, bodyDepth: 1.5,
    hp: 200, speed: 1.2, bodyColor: 0x37474F, eyeColor: 0xFF6D00,
    fresnelColor: 0xFF6D00, fresnelIntensity: 2.5,
    torsoType: 'Box', headType: 'Box', limbType: 'Cylinder', accentType: 'Box',
  },
  phantom: {
    scale: 0.9, bodyWidth: 0.7, bodyHeight: 1.4, bodyDepth: 0.6,
    hp: 45, speed: 5.2, bodyColor: 0x4A148C, eyeColor: 0xEA80FC,
    fresnelColor: 0xEA80FC, fresnelIntensity: 3.0,
    torsoType: 'Icosahedron', headType: 'Sphere', limbType: 'Capsule', accentType: 'Torus',
  },
  titan: {
    scale: 2.2, bodyWidth: 2.2, bodyHeight: 2.4, bodyDepth: 2.0,
    hp: 450, speed: 2.8, bodyColor: 0x212121, eyeColor: 0xFF1744,
    fresnelColor: 0xFF1744, fresnelIntensity: 3.0,
    torsoType: 'Dodecahedron', headType: 'Dodecahedron', limbType: 'Cylinder', accentType: 'Torus',
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
