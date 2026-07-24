import * as THREE from 'three';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';
import { chooseMonsterVariant, getMonsterVariantProfile, type MonsterVariant } from '../world/monsterVariant';
import { EnemyProjectileSystem } from '../combat/EnemyProjectile';
import { PatternState, getPatternForVariant, calculateDirection } from '../combat/AttackPattern';
import { Health } from '../components/Health';
import { disposeObject3D, markSharedGeometry, markSharedMaterial } from '../utils/dispose';
import { ParticlePool } from '../combat/particles';
import { createFresnelMaterial } from '../render/materials';

const eyeMatCache = new Map<number, THREE.MeshStandardMaterial>();
function getOrCreateEyeMaterial(color: number): THREE.MeshStandardMaterial {
  let mat = eyeMatCache.get(color);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: new THREE.Color(color),
      emissiveIntensity: 2.0,
    });
    markSharedMaterial(mat);
    eyeMatCache.set(color, mat);
  }
  return mat;
}

let propellerMat: THREE.MeshStandardMaterial | null = null;
function getOrCreatePropellerMaterial(): THREE.MeshStandardMaterial {
  if (!propellerMat) {
    propellerMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 });
    markSharedMaterial(propellerMat);
  }
  return propellerMat;
}

let propellerGeo: THREE.BoxGeometry | null = null;
function getOrCreatePropellerGeometry(): THREE.BoxGeometry {
  if (!propellerGeo) {
    propellerGeo = new THREE.BoxGeometry(1.2, 0.02, 0.08);
    markSharedGeometry(propellerGeo);
  }
  return propellerGeo;
}

let healthBarBgGeo: THREE.PlaneGeometry | null = null;
function getOrCreateHealthBarBgGeo(): THREE.PlaneGeometry {
  if (!healthBarBgGeo) {
    healthBarBgGeo = new THREE.PlaneGeometry(1.2, 0.15);
    markSharedGeometry(healthBarBgGeo);
  }
  return healthBarBgGeo;
}

let healthBarFgGeo: THREE.BufferGeometry | null = null;
function getOrCreateHealthBarFgGeo(): THREE.BufferGeometry {
  if (!healthBarFgGeo) {
    const geo = new THREE.PlaneGeometry(1.2, 0.15);
    geo.translate(0.6, 0, 0);
    markSharedGeometry(geo);
    healthBarFgGeo = geo;
  }
  return healthBarFgGeo;
}

let healthBarBgMat: THREE.MeshBasicMaterial | null = null;
function getOrCreateHealthBarBgMat(): THREE.MeshBasicMaterial {
  if (!healthBarBgMat) {
    healthBarBgMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
    markSharedMaterial(healthBarBgMat);
  }
  return healthBarBgMat;
}

const SHARED_HEALTHBAR_MAT_GREEN = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
markSharedMaterial(SHARED_HEALTHBAR_MAT_GREEN);

const SHARED_HEALTHBAR_MAT_YELLOW = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
markSharedMaterial(SHARED_HEALTHBAR_MAT_YELLOW);

const SHARED_HEALTHBAR_MAT_RED = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
markSharedMaterial(SHARED_HEALTHBAR_MAT_RED);

export interface MonsterOptions {
  variant?: MonsterVariant;
  isWaveHorde?: boolean;
  onAttack?: () => void;
  onDeath?: () => void;
  onFootstep?: (position: THREE.Vector3) => void;
  particlePool?: ParticlePool;
}

export class Monster {
  mesh: THREE.Group;
  readonly variant: MonsterVariant;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly isWaveHorde: boolean;
  private state: 'wander' | 'chase' | 'attack' | 'dying' | 'dead' = 'wander';
  private targetPos = new THREE.Vector3();
  private health: Health;
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
  private headGroup: THREE.Group;
  private limbGroups: THREE.Group[] = [];
  private particlePool?: ParticlePool;
  private trailTimer = 0;

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
    this.isWaveHorde = options.isWaveHorde ?? false;
    this.onAttack = options.onAttack;
    this.onDeath = options.onDeath;
    this.onFootstep = options.onFootstep;
    this.particlePool = options.particlePool;
    const profile = getMonsterVariantProfile(this.variant);
    this.maxHp = profile.hp;
    this.moveSpeed = profile.speed;
    this.health = new Health(this.maxHp);
    this.health.onHealthChange((hp) => this.updateHealthBar(hp));
    this.mesh = new THREE.Group();

