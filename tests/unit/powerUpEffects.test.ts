import { describe, expect, it } from 'vitest';
import { applyPowerUp, createPowerUpRuntime, tickPowerUpRuntime } from '../../src/game/powerUpEffects';

describe('power up effects', () => {
  it('heal and ammo pickups apply immediately', () => {
    const runtime = createPowerUpRuntime();
    const player = {
      hp: 64,
      maxHp: 100,
      speed: 5,
      isInvulnerable: false,
      heal: (amount: number) => {
        const healed = Math.min(amount, player.maxHp - player.hp);
        player.hp += healed;
        return healed;
      },
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
      isInvulnerable: false,
      heal: () => 0,
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

  it('shield power up grants invulnerability for 8 seconds and decays', () => {
    const runtime = createPowerUpRuntime();
    const player = {
      hp: 100,
      maxHp: 100,
      speed: 5,
      isInvulnerable: false,
      heal: () => 0,
    };
    const rifle = {
      reserveAmmo: 12,
    };

    expect(applyPowerUp('shield' as any, runtime, player, rifle)).toBe('Shield activated');
    expect(player.isInvulnerable).toBe(true);
    expect((runtime as any).shieldRemaining).toBe(8);

    // Tick it down
    tickPowerUpRuntime(5, runtime, player);
    expect(player.isInvulnerable).toBe(true);
    expect((runtime as any).shieldRemaining).toBe(3);

    // Tick it completely
    tickPowerUpRuntime(3, runtime, player);
    expect(player.isInvulnerable).toBe(false);
    expect((runtime as any).shieldRemaining).toBe(0);
  });

  it('shield remaining stacks or caps to at least 8 seconds when applied multiple times', () => {
    const runtime = createPowerUpRuntime();
    const player = {
      hp: 100,
      maxHp: 100,
      speed: 5,
      isInvulnerable: false,
      heal: () => 0,
    };
    const rifle = {
      reserveAmmo: 12,
    };

    applyPowerUp('shield', runtime, player, rifle);
    expect(runtime.shieldRemaining).toBe(8);

    // Tick 3 seconds
    tickPowerUpRuntime(3, runtime, player);
    expect(runtime.shieldRemaining).toBe(5);

    // Apply shield again
    applyPowerUp('shield', runtime, player, rifle);
    expect(runtime.shieldRemaining).toBe(8); // resets back to 8 as per Math.max
  });
});
