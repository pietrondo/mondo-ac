import * as THREE from 'three';
import { InputManager } from '../controls/input';
import { Player } from '../entities/Player';
import { Monster } from '../entities/Monster';
import { ParticlePool } from '../combat/particles';
import { DamageNumber } from '../combat/DamageNumber';
import { HitMarker } from '../combat/HitMarker';
import { SoundManager } from '../utils/sound';
import { HUD } from '../ui/hud';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE } from '../config';
import { SKILLS } from '../config/skills';
import { eventBus } from '../events/EventBus';

interface ActiveGrenade {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  timer: number;
}

interface ActiveExplosionFx {
  ring: THREE.Mesh;
  light: THREE.PointLight;
  scale: number;
  maxScale: number;
  life: number;
}

export class SkillSystem {
  dashCooldown = 0;
  isDashing = false;
  private dashTimer = 0;

  grenadeCooldown = 0;
  private activeGrenades: ActiveGrenade[] = [];
  private explosionFxs: ActiveExplosionFx[] = [];

  shieldCooldown = 0;
  isShieldActive = false;
  private shieldTimer = 0;
  private shieldMesh: THREE.Mesh | null = null;

  constructor(private scene: THREE.Scene) {}

  update(
    delta: number,
    input: InputManager,
    player: Player,
    camera: THREE.PerspectiveCamera,
    monsters: Monster[],
    particlePool: ParticlePool,
    damageNumber: DamageNumber,
    hitMarker: HitMarker,
    soundManager: SoundManager,
    hud: HUD,
    heightMap: HeightMap
  ): void {
    // Cooldown timers
    if (this.dashCooldown > 0) this.dashCooldown -= delta;
    if (this.grenadeCooldown > 0) this.grenadeCooldown -= delta;
    if (this.shieldCooldown > 0) this.shieldCooldown -= delta;

    // Skill 1: Dash (Key Q)
    if (input.state.skillDash && this.dashCooldown <= 0 && player.isAlive()) {
      this.dashCooldown = SKILLS.dash.cooldown;
      this.isDashing = true;
      this.dashTimer = SKILLS.dash.duration;
      soundManager.playCollect();
      eventBus.emit('skill.activated', { skill: 'dash' });
    }
    if (this.isDashing) {
      this.dashTimer -= delta;
      const camDir = camera.getWorldDirection(new THREE.Vector3());
      camDir.y = 0;
      camDir.normalize();
      player.mesh.position.addScaledVector(camDir, SKILLS.dash.speed * delta);
      particlePool.spawn('dust', player.mesh.position.clone(), new THREE.Vector3(0, 1, 0), 0.3);
      if (this.dashTimer <= 0) this.isDashing = false;
    }

    // Skill 2: Grenade (Key F)
    if (input.state.skillGrenade && this.grenadeCooldown <= 0 && player.isAlive()) {
      this.grenadeCooldown = SKILLS.grenade.cooldown;
      const gGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const gMat = new THREE.MeshStandardMaterial({ color: 0xFF3D00, emissive: 0xFF5722, emissiveIntensity: 2.5 });
      const gMesh = new THREE.Mesh(gGeo, gMat);
      const spawnPos = camera.getWorldPosition(new THREE.Vector3()).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1.2));
      gMesh.position.copy(spawnPos);
      this.scene.add(gMesh);

