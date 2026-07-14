import * as THREE from 'three';

export interface Damageable {
  takeDamage(amount: number): void;
}

function findDamageableAncestor(object?: THREE.Object3D): Damageable | undefined {
  let current: THREE.Object3D | null | undefined = object;

  while (current) {
    const damageable = current.userData.damageable as Damageable | undefined;
    if (damageable) return damageable;
    current = current.parent;
  }

  return undefined;
}

export function applyRifleHitDamage(
  hit: THREE.Intersection<THREE.Object3D> | undefined,
  damage = 25
): boolean {
  const damageable = hit ? findDamageableAncestor(hit.object) : undefined;
  if (!damageable) return false;

  damageable.takeDamage(damage);
  return true;
}
