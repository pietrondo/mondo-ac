import * as THREE from 'three';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE } from '../config';
import { chooseMonsterVariant, getMonsterVariantProfile, type MonsterVariant } from '../world/monsterVariant';
import { EnemyProjectileSystem } from '../combat/EnemyProjectile';
import { PatternState, getPatternForVariant, calculateDirection } from '../combat/AttackPattern';

export interface MonsterOptions {
  variant?: MonsterVariant;
  onAttack?: () => void;
  onDeath?: () => void;
  onFootstep?: (position: THREE.Vector3) => void;
}

export class Monster {
  mesh: THREE.Group;
  readonly variant: MonsterVariant;
  readonly maxHp: number;
  readonly moveSpeed: number;
  private state: 'wander' | 'chase' | 'attack' | 'dying' = 'wander';
  private targetPos = new THREE.Vector3();
  private hp: number;
  private alive = true;
  private attackCooldown = 0;
  private readonly attackRange = 25;
  private readonly optimalAttackDistance = 15;
  private projectileSystem: EnemyProjectileSystem | null = null;
  private onAttack?: () => void;
  private onDeath?: () => void;
  private onFootstep?: (position: THREE.Vector3) => void;

  private healthBarGroup: THREE.Group;
  private healthBarFg: THREE.Mesh;
  private propeller?: THREE.Group;
  private body: THREE.Mesh;

  private hitFlashTimer = 0;
  private originalEmissiveValues = new Map<THREE.MeshStandardMaterial, { color: THREE.Color, intensity: number }>();
  private animationTime = 0;
  private footstepAccumulator = 0;
  private dyingTimer = 0;

  // AI behavior
  private strafeDirection = 1;
  private strafeTimer = 0;
  private retreatTimer = 0;
  private flankAngle = 0;

  // Attack pattern system
  private patternState: PatternState;
  private chargeStartPos?: THREE.Vector3;
  private chargeTargetPos?: THREE.Vector3;
  private chargeProgress = 0;
  private isLunging = false;

  // Muzzle flash
  private muzzleFlash?: THREE.PointLight;
  private muzzleFlashTimer = 0;

  constructor(position: THREE.Vector3, options: MonsterOptions = {}) {
    this.variant = options.variant ?? chooseMonsterVariant(position);
    this.onAttack = options.onAttack;
    this.onDeath = options.onDeath;
    this.onFootstep = options.onFootstep;
    const profile = getMonsterVariantProfile(this.variant);
    this.maxHp = profile.hp;
    this.moveSpeed = profile.speed;
    this.hp = this.maxHp;
    this.mesh = new THREE.Group();

    // Muzzle flash light
    this.muzzleFlash = new THREE.PointLight(0xff6600, 0, 8);
    this.muzzleFlash.visible = false;
    this.mesh.add(this.muzzleFlash);

    this.body = new THREE.Mesh(
      new THREE.BoxGeometry(profile.bodyWidth, profile.bodyHeight, profile.bodyDepth),
      new THREE.MeshStandardMaterial({ color: profile.bodyColor, flatShading: true })
    );
    this.body.position.y = profile.bodyHeight * 0.55;
    this.mesh.add(this.body);

    // Glowing emissive eyes
    const eyeGeo = new THREE.SphereGeometry(this.variant === 'brute' ? 0.16 : 0.12, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: profile.eyeColor,
      emissive: new THREE.Color(profile.eyeColor),
      emissiveIntensity: 2.0,
    });
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

