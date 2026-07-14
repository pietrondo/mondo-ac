import { describe, expect, it } from 'vitest';
import { applyPowerUp, createPowerUpRuntime, tickPowerUpRuntime } from '../../src/game/powerUpEffects';

describe('power up effects', () => {
  it('heal and ammo pickups apply immediately', () => {
    const runtime = createPowerUpRuntime();
    const player = {
      hp: 64,
      maxHp: 100,
      speed: 5,
    };
    const rifle = {
      reserveAmmo: 12,
    };

    expect(applyPowerUp('health', runtime, player, rifle)).toBe('Health restored');
    expect(player.hp).toBe(94);

    expect(applyPowerUp('ammo', runtime, player, rifle)).toBe('Ammo stockpiled');
    expect(rifle.reserveAmmo).toBe(42);
  });

  it('temporary boosts decay back to the baseline', () => {
    const runtime = createPowerUpRuntime();
    const player = {
      hp: 100,
      maxHp: 100,
      speed: 5,
    };
    const rifle = {
      reserveAmmo: 12,
    };

    applyPowerUp('adrenaline', runtime, player, rifle);
    applyPowerUp('overclock', runtime, player, rifle);

    expect(player.speed).toBeGreaterThan(5);
    expect(runtime.shotDamage).toBeGreaterThan(runtime.baseShotDamage);

    tickPowerUpRuntime(10, runtime, player);

    expect(player.speed).toBe(5);
    expect(runtime.shotDamage).toBe(runtime.baseShotDamage);
  });
});
