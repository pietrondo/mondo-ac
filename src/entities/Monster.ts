import * as THREE from 'three';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE } from '../config';

export class Monster {
  mesh: THREE.Group;
  private state: 'wander' | 'chase' = 'wander';
  private targetPos = new THREE.Vector3();
  private speed = 3;
  private hp = 50;
  private alive = true;

  constructor(position: THREE.Vector3) {
    this.mesh = new THREE.Group();

    // Body (red for danger)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xD32F2F, flatShading: true })
    );
    body.position.y = 0.8;
    this.mesh.add(body);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 1.2, 0.6);
    this.mesh.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 1.2, 0.6);
    this.mesh.add(rightEye);

    this.mesh.position.copy(position);
    this.pickNewTarget();
  }

  isAlive(): boolean { return this.alive; }
  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      this.mesh.visible = false;
    }
  }

  private pickNewTarget(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 15;
    this.targetPos.set(
      this.mesh.position.x + Math.cos(angle) * dist,
      this.mesh.position.y,
      this.mesh.position.z + Math.sin(angle) * dist
    );
  }

  update(delta: number, heightMap: HeightMap, playerPos: THREE.Vector3): void {
    if (!this.alive) return;

    const distToPlayer = this.mesh.position.distanceTo(playerPos);

    // Chase if close
    if (distToPlayer < 20) {
      this.state = 'chase';
      this.targetPos.copy(playerPos);
    } else if (this.state === 'chase' && distToPlayer > 30) {
      this.state = 'wander';
      this.pickNewTarget();
    }

    // Move toward target
    const dir = new THREE.Vector3().subVectors(this.targetPos, this.mesh.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 0.5 && this.state === 'wander') {
      this.pickNewTarget();
      return;
    }

    dir.normalize();
    const moveSpeed = this.state === 'chase' ? this.speed * 1.5 : this.speed;
    this.mesh.position.x += dir.x * moveSpeed * delta;
    this.mesh.position.z += dir.z * moveSpeed * delta;

    // Update height
    const hx = (this.mesh.position.x / WORLD_SCALE) + 128;
    const hz = (this.mesh.position.z / WORLD_SCALE) + 128;
    this.mesh.position.y = heightMap.getInterpolated(hx, hz);

    // Face direction
    this.mesh.lookAt(this.targetPos.x, this.mesh.position.y, this.targetPos.z);
  }
}