      const dir = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(SKILLS.grenade.velocity);
      dir.y += 6;
      this.activeGrenades.push({ mesh: gMesh, velocity: dir, timer: SKILLS.grenade.timer });
      soundManager.playShot();
      eventBus.emit('skill.activated', { skill: 'grenade' });
    }

    // Update Grenades
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.timer -= delta;
      g.velocity.y -= SKILLS.grenade.gravity * delta; // Realistic gravity
      g.mesh.position.addScaledVector(g.velocity, delta);
      g.mesh.rotation.x += 10 * delta;
      g.mesh.rotation.z += 8 * delta;

      // Ground height check
      const gx = g.mesh.position.x;
      const gz = g.mesh.position.z;
      const hx = (gx / WORLD_SCALE) + 128;
      const hz = (gz / WORLD_SCALE) + 128;
      const groundY = heightMap.getInterpolated(hx, hz);

      // Check collision with ground or enemies
      let hitEnemy = false;
      for (const m of monsters) {
        if (m.isAlive() && m.mesh.position.distanceTo(g.mesh.position) < 1.8) {
          hitEnemy = true;
          break;
        }
      }

      const hitGround = g.mesh.position.y <= groundY + 0.3;

      if (hitGround || hitEnemy || g.timer <= 0) {
        const expPos = g.mesh.position.clone();
        if (hitGround) expPos.y = groundY + 0.1;

        this.scene.remove(g.mesh);
        soundManager.playCollect();
        player.shakeIntensity = Math.max(player.shakeIntensity, 1.6); // Explosive camera shake

        // Create Shockwave Ring FX
        const ringGeo = new THREE.RingGeometry(0.2, 0.6, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFAB00, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(expPos).add(new THREE.Vector3(0, 0.15, 0));
        this.scene.add(ringMesh);

        // Flash Light
        const expLight = new THREE.PointLight(0xFF6D00, 15, 25);
        expLight.position.copy(expPos).add(new THREE.Vector3(0, 1.5, 0));
        this.scene.add(expLight);

        this.explosionFxs.push({ ring: ringMesh, light: expLight, scale: 1.0, maxScale: 14.0, life: 0.35 });

        // Spawn 45+ particles (sparks, dust, fire burst)
        for (let p = 0; p < 45; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 6 + Math.random() * 18;
          const upSpeed = 2 + Math.random() * 12;
          const vel = new THREE.Vector3(Math.cos(angle) * speed, upSpeed, Math.sin(angle) * speed);
          particlePool.spawn(Math.random() < 0.5 ? 'spark' : 'dust', expPos.clone(), vel, 0.5 + Math.random() * 0.5);
        }

        // Deal AOE Damage + Knockback
        let totalHits = 0;
        for (const monster of monsters) {
          if (monster.isAlive()) {
            const dist = monster.mesh.position.distanceTo(expPos);
            if (dist <= SKILLS.grenade.radius) {
              const damage = Math.round(SKILLS.grenade.damage * (1 - dist / 15));
              monster.takeDamage(damage);
              damageNumber.show(damage, monster.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), true, true);
              totalHits++;

              // Knockback impulse away from explosion
              const pushDir = monster.mesh.position.clone().sub(expPos).normalize();
              pushDir.y = 0.3;
              monster.mesh.position.addScaledVector(pushDir, Math.max(1, 4 - dist * 0.3));
            }
          }
        }
        if (totalHits > 0) {
          hitMarker.trigger(true);
        }

        this.activeGrenades.splice(i, 1);
      }
    }

    // Update Explosion FXs (shockwave ring expansion & light fade)
    for (let i = this.explosionFxs.length - 1; i >= 0; i--) {
      const fx = this.explosionFxs[i];
      fx.life -= delta;
      fx.scale += (fx.maxScale - fx.scale) * 12 * delta;
      fx.ring.scale.set(fx.scale, fx.scale, fx.scale);
      (fx.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, fx.life / 0.35);
      fx.light.intensity = 15 * (fx.life / 0.35);

      if (fx.life <= 0) {
        this.scene.remove(fx.ring);
        this.scene.remove(fx.light);
        this.explosionFxs.splice(i, 1);
      }
    }

    // Skill 3: Shield (Key C)
    if (input.state.skillShield && this.shieldCooldown <= 0 && player.isAlive()) {
      this.shieldCooldown = SKILLS.shield.cooldown;
      this.isShieldActive = true;
      this.shieldTimer = SKILLS.shield.duration;
      soundManager.playCollect();
      if (!this.shieldMesh) {
        this.shieldMesh = new THREE.Mesh(
          new THREE.SphereGeometry(SKILLS.shield.radius, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xB388FF, transparent: true, opacity: 0.4, emissive: 0xB388FF, emissiveIntensity: 1.5 })
        );
        this.scene.add(this.shieldMesh);
      }
      this.shieldMesh.visible = true;
      eventBus.emit('skill.activated', { skill: 'shield' });
    }

    if (this.isShieldActive) {
      this.shieldTimer -= delta;
      if (this.shieldMesh) this.shieldMesh.position.copy(player.mesh.position).add(new THREE.Vector3(0, 1, 0));
      if (this.shieldTimer <= 0) {
        this.isShieldActive = false;
        if (this.shieldMesh) this.shieldMesh.visible = false;
      }
    }

    eventBus.emit('skill.cooldown', {
      dash: this.dashCooldown,
      grenade: this.grenadeCooldown,
      shield: this.shieldCooldown,
    });
    hud.updateSkillCooldowns(this.dashCooldown, this.grenadeCooldown, this.shieldCooldown);
  }
}
