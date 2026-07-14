import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { applyRifleHitDamage } from '../../src/combat/rifleHit';

describe('applyRifleHitDamage', () => {
  it('damages the nearest damageable ancestor of a hit object', () => {
    const damageable = { takeDamage: vi.fn() };
    const parent = new THREE.Group();
    parent.userData.damageable = damageable;

    const child = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    parent.add(child);

    const applied = applyRifleHitDamage(
      { object: child } as THREE.Intersection<THREE.Object3D>,
      25
    );

    expect(applied).toBe(true);
    expect(damageable.takeDamage).toHaveBeenCalledWith(25);
  });
});
