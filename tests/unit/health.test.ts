import { describe, it, expect, vi } from 'vitest';
import { Health } from '../../src/components/Health';

describe('Health', () => {
  it('starts at full hp', () => {
    const h = new Health(100);
    expect(h.hp).toBe(100);
    expect(h.maxHp).toBe(100);
    expect(h.ratio).toBe(1);
    expect(h.isAlive()).toBe(true);
  });

  it('reduces hp on damage and returns dealt amount', () => {
    const h = new Health(100);
    const dealt = h.takeDamage(30);
    expect(dealt).toBe(30);
    expect(h.hp).toBe(70);
    expect(h.ratio).toBeCloseTo(0.7);
  });

  it('clamps dealt damage at remaining hp', () => {
    const h = new Health(50);
    const dealt = h.takeDamage(80);
    expect(dealt).toBe(50);
    expect(h.hp).toBe(0);
    expect(h.isAlive()).toBe(false);
  });

  it('ignores damage when invulnerable', () => {
    const h = new Health(100);
    h.isInvulnerable = true;
    const dealt = h.takeDamage(50);
    expect(dealt).toBe(0);
    expect(h.hp).toBe(100);
  });

  it('ignores damage when already dead', () => {
    const h = new Health(50);
    h.takeDamage(50);
    const dealt = h.takeDamage(20);
    expect(dealt).toBe(0);
    expect(h.hp).toBe(0);
  });

  it('ignores zero or negative damage', () => {
    const h = new Health(100);
    expect(h.takeDamage(0)).toBe(0);
    expect(h.takeDamage(-10)).toBe(0);
    expect(h.hp).toBe(100);
  });

  it('emits damage events with dealt amount', () => {
    const h = new Health(100);
    const cb = vi.fn();
    h.onDamage(cb);
    h.takeDamage(25);
    expect(cb).toHaveBeenCalledWith(25, 75);
  });

  it('emits death event only once when hp reaches 0', () => {
    const h = new Health(50);
    const deathCb = vi.fn();
    h.onDeath(deathCb);
    h.takeDamage(50);
    expect(deathCb).toHaveBeenCalledOnce();
    h.takeDamage(10);
    expect(deathCb).toHaveBeenCalledOnce();
  });

  it('heals up to maxHp and reports actual healed amount', () => {
    const h = new Health(100);
    h.takeDamage(50);
    const healed = h.heal(80);
    expect(healed).toBe(50);
    expect(h.hp).toBe(100);
  });

  it('heals zero when dead', () => {
    const h = new Health(50);
    h.takeDamage(50);
    expect(h.heal(10)).toBe(0);
    expect(h.hp).toBe(0);
  });

  it('reset restores hp and alive state', () => {
    const h = new Health(50);
    h.takeDamage(50);
    expect(h.isAlive()).toBe(false);
    h.reset();
    expect(h.hp).toBe(50);
    expect(h.isAlive()).toBe(true);
  });

  it('unsubscribe removes listener', () => {
    const h = new Health(100);
    const cb = vi.fn();
    const unsub = h.onDamage(cb);
    unsub();
    h.takeDamage(10);
    expect(cb).not.toHaveBeenCalled();
  });

  it('emits healthChange on damage', () => {
    const h = new Health(100);
    const cb = vi.fn();
    h.onHealthChange(cb);
    h.takeDamage(20);
    expect(cb).toHaveBeenCalledWith(80, 100);
  });

  it('handles zero maxHp gracefully', () => {
    const h = new Health(0);
    expect(h.ratio).toBe(0);
    expect(h.takeDamage(10)).toBe(0);
  });
});
