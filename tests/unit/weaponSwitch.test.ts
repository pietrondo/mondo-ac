import { describe, it, expect, vi } from 'vitest';
import { Weapon } from '../../src/entities/Weapon';
import { WeaponView } from '../../src/entities/WeaponView';
import { HUD } from '../../src/ui/hud';
import { switchWeapon } from '../../src/entities/weaponSwitch';

function makeWeapon(type: any = 'rifle', isReloading = false): Weapon {
  const w = new Weapon(type);
  w.isReloading = isReloading;
  return w;
}

function makeMocks(weapons: Weapon[]) {
  const weaponView = { setWeapon: vi.fn() } as unknown as WeaponView;
  const hud = { setWeaponState: vi.fn() } as unknown as HUD;
  return { weaponView, hud };
}

describe('switchWeapon', () => {
  it('switches to a valid index', () => {
    const weapons = [makeWeapon('rifle'), makeWeapon('shotgun')];
    const { weaponView, hud } = makeMocks(weapons);
    const result = switchWeapon({ weapons, activeIndex: 0, weaponView, hud }, 1);
    expect(result.switched).toBe(true);
    expect(result.newIndex).toBe(1);
    expect(weaponView.setWeapon).toHaveBeenCalledWith('shotgun');
    expect(hud.setWeaponState).toHaveBeenCalledOnce();
  });

  it('rejects out-of-bounds index', () => {
    const weapons = [makeWeapon('rifle')];
    const { weaponView, hud } = makeMocks(weapons);
    const result = switchWeapon({ weapons, activeIndex: 0, weaponView, hud }, 5);
    expect(result.switched).toBe(false);
    expect(weaponView.setWeapon).not.toHaveBeenCalled();
  });

  it('rejects negative index', () => {
    const weapons = [makeWeapon('rifle')];
    const { weaponView, hud } = makeMocks(weapons);
    const result = switchWeapon({ weapons, activeIndex: 0, weaponView, hud }, -1);
    expect(result.switched).toBe(false);
  });

  it('rejects switching to the same weapon', () => {
    const weapons = [makeWeapon('rifle'), makeWeapon('shotgun')];
    const { weaponView, hud } = makeMocks(weapons);
    const result = switchWeapon({ weapons, activeIndex: 1, weaponView, hud }, 1);
    expect(result.switched).toBe(false);
    expect(weaponView.setWeapon).not.toHaveBeenCalled();
  });

  it('rejects switching while current weapon is reloading', () => {
    const weapons = [makeWeapon('rifle', true), makeWeapon('shotgun')];
    const { weaponView, hud } = makeMocks(weapons);
    const result = switchWeapon({ weapons, activeIndex: 0, weaponView, hud }, 1);
    expect(result.switched).toBe(false);
    expect(weaponView.setWeapon).not.toHaveBeenCalled();
  });

  it('updates HUD with new weapon ammo state', () => {
    const weapons = [makeWeapon('rifle'), makeWeapon('shotgun')];
    const target = weapons[1];
    target.magazineAmmo = 6;
    target.reserveAmmo = 12;
    target.isReloading = false;
    target.name = 'Shotgun';
    const { weaponView, hud } = makeMocks(weapons);
    switchWeapon({ weapons, activeIndex: 0, weaponView, hud }, 1);
    expect(hud.setWeaponState).toHaveBeenCalledWith(6, 12, false, 'Shotgun');
  });
});