      // Spikes added to brute variant
      const spikeGeo = new THREE.ConeGeometry(0.08, 0.3, 4);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });
      for (let i = 0; i < 4; i++) {
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.set(
          (i % 2 === 0 ? -0.3 : 0.3),
          profile.bodyHeight * 0.9,
          (-0.2 - Math.floor(i / 2) * 0.3)
        );
        spike.rotation.x = -Math.PI / 4;
        spike.rotation.z = i % 2 === 0 ? -Math.PI / 6 : Math.PI / 6;
        this.mesh.add(spike);
      }
    }

    if (this.variant === 'barbone') {
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.9, flatShading: true });

      // Handlebar Mustache (left & right)
      const stacheLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.2), hairMat);
      stacheLeft.position.set(-0.25, profile.bodyHeight * 0.65, profile.bodyDepth * 0.45);
      stacheLeft.rotation.z = -0.2;
      this.mesh.add(stacheLeft);

      const stacheRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.2), hairMat);
      stacheRight.position.set(0.25, profile.bodyHeight * 0.65, profile.bodyDepth * 0.45);
      stacheRight.rotation.z = 0.2;
      this.mesh.add(stacheRight);

      // Long Wizard Beard
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 6), hairMat);
      beard.rotation.x = Math.PI;
      beard.position.set(0, profile.bodyHeight * 0.35, profile.bodyDepth * 0.4);
      this.mesh.add(beard);

      // Long Bushy Hair
      const hairTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), hairMat);
      hairTop.position.set(0, profile.bodyHeight * 1.05, 0);
      this.mesh.add(hairTop);
    }

    if (this.variant === 'punk') {
      const mohawkMat = new THREE.MeshStandardMaterial({
        color: 0xFF007F,
        emissive: new THREE.Color(0xFF0055),
        emissiveIntensity: 0.8,
        flatShading: true
      });

      // Spiky Neon Mohawk Hair
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 4), mohawkMat);
        spike.position.set(0, profile.bodyHeight * (0.95 + i * 0.05), profile.bodyDepth * 0.3 - i * 0.15);
        spike.rotation.x = -0.2 - i * 0.1;
        this.mesh.add(spike);
      }
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

      // Glowing runes added to golem variant
      const runeMat = new THREE.MeshStandardMaterial({
        color: 0x00E5FF,
        emissive: new THREE.Color(0x00E5FF),
        emissiveIntensity: 2.0,
        flatShading: true
      });
      const chestRune = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.05), runeMat);
      chestRune.position.set(0, profile.bodyHeight * 0.6, profile.bodyDepth * 0.51);
      this.mesh.add(chestRune);

      const chestRuneCross = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.05), runeMat);
      chestRuneCross.position.set(0, profile.bodyHeight * 0.7, profile.bodyDepth * 0.51);
      this.mesh.add(chestRuneCross);
    }

    if (this.variant === 'crawler') {
      const legMat = new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true });
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
      const legPositions = [
        { pos: [-0.6, 0.2, -0.4], rot: [0, 0, Math.PI / 4] },
        { pos: [-0.7, 0.2, 0], rot: [0, 0, Math.PI / 3] },
        { pos: [-0.6, 0.2, 0.4], rot: [0, 0, Math.PI / 4] },
        { pos: [0.6, 0.2, -0.4], rot: [0, 0, -Math.PI / 4] },
        { pos: [0.7, 0.2, 0], rot: [0, 0, -Math.PI / 3] },
        { pos: [0.6, 0.2, 0.4], rot: [0, 0, -Math.PI / 4] }
      ];
      for (const legInfo of legPositions) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(legInfo.pos[0], legInfo.pos[1], legInfo.pos[2]);
        leg.rotation.set(legInfo.rot[0], legInfo.rot[1], legInfo.rot[2]);
        this.mesh.add(leg);
      }

      // Spider eyes added to crawler variant (6 extra eyes in a front cluster)
      const spiderEyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const spiderEyeMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: new THREE.Color(0xff0000),
        emissiveIntensity: 2.0,
      });
      const spiderEyeCoords = [
        [-0.15, profile.bodyHeight * 0.55, profile.bodyDepth * 0.51],
        [0.15, profile.bodyHeight * 0.55, profile.bodyDepth * 0.51],
        [-0.3, profile.bodyHeight * 0.65, profile.bodyDepth * 0.51],
        [0.3, profile.bodyHeight * 0.65, profile.bodyDepth * 0.51],
        [-0.1, profile.bodyHeight * 0.75, profile.bodyDepth * 0.51],
        [0.1, profile.bodyHeight * 0.75, profile.bodyDepth * 0.51],
      ];
      for (const coord of spiderEyeCoords) {
        const spiderEye = new THREE.Mesh(spiderEyeGeo, spiderEyeMat);
        spiderEye.position.set(coord[0], coord[1], coord[2]);
        this.mesh.add(spiderEye);
      }
    }

    if (this.variant === 'drone') {
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x00bcd4, metalness: 0.9, roughness: 0.1, flatShading: true });
      const ringGeo = new THREE.TorusGeometry(0.7, 0.1, 8, 24);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = profile.bodyHeight * 0.55;
      this.mesh.add(ring);

      // Spinning propeller shaft and blades
      const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
      const shaftMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(0, profile.bodyHeight * 0.95, 0);
      this.mesh.add(shaft);

      this.propeller = new THREE.Group();
      this.propeller.position.set(0, profile.bodyHeight * 1.1, 0);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 });
      const blades = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.08), bladeMat);
      this.propeller.add(blades);
      this.mesh.add(this.propeller);
    }

    if (this.variant === 'sentinel') {
      // Shoulder-mounted cannons
      const cannonMat = new THREE.MeshStandardMaterial({ color: 0x37474F, metalness: 0.8, roughness: 0.3, flatShading: true });
      const leftCannon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.6, 8), cannonMat);
      leftCannon.position.set(-0.55, profile.bodyHeight * 0.85, 0.3);
      leftCannon.rotation.x = Math.PI / 4;
      this.mesh.add(leftCannon);
      const rightCannon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.6, 8), cannonMat);
      rightCannon.position.set(0.55, profile.bodyHeight * 0.85, 0.3);
      rightCannon.rotation.x = Math.PI / 4;
      this.mesh.add(rightCannon);

      // Glowing chest core
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00ACC1,
        emissive: new THREE.Color(0x00ACC1),
        emissiveIntensity: 2.5,
        metalness: 0.9,
        roughness: 0.1,
      });
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), coreMat);
      core.position.set(0, profile.bodyHeight * 0.5, profile.bodyDepth * 0.52);
      this.mesh.add(core);
    }

    if (this.variant === 'annihilator') {
      // Massive shoulder plates
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x263238, flatShading: true });
      const leftPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), plateMat);
      leftPlate.position.set(-0.9, profile.bodyHeight * 0.8, 0);
      leftPlate.rotation.z = -0.3;
      this.mesh.add(leftPlate);
      const rightPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), plateMat);
      rightPlate.position.set(0.9, profile.bodyHeight * 0.8, 0);
      rightPlate.rotation.z = 0.3;
      this.mesh.add(rightPlate);

      // Multi-barrel cannon
      const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.95, roughness: 0.2 });
      for (let i = -1; i <= 1; i++) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6), barrelMat);
        barrel.position.set(i * 0.18, profile.bodyHeight * 0.95, profile.bodyDepth * 0.55);
        barrel.rotation.x = Math.PI / 2.5;
        this.mesh.add(barrel);
      }

      // Glowing eye slit
      const eyeSlitMat = new THREE.MeshStandardMaterial({
        color: 0xFF6D00,
        emissive: new THREE.Color(0xFF6D00),
        emissiveIntensity: 3.0,
      });
      const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.05), eyeSlitMat);
      eyeSlit.position.set(0, profile.bodyHeight * 0.78, profile.bodyDepth * 0.51);
      this.mesh.add(eyeSlit);
    }

    if (this.variant === 'phantom') {
      // Floating aura blades
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xEA80FC,
        emissive: new THREE.Color(0xEA80FC),
        emissiveIntensity: 2.5,
        flatShading: true
      });
      const leftBlade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.8, 4), bladeMat);
      leftBlade.position.set(-0.55, profile.bodyHeight * 0.9, 0);
      leftBlade.rotation.z = Math.PI / 4;
      this.mesh.add(leftBlade);
      const rightBlade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.8, 4), bladeMat);
      rightBlade.position.set(0.55, profile.bodyHeight * 0.9, 0);
      rightBlade.rotation.z = -Math.PI / 4;
      this.mesh.add(rightBlade);
    }

    if (this.variant === 'titan') {
      // Massive dual cannons & chest reactor core
      const titanMetal = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
      const cannonL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 1.2, 8), titanMetal);
      cannonL.position.set(-1.1, profile.bodyHeight * 0.85, 0.2);
      cannonL.rotation.x = Math.PI / 2;
      this.mesh.add(cannonL);
      const cannonR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 1.2, 8), titanMetal);
      cannonR.position.set(1.1, profile.bodyHeight * 0.85, 0.2);
      cannonR.rotation.x = Math.PI / 2;
      this.mesh.add(cannonR);

      // Glowing red reactor core
      const reactorMat = new THREE.MeshStandardMaterial({
        color: 0xFF1744,
        emissive: new THREE.Color(0xFF1744),
        emissiveIntensity: 3.5,
      });
      const reactor = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), reactorMat);
      reactor.position.set(0, profile.bodyHeight * 0.55, profile.bodyDepth * 0.52);
      this.mesh.add(reactor);
    }

    // Health bar construction above monster mesh
    this.healthBarGroup = new THREE.Group();
    this.healthBarGroup.position.set(0, profile.bodyHeight + 0.6, 0);
    this.healthBarGroup.scale.setScalar(1.0 / profile.scale); // Keep size constant across different monster scales

    const hbBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.15),
      new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide })
    );
    this.healthBarGroup.add(hbBg);

    const hbFgGeo = new THREE.PlaneGeometry(1.2, 0.15);
    hbFgGeo.translate(0.6, 0, 0); // align pivot to the left
    this.healthBarFg = new THREE.Mesh(
      hbFgGeo,
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    this.healthBarFg.position.x = -0.6; // shift back so left edge aligns with container center
    this.healthBarGroup.add(this.healthBarFg);

    this.mesh.add(this.healthBarGroup);

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.mesh.scale.setScalar(profile.scale);
    this.mesh.position.copy(position);
    if (this.variant === 'drone') {
      this.mesh.position.y += 3.0;
    }
    this.pickNewTarget();

    // Initialize attack pattern
    const pattern = getPatternForVariant(this.variant);
    this.patternState = new PatternState(pattern);
  }

  isAlive(): boolean { return this.alive && this.hp > 0 && this.state !== 'dying'; }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.hp -= amount;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    this.healthBarFg.scale.x = hpRatio;

    // Shift color from green to yellow to red
    if (hpRatio > 0.6) {
      (this.healthBarFg.material as THREE.MeshBasicMaterial).color.setHex(0x00ff00);
    } else if (hpRatio > 0.3) {
      (this.healthBarFg.material as THREE.MeshBasicMaterial).color.setHex(0xffff00);
    } else {
      (this.healthBarFg.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
    }

    // Set hit flash timer and cache original materials' emissive values
    this.hitFlashTimer = 0.15;
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        let isHB = false;
        child.traverseAncestors((ancestor) => {
          if (ancestor === this.healthBarGroup) {
            isHB = true;
          }
        });
        if (!isHB) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          for (const mat of mats) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              if (!this.originalEmissiveValues.has(mat)) {
                this.originalEmissiveValues.set(mat, {
                  color: mat.emissive.clone(),
                  intensity: mat.emissiveIntensity
                });
              }
            }
          }
        }
      }
    });

    if (this.hp <= 0) {
      this.state = 'dying';
      this.dyingTimer = 0;

      if (this.onDeath) {
        this.onDeath();
      }
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

  private getAttackParams(): { speed: number; damage: number; color: number; size: number; cooldown: number; burst?: number; burstDelay?: number } {
    switch (this.variant) {
      case 'scout':
        return { speed: 45, damage: 8, color: 0x4caf50, size: 0.08, cooldown: 1.0 };
      case 'brute':
        return { speed: 25, damage: 20, color: 0xd32f2f, size: 0.25, cooldown: 2.5 };
      case 'golem':
        return { speed: 15, damage: 30, color: 0xff0000, size: 0.45, cooldown: 3.0 };
      case 'crawler':
        return { speed: 35, damage: 15, color: 0xd32f2f, size: 0.12, cooldown: 1.5, burst: 3, burstDelay: 0.15 };
      case 'drone':
        return { speed: 40, damage: 10, color: 0x00e5ff, size: 0.15, cooldown: 1.2, burst: 5, burstDelay: 0.08 };
      case 'phantom':
        return { speed: 50, damage: 14, color: 0xEA80FC, size: 0.14, cooldown: 1.2 };
      case 'titan':
        return { speed: 30, damage: 25, color: 0xFF1744, size: 0.35, cooldown: 2.8 };
      case 'stalker':
      default:
        return { speed: 35, damage: 12, color: 0xff3333, size: 0.15, cooldown: 1.5 };
    }
  }

  private attack(playerPos: THREE.Vector3, delta: number): void {
    if (!this.projectileSystem) return;

    // Handle charge attack (brute)
    if (this.isLunging) {
      this.updateCharge(delta, playerPos);
      return;
    }

    // Start new attack pattern if cooldown is ready
    if (this.attackCooldown <= 0 && !this.patternState.active) {
      const pattern = getPatternForVariant(this.variant);
      this.patternState = new PatternState(pattern);
      this.patternState.start();

      // Start charge for brute
      if (this.variant === 'brute' && pattern.chargeDistance) {
        this.startCharge(playerPos);
        return;
      }
    }

    // Process active pattern
    if (this.patternState.active) {
      // Check if pattern has more shots to fire
      if (this.patternState.shouldFire()) {
        this.firePatternShot(playerPos);
        this.patternState.shotCount++;
      }

      // Advance pattern timer
      this.patternState.advance(delta);

      if (this.patternState.isComplete()) {
        this.patternState.reset();
        const params = this.getAttackParams();
        this.attackCooldown = params.cooldown;
      }
    }
  }

  private startCharge(playerPos: THREE.Vector3): void {
    this.isLunging = true;
    this.chargeProgress = 0;
    this.chargeStartPos = this.mesh.position.clone();
    this.chargeTargetPos = playerPos.clone();
    this.chargeTargetPos.y = this.mesh.position.y;
    this.patternState.start();
  }

  private updateCharge(delta: number, playerPos: THREE.Vector3): void {
    if (!this.isLunging || !this.chargeStartPos || !this.chargeTargetPos) return;

    this.chargeProgress += delta * 3;

    if (this.chargeProgress >= 1) {
      this.isLunging = false;
      this.mesh.position.copy(this.chargeTargetPos);
      this.chargeProgress = 0;
      this.patternState.reset();
      const params = this.getAttackParams();
      this.attackCooldown = params.cooldown;
      return;
    }

    const currentPos = new THREE.Vector3().lerpVectors(this.chargeStartPos, this.chargeTargetPos, this.chargeProgress);
    this.mesh.position.copy(currentPos);

    if (this.patternState.shouldFire()) {
      this.firePatternShot(playerPos);
      this.patternState.shotCount++;
    }
    this.patternState.advance(delta);
  }

  private firePatternShot(playerPos: THREE.Vector3): void {
    if (!this.projectileSystem) return;

    const params = this.getAttackParams();
    const eyePos = this.mesh.position.clone();
    eyePos.y += 1.5;

    const baseDir = new THREE.Vector3().subVectors(playerPos, eyePos).normalize();
    const dir = calculateDirection(this.patternState.pattern, this.patternState.shotCount, baseDir, this.variant);

    // Add slight random spread for some variants
    if (this.variant === 'drone' || this.variant === 'crawler') {
      const spread = 0.08;
      dir.x += (Math.random() - 0.5) * spread;
      dir.z += (Math.random() - 0.5) * spread;
      dir.normalize();
    }

    this.projectileSystem.spawn(eyePos, dir, {
      speed: params.speed,
      damage: params.damage,
      color: params.color,
      size: params.size,
    });

    // Trigger muzzle flash
    if (this.muzzleFlash) {
      this.muzzleFlash.position.copy(eyePos);
      this.muzzleFlash.position.y += 0.3;
      this.muzzleFlash.intensity = 3;
      this.muzzleFlash.visible = true;
      this.muzzleFlashTimer = 0.1;
    }

    this.onAttack?.();
  }

  update(delta: number, heightMap: HeightMap, playerPos: THREE.Vector3, camera?: THREE.Camera, allMonsters?: Monster[]): void {
    if (!this.alive) return;

    // Death animation: shrink, fade, spin, then die
    if (this.state === 'dying') {
      this.dyingTimer += delta;
      const deathDuration = 1.2;
      const progress = Math.min(this.dyingTimer / deathDuration, 1.0);
      
      // Shrink the mesh
      const scale = 1.0 - progress * 0.9;
      this.mesh.scale.setScalar(scale);
      
      // Spin while dying
      this.mesh.rotation.y += delta * 8.0;
      this.mesh.rotation.x = progress * Math.PI * 0.5;
      
      // Fade opacity by reducing emissive intensity
      const fadeIntensity = 1.0 - progress;
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          for (const mat of mats) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissiveIntensity = fadeIntensity * 0.5;
            }
          }
        }
      });
      
      // Hide health bar
      this.healthBarGroup.visible = false;
      
      // Complete death
      if (progress >= 1.0) {
        this.alive = false;
        this.mesh.visible = false;
        
        // Restore original emissive values
        for (const [mat, original] of this.originalEmissiveValues.entries()) {
          mat.emissive.copy(original.color);
          mat.emissiveIntensity = original.intensity;
        }
      }
      return;
    }

    this.animationTime += delta;
    const profile = getMonsterVariantProfile(this.variant);
    
    // Sine-wave breathing/bobbing
    const breathSpeed = 3.0;
    const breathScaleY = 1.0 + Math.sin(this.animationTime * breathSpeed) * 0.04;
    const breathScaleXZ = 1.0 - Math.sin(this.animationTime * breathSpeed) * 0.015;
    this.body.scale.set(breathScaleXZ, breathScaleY, breathScaleXZ);

    const bob = Math.sin(this.animationTime * breathSpeed) * 0.04;
    this.body.position.y = (profile.bodyHeight * 0.55) + bob;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.hitFlashTimer = 0;
        for (const [mat, original] of this.originalEmissiveValues.entries()) {
          mat.emissive.copy(original.color);
          mat.emissiveIntensity = original.intensity;
        }
      } else {
        const flashColor = Math.floor(this.hitFlashTimer * 30) % 2 === 0 ? new THREE.Color(0xff0000) : new THREE.Color(0xffffff);
        for (const [mat] of this.originalEmissiveValues.entries()) {
          mat.emissive.copy(flashColor);
          mat.emissiveIntensity = 4.0;
        }
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // Muzzle flash decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlash!.visible = false;
        this.muzzleFlash!.intensity = 0;
      }
    }

    // Spin propeller if drone
    if (this.propeller) {
      this.propeller.rotation.y += delta * 18.0;
    }

    // Billboard alignment: face the camera using camera quaternion
    if (camera && this.healthBarGroup) {
      const tempQuat = new THREE.Quaternion();
      this.mesh.getWorldQuaternion(tempQuat);
      this.healthBarGroup.quaternion.copy(tempQuat).invert().premultiply(camera.quaternion);
    }

    const distToPlayer = this.mesh.position.distanceTo(playerPos);
    const hpRatio = this.hp / this.maxHp;
    const isLowHealth = hpRatio < 0.3;

    // Retreat behavior when low health
    if (isLowHealth && this.retreatTimer <= 0 && distToPlayer < 15) {
      this.retreatTimer = 3.0; // Retreat for 3 seconds
    }

    if (this.retreatTimer > 0) {
      this.retreatTimer -= delta;
      this.state = 'chase';
      // Move away from player
      const awayDir = new THREE.Vector3().subVectors(this.mesh.position, playerPos).normalize();
      this.targetPos.copy(this.mesh.position).add(awayDir.multiplyScalar(20));
    }

    // State machine with improved AI
    if (this.retreatTimer <= 0) {
      if (distToPlayer < this.attackRange && this.canAttack()) {
        if (distToPlayer > this.optimalAttackDistance) {
          this.state = 'chase';
          this.targetPos.copy(playerPos);
        } else {
          this.state = 'attack';
          this.attack(playerPos, delta);
          
          // Strafing behavior during attack
          this.strafeTimer -= delta;
          if (this.strafeTimer <= 0) {
            this.strafeDirection *= -1; // Change direction
            this.strafeTimer = 1.5 + Math.random() * 1.5; // Change every 1.5-3 seconds
          }
        }
      } else if (distToPlayer < 25) {
        this.state = 'chase';
        // Flanking behavior: approach from different angles
        if (allMonsters && allMonsters.length > 1) {
          const myIndex = allMonsters.indexOf(this);
          const angleOffset = (myIndex / allMonsters.length) * Math.PI * 2;
          this.flankAngle = angleOffset;
          
          const flankDir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
          const perpDir = new THREE.Vector3(-flankDir.z, 0, flankDir.x);
          const flankOffset = perpDir.multiplyScalar(Math.sin(this.flankAngle) * 8);
          this.targetPos.copy(playerPos).add(flankOffset);
        } else {
          this.targetPos.copy(playerPos);
        }
      } else if (this.state === 'chase' && distToPlayer > 35) {
        this.state = 'wander';
        this.pickNewTarget();
      } else if (this.state === 'attack' && distToPlayer > this.attackRange) {
        this.state = 'chase';
        this.targetPos.copy(playerPos);
      }
    }

    // Face player when attacking
    if (this.state === 'attack') {
      this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
      
      // Apply strafing movement
      const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
      const strafeVec = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).multiplyScalar(this.strafeDirection);
      const strafeSpeed = this.moveSpeed * 0.6;
      this.mesh.position.x += strafeVec.x * strafeSpeed * delta;
      this.mesh.position.z += strafeVec.z * strafeSpeed * delta;
      
      // Update height after strafing
      const hx = (this.mesh.position.x / WORLD_SCALE) + 128;
      const hz = (this.mesh.position.z / WORLD_SCALE) + 128;
      const terrainHeight = heightMap.getInterpolated(hx, hz);
      if (this.variant === 'drone') {
        this.mesh.position.y = terrainHeight + 3.0;
      } else {
        this.mesh.position.y = terrainHeight;
      }
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
    const dx = dir.x * moveSpeed * delta;
    const dz = dir.z * moveSpeed * delta;
    this.mesh.position.x += dx;
    this.mesh.position.z += dz;

    // Track footstep intervals for heavy variants (brute, golem)
    if (this.variant === 'brute' || this.variant === 'golem') {
      const stepDist = Math.sqrt(dx * dx + dz * dz);
      this.footstepAccumulator += stepDist;
      const stepInterval = this.variant === 'golem' ? 4.0 : 3.0;
      if (this.footstepAccumulator >= stepInterval) {
        this.footstepAccumulator -= stepInterval;
        if (this.onFootstep) {
          this.onFootstep(this.mesh.position);
        }
      }
    }

    // Update height
    const hx = (this.mesh.position.x / WORLD_SCALE) + 128;
    const hz = (this.mesh.position.z / WORLD_SCALE) + 128;
    const terrainHeight = heightMap.getInterpolated(hx, hz);
    if (this.variant === 'drone') {
      this.mesh.position.y = terrainHeight + 3.0;
    } else {
      this.mesh.position.y = terrainHeight;
    }

    // Face direction
    this.mesh.lookAt(this.targetPos.x, this.mesh.position.y, this.targetPos.z);
  }
}
