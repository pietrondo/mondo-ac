import { Weapon } from './Weapon';
import { WeaponView } from './WeaponView';
import { HUD } from '../ui/hud';

export interface WeaponSwitchDeps {
  weapons: Weapon[];
  activeIndex: number;
  weaponView: WeaponView;
  hud: HUD;
}

export interface WeaponSwitchResult {
  switched: boolean;
  newIndex: number;
}

export function switchWeapon(
  deps: WeaponSwitchDeps,
  targetIndex: number
): WeaponSwitchResult {
  const { weapons, activeIndex } = deps;
  if (targetIndex < 0 || targetIndex >= weapons.length) {
    return { switched: false, newIndex: activeIndex };
  }
  if (targetIndex === activeIndex) {
    return { switched: false, newIndex: activeIndex };
  }
  if (weapons[activeIndex].isReloading) {
    return { switched: false, newIndex: activeIndex };
  }

  const weapon = weapons[targetIndex];
  deps.weaponView.setWeapon(weapon.type);
  deps.hud.setWeaponState(weapon.magazineAmmo, weapon.reserveAmmo, weapon.isReloading, weapon.name);

  return { switched: true, newIndex: targetIndex };
}
