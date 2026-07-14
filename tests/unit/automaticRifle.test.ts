import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { AutomaticRifle } from '../../src/entities/AutomaticRifle';

describe('AutomaticRifle', () => {
  it('fires immediately and then respects its automatic cadence while the trigger is held', () => {
    const onShot = vi.fn();
    const rifle = new AutomaticRifle({ roundsPerMinute: 600, onShot });

    rifle.update(0, { fireHeld: true, reloadPressed: false, canFire: true });
    rifle.update(0.09, { fireHeld: true, reloadPressed: false, canFire: true });
    rifle.update(0.01, { fireHeld: true, reloadPressed: false, canFire: true });

    expect(onShot).toHaveBeenCalledTimes(2);
    expect(rifle.magazineAmmo).toBe(28);
  });

  it('reloads only the missing rounds available in reserve after the reload duration', () => {
    const rifle = new AutomaticRifle({ magazineAmmo: 24, reserveAmmo: 3, reloadDuration: 1 });

    rifle.update(0, { fireHeld: false, reloadPressed: true, canFire: true });
    expect(rifle.isReloading).toBe(true);

    rifle.update(0.99, { fireHeld: false, reloadPressed: false, canFire: true });
    expect(rifle.magazineAmmo).toBe(24);

    rifle.update(0.01, { fireHeld: false, reloadPressed: false, canFire: true });
    expect(rifle.magazineAmmo).toBe(27);
    expect(rifle.reserveAmmo).toBe(0);
    expect(rifle.isReloading).toBe(false);
  });

  it('casts each valid shot from the camera center direction', () => {
    const target = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    target.position.set(0, 0, -5);
    const camera = new THREE.PerspectiveCamera();
    camera.lookAt(0, 0, -1);
    camera.updateMatrixWorld();
    const onShot = vi.fn();
    const rifle = new AutomaticRifle({ onShot });

    rifle.update(0, { fireHeld: true, reloadPressed: false, canFire: true, camera, targets: [target] });

    expect(onShot).toHaveBeenCalledWith(expect.objectContaining({ object: target }));
  });
});
