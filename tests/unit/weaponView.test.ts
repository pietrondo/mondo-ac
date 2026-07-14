import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { WeaponView } from '../../src/entities/WeaponView';

describe('WeaponView', () => {
  it('attaches a rifle model to the camera and flashes on fire', () => {
    const camera = new THREE.PerspectiveCamera();
    const weapon = new WeaponView(camera);

    expect(camera.children).toHaveLength(1);
    expect(weapon.isFlashVisible()).toBe(false);

    weapon.fire();
    expect(weapon.isFlashVisible()).toBe(true);

    weapon.update(0.2);
    expect(weapon.isFlashVisible()).toBe(false);
  });
});