    // Red Horde Aura Light for Wave Monsters
    if (this.isWaveHorde) {
      const hordeLight = new THREE.PointLight(0xFF1744, 2.5, 6);
      hordeLight.position.set(0, profile.bodyHeight + 0.5, 0);
      this.mesh.add(hordeLight);
    }

    // Muzzle flash light
    this.muzzleFlash = new THREE.PointLight(0xff6600, 0, 8);
    this.muzzleFlash.visible = false;
    this.mesh.add(this.muzzleFlash);

    
    // Geometry and Material Caches for zero-allocation monster spawning
    const geoCache = new Map<string, THREE.BufferGeometry>();
    const getGeo = (type: string, w: number, h: number, d: number) => {
      const key = `${type}_${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
      let geo = geoCache.get(key);
      if (!geo) {
        switch (type) {
          case 'Capsule': geo = new THREE.CapsuleGeometry(w/2, h/2, 4, 8); break;
          case 'Dodecahedron': geo = new THREE.DodecahedronGeometry(Math.max(w,h,d)/2); break;
          case 'Icosahedron': geo = new THREE.IcosahedronGeometry(Math.max(w,h,d)/2); break;
          case 'Cylinder': geo = new THREE.CylinderGeometry(w/2, w/2, h, 8); break;
          case 'Torus': geo = new THREE.TorusGeometry(Math.max(w,d)/2, h/4, 8, 16); break;
          case 'Sphere': geo = new THREE.SphereGeometry(Math.max(w,h,d)/2, 16, 16); break;
          case 'Box':
          default: geo = new THREE.BoxGeometry(w, h, d); break;
        }
        markSharedGeometry(geo);
        geoCache.set(key, geo);
      }
      return geo;
    };

    const baseMat = createFresnelMaterial({
      color: profile.bodyColor,
      fresnelColor: profile.fresnelColor,
      fresnelIntensity: profile.fresnelIntensity
    });

    this.body = new THREE.Mesh(getGeo(profile.torsoType, profile.bodyWidth, profile.bodyHeight, profile.bodyDepth), baseMat);
    this.body.position.y = profile.bodyHeight * 0.55;
    this.mesh.add(this.body);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, profile.bodyHeight * 0.8, 0);
    this.mesh.add(this.headGroup);
    
    const headMesh = new THREE.Mesh(getGeo(profile.headType, profile.bodyWidth * 0.6, profile.bodyHeight * 0.4, profile.bodyDepth * 0.6), baseMat);
    this.headGroup.add(headMesh);

    // Eyes
    const eyeRadius = this.variant === 'brute' ? 0.16 : 0.12;
    const eyeGeoKey = `eye_${eyeRadius}`;
    let eyeGeo = geoCache.get(eyeGeoKey);
    if (!eyeGeo) {
      eyeGeo = new THREE.SphereGeometry(eyeRadius, 8, 8);
      markSharedGeometry(eyeGeo);
      geoCache.set(eyeGeoKey, eyeGeo);
    }

    const eyeMat = getOrCreateEyeMaterial(profile.eyeColor);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.22, 0.1, 0.25);
    this.headGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.22, 0.1, 0.25);
    this.headGroup.add(rightEye);

    // Limbs
    for (let i = -1; i <= 1; i += 2) {
      const limbGroup = new THREE.Group();
      limbGroup.position.set(i * profile.bodyWidth * 0.6, profile.bodyHeight * 0.5, 0);
      const limbMesh = new THREE.Mesh(getGeo(profile.limbType, 0.2, profile.bodyHeight * 0.5, 0.2), baseMat);
      limbMesh.position.y = -profile.bodyHeight * 0.25;
      limbGroup.add(limbMesh);
      this.mesh.add(limbGroup);
      this.limbGroups.push(limbGroup);
    }
    for (let i = -1; i <= 1; i += 2) {
      const limbGroup = new THREE.Group();
      limbGroup.position.set(i * profile.bodyWidth * 0.4, profile.bodyHeight * 0.2, 0);
      const limbMesh = new THREE.Mesh(getGeo(profile.limbType, 0.2, profile.bodyHeight * 0.4, 0.2), baseMat);
      limbMesh.position.y = -profile.bodyHeight * 0.2;
      limbGroup.add(limbMesh);
      this.mesh.add(limbGroup);
      this.limbGroups.push(limbGroup);
    }

    // Accents
    if (profile.accentType !== 'None') {
      const accentMat = createFresnelMaterial({
        color: profile.bodyColor,
        emissive: profile.fresnelColor,
        emissiveIntensity: 0.5,
        fresnelColor: profile.fresnelColor,
        fresnelIntensity: profile.fresnelIntensity * 1.5
      });
      const accent = new THREE.Mesh(getGeo(profile.accentType, profile.bodyWidth*1.1, profile.bodyHeight*0.2, profile.bodyDepth*1.1), accentMat);
      accent.position.y = profile.bodyHeight * 0.5;
      this.mesh.add(accent);
    }
    
    // Kept some iconic accessories
    if (this.variant === 'drone') {
      this.propeller = new THREE.Group();
      this.propeller.position.set(0, profile.bodyHeight * 1.1, 0);
      const bladeMat = getOrCreatePropellerMaterial();
      const bladeGeo = getOrCreatePropellerGeometry();
      const blades = new THREE.Mesh(bladeGeo, bladeMat);
      this.propeller.add(blades);
      this.mesh.add(this.propeller);
    }
    
    this.healthBarGroup = new THREE.Group();
    this.healthBarGroup.position.set(0, profile.bodyHeight + 0.6, 0);
    this.healthBarGroup.scale.setScalar(1.0 / profile.scale); // Keep size constant across different monster scales

    const hbBg = new THREE.Mesh(
      getOrCreateHealthBarBgGeo(),
      getOrCreateHealthBarBgMat()
    );
    this.healthBarGroup.add(hbBg);

    this.healthBarFg = new THREE.Mesh(
      getOrCreateHealthBarFgGeo(),
      SHARED_HEALTHBAR_MAT_GREEN
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

  get hp(): number {
    return this.health.hp;
  }

  getHp(): number {
    return this.health.hp;
  }

  isAlive(): boolean { return this.health.isAlive() && this.state !== 'dying'; }

  private updateHealthBar(hp: number): void {
    const hpRatio = Math.max(0, hp / this.maxHp);
    this.healthBarFg.scale.x = hpRatio;

    if (hpRatio > 0.6) {
      this.healthBarFg.material = SHARED_HEALTHBAR_MAT_GREEN;
    } else if (hpRatio > 0.3) {
      this.healthBarFg.material = SHARED_HEALTHBAR_MAT_YELLOW;
    } else {
      this.healthBarFg.material = SHARED_HEALTHBAR_MAT_RED;
    }
  }

  takeDamage(amount: number): void {
    if (!this.isAlive()) return;
    this.health.takeDamage(amount);

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

    if (!this.health.isAlive()) {
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
    if (!this.isAlive()) return;

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
        this.state = 'dead';
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

    // Articulated Limb Animations
    const moveSpeedRatio = this.state === 'chase' ? 1.5 : (this.state === 'attack' ? 1.0 : 0.5);
    const limbSwing = Math.sin(this.animationTime * 10 * moveSpeedRatio) * 0.5;
    for (let i = 0; i < this.limbGroups.length; i++) {
      const limb = this.limbGroups[i];
      // simple opposite swing for legs and arms
      const isLeg = i > 1; // Assuming first two are arms, next two are legs
      const side = (i % 2 === 0) ? 1 : -1;
      limb.rotation.x = isLeg ? limbSwing * side : -limbSwing * side;
    }

    // Particle Trail Emission
    if (this.particlePool) {
      this.trailTimer -= delta;
      if (this.trailTimer <= 0) {
        this.trailTimer = 0.05; // TRAIL_INTERVAL
        
        if (this.variant === 'drone') {
          this.particlePool.spawn('thruster', this.mesh.position.clone().add(new THREE.Vector3(0, 0, 0)), new THREE.Vector3((Math.random() - 0.5) * 2, -2, (Math.random() - 0.5) * 2), 0.5);
        } else if (this.variant === 'phantom') {
          this.particlePool.spawn('spectral_trail', this.mesh.position.clone().add(new THREE.Vector3(0, profile.bodyHeight * 0.5, 0)), new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random(), (Math.random() - 0.5) * 0.5), 1.0);
        } else if (this.variant === 'brute' && this.isLunging) {
          const spawnPos = this.mesh.position.clone();
          spawnPos.y = 0; // ground level
          this.particlePool.spawn('charge_dust', spawnPos, new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3), 0.8);
          if (Math.random() > 0.5) {
            this.particlePool.spawn('spark', spawnPos, new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 4, (Math.random() - 0.5) * 5), 0.6);
          }
        }
      }
    }

    // Billboard alignment: face the camera using camera quaternion
    if (camera && this.healthBarGroup) {
      const tempQuat = new THREE.Quaternion();
      this.mesh.getWorldQuaternion(tempQuat);
      this.healthBarGroup.quaternion.copy(tempQuat).invert().premultiply(camera.quaternion);
    }

    const dxP = this.mesh.position.x - playerPos.x;
    const dzP = this.mesh.position.z - playerPos.z;
    const horizDistToPlayer = Math.sqrt(dxP * dxP + dzP * dzP);
    const distToPlayer = this.mesh.position.distanceTo(playerPos);
    const hpRatio = this.health.ratio;
    const isLowHealth = hpRatio < 0.3;

    // Retreat behavior when low health
    if (isLowHealth && this.retreatTimer <= 0 && horizDistToPlayer < 15) {
      this.retreatTimer = 3.0; // Retreat for 3 seconds
    }

    if (this.retreatTimer > 0) {
      this.retreatTimer -= delta;
      this.state = 'chase';
      // Move away from player
      const awayDir = new THREE.Vector3().subVectors(this.mesh.position, playerPos).normalize();
      this.targetPos.copy(this.mesh.position).add(awayDir.multiplyScalar(20));
    }

    // State machine with improved AI (works from towers & high mountains)
    if (this.retreatTimer <= 0) {
      if ((horizDistToPlayer < this.attackRange * 1.5 || distToPlayer < this.attackRange) && this.canAttack()) {
        if (horizDistToPlayer > this.optimalAttackDistance) {
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
      } else if (horizDistToPlayer < 45) {
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
      } else if (this.state === 'chase' && horizDistToPlayer > 50) {
        this.state = 'wander';
        this.pickNewTarget();
      } else if (this.state === 'attack' && horizDistToPlayer > this.attackRange * 1.5) {
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
      const hx = (this.mesh.position.x / WORLD_SCALE) + (WORLD_SIZE / 2);
      const hz = (this.mesh.position.z / WORLD_SCALE) + (WORLD_SIZE / 2);
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
    const hx = (this.mesh.position.x / WORLD_SCALE) + (WORLD_SIZE / 2);
    const hz = (this.mesh.position.z / WORLD_SCALE) + (WORLD_SIZE / 2);
    const terrainHeight = heightMap.getInterpolated(hx, hz);
    if (this.variant === 'drone') {
      this.mesh.position.y = terrainHeight + 3.0;
    } else {
      this.mesh.position.y = terrainHeight;
    }

    // Face direction
    this.mesh.lookAt(this.targetPos.x, this.mesh.position.y, this.targetPos.z);
  }

  dispose(): void {
    disposeObject3D(this.mesh);
    this.healthBarFg = null as any;
    this.healthBarGroup = null as any;
  }
}
