import { POWERUPS } from '../config/powerups';

export type PowerUpKind = 'health' | 'ammo' | 'adrenaline' | 'overclock' | 'shield';

export interface PowerUpRuntime {
  baseSpeed: number;
  speed: number;
  baseShotDamage: number;
  shotDamage: number;
  speedBoostRemaining: number;
  damageBoostRemaining: number;
  shieldRemaining: number;
}

export interface PowerUpRecipient {
  hp: number;
  maxHp: number;
  speed: number;
  isInvulnerable: boolean;
  heal(amount: number): number;
}

export interface PowerUpAmmoRecipient {
  reserveAmmo: number;
}

export function createPowerUpRuntime(baseSpeed = 5, baseShotDamage = 25): PowerUpRuntime {
  return {
    baseSpeed,
    speed: baseSpeed,
    baseShotDamage,
    shotDamage: baseShotDamage,
    speedBoostRemaining: 0,
    damageBoostRemaining: 0,
    shieldRemaining: 0,
  };
}

export function applyPowerUp(
  kind: PowerUpKind,
  runtime: PowerUpRuntime,
  player: PowerUpRecipient,
  rifle: PowerUpAmmoRecipient
): string {
  switch (kind) {
    case 'health':
      player.heal(POWERUPS.health.healAmount);
      return 'Health restored';
    case 'ammo':
      rifle.reserveAmmo += POWERUPS.ammo.ammoAmount;
      return 'Ammo stockpiled';
    case 'adrenaline':
      runtime.speedBoostRemaining = Math.max(runtime.speedBoostRemaining, POWERUPS.adrenaline.duration);
      runtime.speed = runtime.baseSpeed * POWERUPS.adrenaline.speedMultiplier;
      player.speed = runtime.speed;
      return 'Adrenaline boost';
    case 'overclock':
      runtime.damageBoostRemaining = Math.max(runtime.damageBoostRemaining, POWERUPS.overclock.duration);
      runtime.shotDamage = Math.round(runtime.baseShotDamage * POWERUPS.overclock.damageMultiplier);
      return 'Weapon overclocked';
    case 'shield':
      runtime.shieldRemaining = Math.max(runtime.shieldRemaining, POWERUPS.shield.duration);
      player.isInvulnerable = true;
      return 'Shield activated';
    default:
      return 'Power up';
  }
}

export function tickPowerUpRuntime(
  delta: number,
  runtime: PowerUpRuntime,
  player: PowerUpRecipient
): void {
  if (runtime.speedBoostRemaining > 0) {
    runtime.speedBoostRemaining = Math.max(0, runtime.speedBoostRemaining - delta);
    if (runtime.speedBoostRemaining === 0) {
      runtime.speed = runtime.baseSpeed;
      player.speed = runtime.baseSpeed;
    }
  }

  if (runtime.damageBoostRemaining > 0) {
    runtime.damageBoostRemaining = Math.max(0, runtime.damageBoostRemaining - delta);
    if (runtime.damageBoostRemaining === 0) {
      runtime.shotDamage = runtime.baseShotDamage;
    }
  }

  if (runtime.shieldRemaining > 0) {
    runtime.shieldRemaining = Math.max(0, runtime.shieldRemaining - delta);
    if (runtime.shieldRemaining === 0) {
      player.isInvulnerable = false;
    }
  }
}
