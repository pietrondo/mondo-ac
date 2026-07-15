import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Monster } from '../../src/entities/Monster';
import { chooseMonsterVariant, getMonsterVariantProfile } from '../../src/world/monsterVariant';

describe('chooseMonsterVariant', () => {
  it('returns the same variant for the same position every time', () => {
    const position = new THREE.Vector3(18, 0, -42);

    expect(chooseMonsterVariant(position)).toBe(chooseMonsterVariant(position));
  });

  it('chooses golem on Desert or Mountain biomes when biome map is provided', () => {
    const desertBiomeMap = {
      getBiome: () => 'desert',
    } as any;
    const mountainBiomeMap = {
      getBiome: () => 'mountain',
    } as any;
    const plainsBiomeMap = {
      getBiome: () => 'plains',
    } as any;

    const position = new THREE.Vector3(0, 0, 0);

    expect(chooseMonsterVariant(position, 0, desertBiomeMap)).toBe('golem');
    expect(chooseMonsterVariant(position, 0, mountainBiomeMap)).toBe('golem');
    expect(chooseMonsterVariant(position, 0, plainsBiomeMap)).not.toBe('golem');
  });

  it('defines the correct Golem stats in its profile', () => {
    const profile = getMonsterVariantProfile('golem');
    expect(profile.scale).toBe(1.6);
    expect(profile.bodyWidth).toBe(1.6);
    expect(profile.bodyHeight).toBe(1.8);
    expect(profile.bodyDepth).toBe(1.6);
    expect(profile.hp).toBe(150);
    expect(profile.speed).toBe(1.5);
    expect(profile.bodyColor).toBe(0x607D8B);
    expect(profile.eyeColor).toBe(0x00E5FF);
  });
});

describe('Monster variants', () => {
  it('give scouts and brutes different stats and silhouettes', () => {
    const scout = new Monster(new THREE.Vector3(0, 0, 0), { variant: 'scout' });
    const brute = new Monster(new THREE.Vector3(0, 0, 0), { variant: 'brute' });

    expect(scout.variant).toBe('scout');
    expect(brute.variant).toBe('brute');
    expect(scout.maxHp).toBeLessThan(brute.maxHp);
    expect(scout.moveSpeed).toBeGreaterThan(brute.moveSpeed);
    expect(scout.mesh.scale.x).toBeLessThan(brute.mesh.scale.x);
  });

  it('triggers the onDeath callback when HP falls to 0', () => {
    let deathTriggered = false;
    const scout = new Monster(new THREE.Vector3(0, 0, 0), {
      variant: 'scout',
      onDeath: () => {
        deathTriggered = true;
      }
    });

    expect(scout.isAlive()).toBe(true);
    scout.takeDamage(10);
    expect(deathTriggered).toBe(false);
    expect(scout.isAlive()).toBe(true);

    scout.takeDamage(25);
    expect(deathTriggered).toBe(true);
    expect(scout.isAlive()).toBe(false);
  });
});
