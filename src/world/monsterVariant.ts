import * as THREE from 'three';

export type MonsterVariant = 'scout' | 'brute' | 'stalker';

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
};

export function chooseMonsterVariant(position: THREE.Vector3, index = 0): MonsterVariant {
  const raw = Math.abs(
    Math.floor(position.x * 17 + position.z * 31 + position.y * 11 + index * 13)
  );
  const variants: MonsterVariant[] = ['scout', 'brute', 'stalker'];
  return variants[raw % variants.length];
}

export function getMonsterVariantProfile(variant: MonsterVariant): MonsterVariantProfile {
  return variantProfiles[variant];
}
