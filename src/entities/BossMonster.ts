import * as THREE from 'three';
import { Health } from '../components/Health';

export interface BossMonsterOptions {
  name?: string;
  maxHp?: number;
  scale?: number;
  moveSpeed?: number;
  onAttack?: () => void;
  onPhaseChange?: (phase: number) => void;
  onDeath?: () => void;
}

export class BossMonster {
  mesh: THREE.Group;
  readonly name: string;
  readonly maxHp: number;
  private health: Health;
  phase: 1 | 2 | 3 = 1;
  private moveSpeed: number;

  private attackCooldown = 0;
  private shockwaveCooldown = 0;
  private readonly attackRange = 3.5;

  private onAttack?: () => void;
  private onPhaseChange?: (phase: number) => void;
  private onDeath?: () => void;

  private bodyMat: THREE.MeshStandardMaterial;
  private hornMat: THREE.MeshStandardMaterial;
  private eyeMat: THREE.MeshStandardMaterial;

  private originalEmissiveValues = new Map<THREE.MeshStandardMaterial, { color: THREE.Color; intensity: number }>();
  private hitFlashTimer = 0;

  constructor(position: THREE.Vector3, options: BossMonsterOptions = {}) {
    this.name = options.name ?? 'Boss Titano';
    this.maxHp = options.maxHp ?? 600;
    this.health = new Health(this.maxHp);
    this.moveSpeed = options.moveSpeed ?? 4.5;
    this.onAttack = options.onAttack;
    this.onPhaseChange = options.onPhaseChange;
    this.onDeath = options.onDeath;

    const scale = options.scale ?? 2.8;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.userData.damageable = this;

    // Boss materials
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3a1c1c,
      roughness: 0.7,
      metalness: 0.3,
      flatShading: true,
    });

    this.hornMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: new THREE.Color(0xff2200),
      emissiveIntensity: 1.2,
      flatShading: true,
    });

    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: new THREE.Color(0xff0000),
      emissiveIntensity: 2.5,
    });

    // Torso / Body
    const bodyGeo = new THREE.BoxGeometry(1.6 * scale, 2.2 * scale, 1.2 * scale);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    bodyMesh.position.y = (2.2 * scale) / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.mesh.add(bodyMesh);

    // Head
    const headGeo = new THREE.BoxGeometry(1.0 * scale, 1.0 * scale, 1.0 * scale);
    const headMesh = new THREE.Mesh(headGeo, this.bodyMat);
    headMesh.position.y = 2.2 * scale + (1.0 * scale) / 2;
    headMesh.castShadow = true;
    this.mesh.add(headMesh);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.15 * scale, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    leftEye.position.set(-0.25 * scale, 2.2 * scale + 0.6 * scale, 0.5 * scale);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    rightEye.position.set(0.25 * scale, 2.2 * scale + 0.6 * scale, 0.5 * scale);
    this.mesh.add(rightEye);

    // Horns / Crown
    const hornGeo = new THREE.ConeGeometry(0.2 * scale, 0.9 * scale, 4);
    const leftHorn = new THREE.Mesh(hornGeo, this.hornMat);
    leftHorn.position.set(-0.45 * scale, 2.2 * scale + 1.2 * scale, 0);
    leftHorn.rotation.z = -0.3;
    this.mesh.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, this.hornMat);
    rightHorn.position.set(0.45 * scale, 2.2 * scale + 1.2 * scale, 0);
    rightHorn.rotation.z = 0.3;
    this.mesh.add(rightHorn);

    // Massive Arms
    const armGeo = new THREE.BoxGeometry(0.6 * scale, 1.8 * scale, 0.6 * scale);
    const leftArm = new THREE.Mesh(armGeo, this.bodyMat);
    leftArm.position.set(-1.1 * scale, 1.6 * scale, 0);
    this.mesh.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, this.bodyMat);
    rightArm.position.set(1.1 * scale, 1.6 * scale, 0);
    this.mesh.add(rightArm);

    // Store emissive states for flash effect
    this.originalEmissiveValues.set(this.hornMat, {
      color: this.hornMat.emissive.clone(),
      intensity: this.hornMat.emissiveIntensity,
    });
    this.originalEmissiveValues.set(this.eyeMat, {
      color: this.eyeMat.emissive.clone(),
      intensity: this.eyeMat.emissiveIntensity,
    });
  }

  isAlive(): boolean {
    return this.health.isAlive();
  }

  getHp(): number {
    return this.health.hp;
  }

  getPhase(): number {
    return this.phase;
  }

  takeDamage(amount: number): void {
    if (!this.health.isAlive()) return;

    this.health.takeDamage(amount);

    // Hit flash visual feedback
    this.hitFlashTimer = 0.12;
    this.eyeMat.emissive.setHex(0xffffff);
    this.eyeMat.emissiveIntensity = 4.0;

    // Check phase transitions
    if (this.health.ratio <= 0.25 && this.phase < 3) {
      this.phase = 3;
      this.moveSpeed *= 1.2;
      this.hornMat.emissive.setHex(0xaa00ff);
      this.hornMat.emissiveIntensity = 3.0;
      if (this.onPhaseChange) this.onPhaseChange(3);
    } else if (this.health.ratio <= 0.6 && this.phase < 2) {
      this.phase = 2;
      this.moveSpeed *= 1.3;
      this.hornMat.emissive.setHex(0xff0000);
      this.hornMat.emissiveIntensity = 2.0;
      if (this.onPhaseChange) this.onPhaseChange(2);
    }

    if (!this.health.isAlive()) {
      this.die();
    }
  }

  private die(): void {
    this.mesh.visible = false;
    if (this.onDeath) this.onDeath();
  }

  update(delta: number, playerPos: THREE.Vector3, _isSubterranean: boolean = true): void {
    if (!this.health.isAlive()) return;

    // Update hit flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        const origEye = this.originalEmissiveValues.get(this.eyeMat);
        if (origEye) {
          this.eyeMat.emissive.copy(origEye.color);
          this.eyeMat.emissiveIntensity = origEye.intensity;
        }
      }
    }

    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.shockwaveCooldown > 0) this.shockwaveCooldown -= delta;

    // Distance to player
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    const distSq = dx * dx + dz * dz;
    const dist = Math.sqrt(distSq);

    // Turn towards player
    if (dist > 0.1) {
      const angle = Math.atan2(dx, dz);
      this.mesh.rotation.y = angle;
    }

    // Phase FSM Behavior
    // Phase 1: Pursuit & Melee
    // Phase 2: Rapid Pursuit & AOE Shockwave
    // Phase 3: Frenzy Pursuit & Frequent Attacks
    if (dist > this.attackRange) {
      const moveStep = this.moveSpeed * delta;
      this.mesh.position.x += (dx / dist) * moveStep;
      this.mesh.position.z += (dz / dist) * moveStep;
    } else {
      // Melee attack
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.phase === 3 ? 0.8 : this.phase === 2 ? 1.2 : 1.8;
        if (this.onAttack) this.onAttack();
      }
    }

    // Phase 2 & 3 AOE Shockwave attack
    if (this.phase >= 2 && dist < 12 && this.shockwaveCooldown <= 0) {
      this.shockwaveCooldown = this.phase === 3 ? 4.0 : 6.0;
      if (this.onAttack) this.onAttack();
    }
  }
}
