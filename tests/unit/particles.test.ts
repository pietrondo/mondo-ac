import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ParticlePool } from '../../src/combat/particles';
import { HeightMap } from '../../src/world/heightmap';
import { WORLD_SCALE } from '../../src/config';

describe('ParticlePool', () => {
  it('prepares and spawns particles up to maxCapacity', () => {
    const scene = new THREE.Scene();
    const pool = new ParticlePool(scene, 3);

    // Spawn 1
    const p1 = pool.spawn('spark', new THREE.Vector3(1, 2, 3), new THREE.Vector3(0, 1, 0), 1.0);
    expect(p1.active).toBe(true);
    expect(p1.type).toBe('spark');
    expect(p1.mesh.visible).toBe(true);
    expect(scene.children).toHaveLength(1);

    // Spawn 2
    const p2 = pool.spawn('spark', new THREE.Vector3(1, 2, 3), new THREE.Vector3(0, 1, 0), 1.0);
    expect(p2.active).toBe(true);
    expect(scene.children).toHaveLength(2);

    // Spawn 3
    const p3 = pool.spawn('spark', new THREE.Vector3(1, 2, 3), new THREE.Vector3(0, 1, 0), 1.0);
    expect(p3.active).toBe(true);
    expect(scene.children).toHaveLength(3);

    // Spawn 4 (triggers recycling, should recycle p1 because it has the same type or oldest life)
    const p4 = pool.spawn('spark', new THREE.Vector3(4, 5, 6), new THREE.Vector3(0, 0, 0), 2.0);
    expect(p4.active).toBe(true);
    // Since maxCapacity is 3, scene.children length shouldn't exceed 3
    expect(scene.children).toHaveLength(3);
    
    // One of p1, p2, p3 must have been recycled (thus p4 should be that recycled reference)
    expect(pool.getParticles()).toHaveLength(3);
  });

  it('reuses inactive particles', () => {
    const scene = new THREE.Scene();
    const pool = new ParticlePool(scene, 5);

    const p1 = pool.spawn('blood', new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1), 1.0);
    expect(p1.active).toBe(true);

    // Deactivate it manually for testing recycling
    p1.active = false;
    p1.mesh.visible = false;

    // Spawn again, should reuse p1
    const p2 = pool.spawn('blood', new THREE.Vector3(2, 2, 2), new THREE.Vector3(0, 0, 0), 1.5);
    expect(p2).toBe(p1); // should be the exact same particle instance
    expect(p2.active).toBe(true);
    expect(p2.life).toBe(1.5);
    expect(scene.children).toHaveLength(1);
  });

  it('updates physics, decays opacity/scale, and handles bouncing/ground collisions', () => {
    const scene = new THREE.Scene();
    const pool = new ParticlePool(scene, 10);
    const heightMap = new HeightMap(12345);

    // Spawn a shell high in the air
    const shell = pool.spawn('shell', new THREE.Vector3(50, 100, 50), new THREE.Vector3(0, 0, 0), 2.0);
    const initialY = shell.position.y;

    // Update with delta, should fall down due to gravity
    pool.update(0.1, heightMap);
    expect(shell.position.y).toBeLessThan(initialY);

    // Spawn a shell right on/below ground
    const hx = (60 / WORLD_SCALE) + 128;
    const hz = (60 / WORLD_SCALE) + 128;
    const groundY = heightMap.getInterpolated(hx, hz);

    const shellNearGround = pool.spawn('shell', new THREE.Vector3(60, groundY + 0.05, 60), new THREE.Vector3(0, -5, 0), 2.0);
    // Update should trigger a bounce (velocity.y should flip to positive)
    pool.update(0.05, heightMap);
    expect(shellNearGround.position.y).toBeGreaterThanOrEqual(groundY);
    expect(shellNearGround.velocity.y).toBeGreaterThan(0); // bounced up!

    // Decay test: spark scales down over time
    const spark = pool.spawn('spark', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1.0);
    pool.update(0.5, heightMap);
    expect(spark.mesh.scale.x).toBeCloseTo(0.5, 1);
    expect((spark.mesh.material as any).opacity).toBeCloseTo(0.5, 1);

    // Particle dies when life <= 0
    pool.update(0.6, heightMap);
    expect(spark.active).toBe(false);
    expect(spark.mesh.visible).toBe(false);
  });

  it('spawns and updates weather particles (snow, sand, leaf) without bouncing', () => {
    const scene = new THREE.Scene();
    const pool = new ParticlePool(scene, 10);
    const heightMap = new HeightMap(12345);

    const snow = pool.spawn('snow', new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 0, 0), 2.0);
    const sand = pool.spawn('sand', new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 0, 0), 2.0);
    const leaf = pool.spawn('leaf', new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 0, 0), 2.0);

    expect(snow.active).toBe(true);
    expect(sand.active).toBe(true);
    expect(leaf.active).toBe(true);

    pool.update(0.1, heightMap);

    expect(snow.velocity.x).not.toBe(0);
    expect(leaf.velocity.x).not.toBe(0);
    expect(sand.velocity.x).toBe(12.0);

    const hx = (0 / WORLD_SCALE) + 128;
    const hz = (0 / WORLD_SCALE) + 128;
    const groundY = heightMap.getInterpolated(hx, hz);

    snow.position.y = groundY - 1.0;
    sand.position.y = groundY - 1.0;
    leaf.position.y = groundY - 1.0;

    pool.update(0.1, heightMap);
    expect(snow.active).toBe(false);
    expect(sand.active).toBe(false);
    expect(leaf.active).toBe(false);
  });
});
