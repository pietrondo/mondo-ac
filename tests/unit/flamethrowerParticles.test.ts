import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ParticlePool } from '../../src/combat/particles';
import { HeightMap } from '../../src/world/heightmap';

describe('Flamethrower Particles Unit Tests', () => {
  it('spawns and expands flame particles over lifetime', () => {
    const scene = new THREE.Scene();
    const pool = new ParticlePool(scene, 100);
    const heightMap = new HeightMap(12345);

    const pos = new THREE.Vector3(0, 150, 0);
    const vel = new THREE.Vector3(10, 0, 0);

    const particle = pool.spawn('flame', pos, vel, 1.0);

    expect(particle.active).toBe(true);
    expect(particle.type).toBe('flame');
    expect(particle.mesh.visible).toBe(true);

    pool.update(0.1, heightMap);
    const scaleAtStart = particle.mesh.scale.x;

    pool.update(0.4, heightMap);
    const scaleLater = particle.mesh.scale.x;

    expect(scaleLater).toBeGreaterThan(scaleAtStart);
  });

  it('recycles flame particles when capacity limit is reached', () => {
    const scene = new THREE.Scene();
    const pool = new ParticlePool(scene, 10);
    const heightMap = new HeightMap(12345);

    for (let i = 0; i < 20; i++) {
      pool.spawn('flame', new THREE.Vector3(i, 0, 0), new THREE.Vector3(1, 0, 0), 1.0);
    }

    expect(pool.getActiveCount()).toBeLessThanOrEqual(10);
  });
});
