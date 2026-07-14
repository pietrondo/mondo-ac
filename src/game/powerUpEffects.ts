export type PowerUpKind = 'health' | 'ammo' | 'adrenaline' | 'overclock';

export interface PowerUpRuntime {
  baseSpeed: number;
  speed: number;
  baseShotDamage: number;
  shotDamage: number;
  speedBoostRemaining: number;
  damageBoostRemaining: number;
}

export interface PowerUpRecipient {
  hp: number;
  maxHp: number;
  speed: number;
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
      player.hp = Math.min(player.maxHp, player.hp + 30);
      return 'Health restored';
    case 'ammo':
      rifle.reserveAmmo += 30;
      return 'Ammo stockpiled';
    case 'adrenaline':
      runtime.speedBoostRemaining = Math.max(runtime.speedBoostRemaining, 8);
      runtime.speed = runtime.baseSpeed * 1.6;
      player.speed = runtime.speed;
      return 'Adrenaline boost';
    case 'overclock':
      runtime.damageBoostRemaining = Math.max(runtime.damageBoostRemaining, 8);
      runtime.shotDamage = Math.round(runtime.baseShotDamage * 1.6);
      return 'Weapon overclocked';
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
}
