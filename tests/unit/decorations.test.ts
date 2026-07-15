import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Tumbleweed } from '../../src/world/decorations';
import { HeightMap } from '../../src/world/heightmap';
import { WORLD_SIZE, WORLD_SCALE } from '../../src/config';

describe('Tumbleweed', () => {
  it('updates position based on wind velocity, applies gravity and handles heightmap bouncing', () => {
    const heightMap = new HeightMap(12345);
    const terrainY = heightMap.getInterpolated(WORLD_SIZE / 2, WORLD_SIZE / 2);
    const startPos = new THREE.Vector3(0, terrainY + 10, 0);
    const tw = new Tumbleweed(startPos, 1.2);

    expect(tw.position.x).toBe(0);
    expect(tw.position.y).toBe(terrainY + 10);
    expect(tw.position.z).toBe(0);
    expect(tw.scale).toBe(1.2);
    expect(tw.radius).toBe(0.6);

    // Update with delta
    tw.update(0.1, heightMap);

    // Should have moved horizontally
    expect(tw.position.x).not.toBe(0);
    expect(tw.position.z).not.toBe(0);

    // Vertical position should have changed due to gravity/velocity
    expect(tw.position.y).toBeLessThan(terrainY + 10);

    // Let's place it at ground height and verify bounce
    tw.position.y = terrainY; // set to terrain height
    tw.velocity.y = -5.0; // falling down

    tw.update(0.01, heightMap);

    // Re-evaluate terrain Y at the new post-update position
    const newGx = (tw.position.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const newGz = (tw.position.z / WORLD_SCALE) + WORLD_SIZE / 2;
    const currentTerrainY = heightMap.getInterpolated(newGx, newGz);

    // Position should be clamped to at least currentTerrainY + radius
    expect(tw.position.y).toBeGreaterThanOrEqual(currentTerrainY + tw.radius);
    // Vertical velocity should have flipped positive (bounced)
    expect(tw.velocity.y).toBeGreaterThan(0);
  });

  it('handles boundary wrapping at world limits', () => {
    const heightMap = new HeightMap(12345);
    const limit = (WORLD_SIZE * WORLD_SCALE) / 2;

    // Start near positive X limit
    const twX = new Tumbleweed(new THREE.Vector3(limit - 0.5, 10, 0), 1.0);
    // Set velocity pointing positive X
    twX.velocity.set(10.0, 0, 0);
    twX.update(0.1, heightMap);

    // Position X should have wrapped to the negative side of the limit
    expect(twX.position.x).toBeLessThan(0);
    expect(twX.position.x).toBeGreaterThanOrEqual(-limit);

    // Start near negative Z limit
    const twZ = new Tumbleweed(new THREE.Vector3(0, 10, -limit + 0.5), 1.0);
    // Set velocity pointing negative Z
    twZ.velocity.set(0, 0, -10.0);
    twZ.update(0.1, heightMap);

    // Position Z should have wrapped to the positive side of the limit
    expect(twZ.position.z).toBeGreaterThan(0);
    expect(twZ.position.z).toBeLessThanOrEqual(limit);
  });

  it('updates roll rotation based on horizontal displacement', () => {
    const heightMap = new HeightMap(12345);
    const startPos = new THREE.Vector3(0, 10, 0);
    const tw = new Tumbleweed(startPos, 1.0);

    const initialQuat = tw.quaternion.clone();

    // Update with delta to move it
    tw.update(0.2, heightMap);

    // Quaternion should have changed (rotated/rolled)
    expect(tw.quaternion.equals(initialQuat)).toBe(false);
  });
});
