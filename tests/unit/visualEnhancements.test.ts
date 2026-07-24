import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ParticlePool } from '../../src/combat/particles';
import { createFresnelMaterial } from '../../src/render/materials';
import { Monster } from '../../src/entities/Monster';
import { BossMonster } from '../../src/entities/BossMonster';
import { NPC } from '../../src/entities/NPC';

describe('Visual Enhancements', () => {
  it('should compile Fresnel material', () => {
    const mat = createFresnelMaterial({ color: 0xff0000 });
    expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(typeof mat.onBeforeCompile).toBe('function');
  });

  it('ParticlePool should spawn new types', () => {
    const scene = new THREE.Scene();
    const pool = new ParticlePool(scene, 10);
    const p1 = pool.spawn('thruster', new THREE.Vector3(), new THREE.Vector3());
    expect(p1.type).toBe('thruster');
    const p2 = pool.spawn('spectral_trail', new THREE.Vector3(), new THREE.Vector3());
    expect(p2.type).toBe('spectral_trail');
    const p3 = pool.spawn('boss_dissolve_ember', new THREE.Vector3(), new THREE.Vector3());
    expect(p3.type).toBe('boss_dissolve_ember');
  });

  it('Monster should have limb groups', () => {
    const monster = new Monster(new THREE.Vector3(), { variant: 'scout' });
    expect((monster as any).limbGroups.length).toBeGreaterThan(0);
  });

  it('BossMonster should go to dying state and dissolve', () => {
    const boss = new BossMonster(new THREE.Vector3());
    expect((boss as any).state).toBe('active');
    boss.takeDamage(1000);
    expect((boss as any).state).toBe('dying');
    boss.update(2.5, new THREE.Vector3());
    expect((boss as any).state).toBe('dead');
  });

  it('NPC should have indicator group', () => {
    const npc = new NPC(new THREE.Vector3());
    expect((npc as any).indicatorGroup).toBeDefined();
    expect((npc as any).exclamation).toBeDefined();
    expect((npc as any).question).toBeDefined();
  });
});
