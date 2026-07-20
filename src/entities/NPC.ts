import * as THREE from 'three';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE } from '../config';

export interface VillageContext {
  center: THREE.Vector3;
  radius: number;
  buildings: THREE.Vector3[];
}

export class NPC {
  mesh: THREE.Group;
  private targetPos = new THREE.Vector3();
  private speed = 2;
  private waitTime = 0;
  private village: VillageContext | null;

  constructor(position: THREE.Vector3, village?: VillageContext) {
    this.mesh = new THREE.Group();
    this.village = village || null;

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x4CAF50, flatShading: true })
    );
    body.position.y = 1;
    this.mesh.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xFFCC80, flatShading: true })
    );
    head.position.y = 2;
    this.mesh.add(head);

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.mesh.position.copy(position);
    this.pickNewTarget();
  }

  private pickNewTarget(): void {
    if (this.village && this.village.buildings.length > 0) {
      const targetBuilding = this.village.buildings[Math.floor(Math.random() * this.village.buildings.length)];
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        0,
        (Math.random() - 0.5) * 4
      );
      this.targetPos.copy(targetBuilding).add(offset);
      this.targetPos.y = this.mesh.position.y;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.random() * 10;
      this.targetPos.set(
        this.mesh.position.x + Math.cos(angle) * dist,
        this.mesh.position.y,
        this.mesh.position.z + Math.sin(angle) * dist
      );
    }
  }

  update(delta: number, heightMap: HeightMap): void {
    if (this.waitTime > 0) {
      this.waitTime -= delta;
      return;
    }

    // Move toward target
    const dir = new THREE.Vector3().subVectors(this.targetPos, this.mesh.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 0.5) {
      this.waitTime = 1 + Math.random() * 2;
      this.pickNewTarget();
      return;
    }

    dir.normalize();
    const moveX = dir.x * this.speed * delta;
    const moveZ = dir.z * this.speed * delta;
    
    const newX = this.mesh.position.x + moveX;
    const newZ = this.mesh.position.z + moveZ;

    // Constrain to village radius if in a village
    if (this.village) {
      const distFromCenter = Math.sqrt(
        Math.pow(newX - this.village.center.x, 2) + 
        Math.pow(newZ - this.village.center.z, 2)
      );
      
      if (distFromCenter <= this.village.radius) {
        this.mesh.position.x = newX;
        this.mesh.position.z = newZ;
      } else {
        this.waitTime = 0.5;
        this.pickNewTarget();
        return;
      }
    } else {
      this.mesh.position.x = newX;
      this.mesh.position.z = newZ;
    }

    // Update height
    const hx = (this.mesh.position.x / WORLD_SCALE) + 128;
    const hz = (this.mesh.position.z / WORLD_SCALE) + 128;
    this.mesh.position.y = heightMap.getInterpolated(hx, hz);

    // Face direction
    this.mesh.lookAt(this.targetPos.x, this.mesh.position.y, this.targetPos.z);
  }
}
