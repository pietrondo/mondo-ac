import * as THREE from 'three';
import { WORLD_SIZE, WORLD_SCALE } from '../config';

export class CloudManager {
  private scene: THREE.Scene;
  private clusters: THREE.Group[] = [];
  private velocities: THREE.Vector3[] = [];
  private worldHalf: number;
  private readonly cloudGeo: THREE.BoxGeometry;
  private readonly cloudMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.worldHalf = (WORLD_SIZE / 2) * WORLD_SCALE;
    this.cloudGeo = new THREE.BoxGeometry(1, 1, 1);
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      roughness: 0.9,
      transparent: true,
      opacity: 0.8,
    });
    this.spawnClouds();
  }

  private spawnClouds(): void {
    const numClusters = 15 + Math.floor(Math.random() * 6);

    for (let i = 0; i < numClusters; i++) {
      const clusterGroup = new THREE.Group();

      const startX = (Math.random() - 0.5) * 2 * this.worldHalf;
      const startZ = (Math.random() - 0.5) * 2 * this.worldHalf;
      clusterGroup.position.set(startX, 90, startZ);

      const numBoxes = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numBoxes; j++) {
        const w = 15 + Math.random() * 15;
        const h = 5 + Math.random() * 5;
        const d = 15 + Math.random() * 15;

        const box = new THREE.Mesh(this.cloudGeo, this.cloudMat);
        box.scale.set(w, h, d);

        const offsetX = (Math.random() - 0.5) * 12;
        const offsetY = (Math.random() - 0.5) * 3;
        const offsetZ = (Math.random() - 0.5) * 12;
        box.position.set(offsetX, offsetY, offsetZ);

        clusterGroup.add(box);
      }

      this.scene.add(clusterGroup);
      this.clusters.push(clusterGroup);

      const windX = 2.0 + Math.random() * 4.0;
      const windZ = (Math.random() - 0.5) * 2.0;
      this.velocities.push(new THREE.Vector3(windX, 0, windZ));
    }
  }

  update(delta: number): void {
    for (let i = 0; i < this.clusters.length; i++) {
      const cluster = this.clusters[i];
      const vel = this.velocities[i];

      cluster.position.addScaledVector(vel, delta);

      if (cluster.position.x > this.worldHalf) {
        cluster.position.x = -this.worldHalf;
      } else if (cluster.position.x < -this.worldHalf) {
        cluster.position.x = this.worldHalf;
      }

      if (cluster.position.z > this.worldHalf) {
        cluster.position.z = -this.worldHalf;
      } else if (cluster.position.z < -this.worldHalf) {
        cluster.position.z = this.worldHalf;
      }
    }
  }

  getClusters(): THREE.Group[] {
    return this.clusters;
  }

  dispose(): void {
    this.cloudGeo.dispose();
    this.cloudMat.dispose();
  }
}
