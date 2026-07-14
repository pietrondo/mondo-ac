import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Monster } from '../../src/entities/Monster';
import { chooseMonsterVariant } from '../../src/world/monsterVariant';

describe('chooseMonsterVariant', () => {
  it('returns the same variant for the same position every time', () => {
    const position = new THREE.Vector3(18, 0, -42);

    expect(chooseMonsterVariant(position)).toBe(chooseMonsterVariant(position));
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
});
