import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { BossMonster } from '../src/entities/BossMonster';

describe('BossMonster', () => {
  it('initializes with phase 1, full health, and alive state', () => {
    const boss = new BossMonster(new THREE.Vector3(0, -150, 0), { name: 'Test Boss', maxHp: 500 });

    expect(boss.name).toBe('Test Boss');
    expect(boss.maxHp).toBe(500);
    expect(boss.getHp()).toBe(500);
    expect(boss.getPhase()).toBe(1);
    expect(boss.isAlive()).toBe(true);
    expect(boss.mesh).toBeDefined();
  });

  it('transitions to phase 2 at <= 60% HP and triggers callback', () => {
    const onPhaseChange = vi.fn();
    const boss = new BossMonster(new THREE.Vector3(0, -150, 0), { maxHp: 500, onPhaseChange });

    boss.takeDamage(250); // 250 / 500 = 50% HP <= 60% HP
    expect(boss.getPhase()).toBe(2);
    expect(onPhaseChange).toHaveBeenCalledWith(2);
  });

  it('transitions to phase 3 at <= 25% HP', () => {
    const onPhaseChange = vi.fn();
    const boss = new BossMonster(new THREE.Vector3(0, -150, 0), { maxHp: 500, onPhaseChange });

    boss.takeDamage(400); // 100 HP remaining = 20% HP <= 25% HP
    expect(boss.getPhase()).toBe(3);
    expect(onPhaseChange).toHaveBeenLastCalledWith(3);
  });

  it('dies when HP drops to 0 and calls onDeath', () => {
    const onDeath = vi.fn();
    const boss = new BossMonster(new THREE.Vector3(0, -150, 0), { maxHp: 500, onDeath });

    boss.takeDamage(500);
    expect(boss.getHp()).toBe(0);
    expect(boss.isAlive()).toBe(false);
    expect(onDeath).toHaveBeenCalled();
  });

  it('pursues player during update tick', () => {
    const boss = new BossMonster(new THREE.Vector3(0, -150, 0), { maxHp: 500, moveSpeed: 10 });
    const playerPos = new THREE.Vector3(20, -150, 0);

    boss.update(1.0, playerPos, true);
    expect(boss.mesh.position.x).toBeGreaterThan(0);
  });
});
