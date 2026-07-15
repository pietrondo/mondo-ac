import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CloudManager } from '../../src/world/clouds';
import { WORLD_SIZE, WORLD_SCALE } from '../../src/config';

describe('CloudManager', () => {
  it('spawns 15-20 cloud clusters, each with 3-5 child meshes', () => {
    const scene = new THREE.Scene();
    const cloudManager = new CloudManager(scene);

    const clusters = cloudManager.getClusters();
    expect(clusters.length).toBeGreaterThanOrEqual(15);
    expect(clusters.length).toBeLessThanOrEqual(20);

    for (const cluster of clusters) {
      expect(cluster.children.length).toBeGreaterThanOrEqual(3);
      expect(cluster.children.length).toBeLessThanOrEqual(5);
      
      // Each child should be a Mesh using MeshStandardMaterial
      for (const child of cluster.children) {
        expect(child).toBeInstanceOf(THREE.Mesh);
        const mesh = child as THREE.Mesh;
        expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
      }
    }
  });

  it('drifts clouds and wraps around boundaries', () => {
    const scene = new THREE.Scene();
    const cloudManager = new CloudManager(scene);
    const clusters = cloudManager.getClusters();
    const firstCluster = clusters[0];
    const worldHalf = (WORLD_SIZE / 2) * WORLD_SCALE;

    // Capture initial X position
    const initialX = firstCluster.position.x;
    
    // Update should move clouds along velocity vector
    cloudManager.update(1.0);
    expect(firstCluster.position.x).not.toBe(initialX);

    // Test positive X boundary wrap
    firstCluster.position.set(worldHalf + 10, 90, 0);
    cloudManager.update(0.01); // Trigger update to wrap
    expect(firstCluster.position.x).toBeLessThan(0); // Should wrap to -worldHalf + drift

    // Test negative X boundary wrap
    firstCluster.position.set(-worldHalf - 10, 90, 0);
    // Since velocity is positive X wind, let's artificially set velocity/position to check wrap
    // Wait, the update wraps back if it is less than -worldHalf
    cloudManager.update(0.0); // wrap check doesn't need delta to evaluate boundaries if we position it
    expect(firstCluster.position.x).toBeGreaterThan(0); // Should wrap to worldHalf

    // Test positive Z boundary wrap
    firstCluster.position.set(0, 90, worldHalf + 10);
    cloudManager.update(0.0);
    expect(firstCluster.position.z).toBeLessThan(0);

    // Test negative Z boundary wrap
    firstCluster.position.set(0, 90, -worldHalf - 10);
    cloudManager.update(0.0);
    expect(firstCluster.position.z).toBeGreaterThan(0);
  });
});
