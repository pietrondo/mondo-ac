import * as THREE from 'three';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE } from '../config';
import { chooseMonsterVariant, getMonsterVariantProfile, type MonsterVariant } from '../world/monsterVariant';
import { EnemyProjectileSystem } from '../combat/EnemyProjectile';

export interface MonsterOptions {
  variant?: MonsterVariant;
}

export class Monster {
  mesh: THREE.Group;
  readonly variant: MonsterVariant;
  readonly maxHp: number;
  readonly moveSpeed: number;
  private state: 'wander' | 'chase' | 'attack' = 'wander';
  private targetPos = new THREE.Vector3();
  private hp: number;
  private alive = true;
  private attackCooldown = 0;
  private readonly attackRange = 25;
  private readonly optimalAttackDistance = 15;
  private projectileSystem: EnemyProjectileSystem | null = null;

  constructor(position: THREE.Vector3, options: MonsterOptions = {}) {
    this.variant = options.variant ?? chooseMonsterVariant(position);
    const profile = getMonsterVariantProfile(this.variant);
    this.maxHp = profile.hp;
    this.moveSpeed = profile.speed;
    this.hp = this.maxHp;
    this.mesh = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(profile.bodyWidth, profile.bodyHeight, profile.bodyDepth),
      new THREE.MeshStandardMaterial({ color: profile.bodyColor, flatShading: true })
    );
    body.position.y = profile.bodyHeight * 0.55;
    this.mesh.add(body);

    const eyeGeo = new THREE.SphereGeometry(this.variant === 'brute' ? 0.16 : 0.12, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: profile.eyeColor });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.22 * profile.scale, profile.bodyHeight * 0.78, profile.bodyDepth * 0.42);
    this.mesh.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.22 * profile.scale, profile.bodyHeight * 0.78, profile.bodyDepth * 0.42);
    this.mesh.add(rightEye);

    if (this.variant === 'brute') {
      const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, flatShading: true });
      const leftShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.3), shoulderMat);
      leftShoulder.position.set(-0.55, profile.bodyHeight * 0.72, 0.05);
      this.mesh.add(leftShoulder);
      const rightShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.3), shoulderMat);
      rightShoulder.position.set(0.55, profile.bodyHeight * 0.72, 0.05);
      this.mesh.add(rightShoulder);
    }

    if (this.variant === 'stalker') {
      const crestMat = new THREE.MeshStandardMaterial({ color: 0xc2185b, flatShading: true });
      for (let i = -1; i <= 1; i++) {
        const crest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 5), crestMat);
        crest.position.set(i * 0.16, profile.bodyHeight * 1.04, -0.05 + Math.abs(i) * 0.04);
        crest.rotation.x = i * 0.15;
        this.mesh.add(crest);
      }
    }

    if (this.variant === 'golem') {
      const fistMat = new THREE.MeshStandardMaterial({ color: 0x455A64, flatShading: true });
      const leftFist = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), fistMat);
      leftFist.position.set(-0.8 * profile.scale, profile.bodyHeight * 0.45, 0);
      this.mesh.add(leftFist);
      const rightFist = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), fistMat);
      rightFist.position.set(0.8 * profile.scale, profile.bodyHeight * 0.45, 0);
      this.mesh.add(rightFist);
    }

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.mesh.scale.setScalar(profile.scale);
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

  setProjectileSystem(system: EnemyProjectileSystem): void {
    this.projectileSystem = system;
  }

  private canAttack(): boolean {
    return this.projectileSystem !== null;
  }

  private getAttackParams(): { speed: number; damage: number; color: number; size: number; cooldown: number } {
    switch (this.variant) {
      case 'scout':
        return { speed: 45, damage: 8, color: 0x4caf50, size: 0.08, cooldown: 1.0 };
      case 'brute':
        return { speed: 25, damage: 20, color: 0xd32f2f, size: 0.25, cooldown: 2.5 };
      case 'golem':
        return { speed: 15, damage: 30, color: 0xff0000, size: 0.45, cooldown: 3.0 };
      case 'stalker':
      default:
        return { speed: 35, damage: 12, color: 0xff3333, size: 0.15, cooldown: 1.5 };
    }
  }

  private attack(playerPos: THREE.Vector3): void {
    if (!this.projectileSystem || this.attackCooldown > 0) return;

    const params = this.getAttackParams();
    const eyePos = this.mesh.position.clone();
    eyePos.y += 1.5;

    const dir = new THREE.Vector3().subVectors(playerPos, eyePos).normalize();

    this.projectileSystem.spawn(eyePos, dir, {
      speed: params.speed,
      damage: params.damage,
      color: params.color,
      size: params.size,
    });

    this.attackCooldown = params.cooldown;
  }

  update(delta: number, heightMap: HeightMap, playerPos: THREE.Vector3): void {
    if (!this.alive) return;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    const distToPlayer = this.mesh.position.distanceTo(playerPos);

    // State machine
    if (distToPlayer < this.attackRange && this.canAttack()) {
      if (distToPlayer > this.optimalAttackDistance) {
        this.state = 'chase';
        this.targetPos.copy(playerPos);
      } else {
        this.state = 'attack';
        this.attack(playerPos);
      }
    } else if (distToPlayer < 20) {
      this.state = 'chase';
      this.targetPos.copy(playerPos);
    } else if (this.state === 'chase' && distToPlayer > 30) {
      this.state = 'wander';
      this.pickNewTarget();
    } else if (this.state === 'attack' && distToPlayer > this.attackRange) {
      this.state = 'chase';
      this.targetPos.copy(playerPos);
    }

    // Face player when attacking
    if (this.state === 'attack') {
      this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
      return;
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
    const moveSpeed = this.state === 'chase' ? this.moveSpeed * 1.5 : this.moveSpeed;
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
