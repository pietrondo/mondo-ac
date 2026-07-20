import * as THREE from 'three';
import { InputManager } from '../controls/input';
import { Player } from '../entities/Player';
import { Monster } from '../entities/Monster';
import { ParticlePool } from '../combat/particles';
import { DamageNumber } from '../combat/DamageNumber';
import { HitMarker } from '../combat/HitMarker';
import { SoundManager } from '../utils/sound';
import { HUD } from '../ui/hud';

interface ActiveGrenade {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  timer: number;
}

export class SkillSystem {
  dashCooldown = 0;
  isDashing = false;
  private dashTimer = 0;

  grenadeCooldown = 0;
  private activeGrenades: ActiveGrenade[] = [];

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
    hud: HUD
  ): void {
    // Cooldown timers
    if (this.dashCooldown > 0) this.dashCooldown -= delta;
    if (this.grenadeCooldown > 0) this.grenadeCooldown -= delta;
    if (this.shieldCooldown > 0) this.shieldCooldown -= delta;

    // Skill 1: Dash (Key Q)
    if (input.state.skillDash && this.dashCooldown <= 0 && player.isAlive()) {
      this.dashCooldown = 5.0;
      this.isDashing = true;
      this.dashTimer = 0.4;
      soundManager.playCollect();
    }
    if (this.isDashing) {
      this.dashTimer -= delta;
      const camDir = camera.getWorldDirection(new THREE.Vector3());
      camDir.y = 0;
      camDir.normalize();
      player.mesh.position.addScaledVector(camDir, 28 * delta);
      particlePool.spawn('dust', player.mesh.position.clone(), new THREE.Vector3(0, 1, 0), 0.3);
      if (this.dashTimer <= 0) this.isDashing = false;
    }

    // Skill 2: Grenade (Key F)
    if (input.state.skillGrenade && this.grenadeCooldown <= 0 && player.isAlive()) {
      this.grenadeCooldown = 8.0;
      const gGeo = new THREE.SphereGeometry(0.25, 8, 8);
      const gMat = new THREE.MeshStandardMaterial({ color: 0xFF9100, emissive: 0xFF9100, emissiveIntensity: 2.0 });
      const gMesh = new THREE.Mesh(gGeo, gMat);
      const spawnPos = camera.getWorldPosition(new THREE.Vector3()).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1.2));
      gMesh.position.copy(spawnPos);
      this.scene.add(gMesh);

      const dir = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(22);
      dir.y += 5;
      this.activeGrenades.push({ mesh: gMesh, velocity: dir, timer: 1.2 });
      soundManager.playShot();
    }

    // Update Grenades
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.timer -= delta;
      g.velocity.y -= 9.8 * delta;
      g.mesh.position.addScaledVector(g.velocity, delta);

      if (g.timer <= 0) {
        this.scene.remove(g.mesh);
        const expPos = g.mesh.position.clone();
        soundManager.playCollect();
        player.shakeIntensity = Math.max(player.shakeIntensity, 0.8);

        for (let p = 0; p < 25; p++) {
          const vel = new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 8, (Math.random() - 0.5) * 12);
          particlePool.spawn('spark', expPos.clone(), vel, 0.6 + Math.random() * 0.4);
        }

        for (const monster of monsters) {
          if (monster.isAlive() && monster.mesh.position.distanceTo(expPos) <= 10) {
            monster.takeDamage(85);
            damageNumber.show(85, monster.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), true, true);
            hitMarker.trigger(true);
          }
        }
        this.activeGrenades.splice(i, 1);
      }
    }

    // Skill 3: Shield (Key C)
    if (input.state.skillShield && this.shieldCooldown <= 0 && player.isAlive()) {
      this.shieldCooldown = 15.0;
      this.isShieldActive = true;
      this.shieldTimer = 3.5;
      soundManager.playCollect();
      if (!this.shieldMesh) {
        this.shieldMesh = new THREE.Mesh(
          new THREE.SphereGeometry(1.4, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xB388FF, transparent: true, opacity: 0.4, emissive: 0xB388FF, emissiveIntensity: 1.5 })
        );
        this.scene.add(this.shieldMesh);
      }
      this.shieldMesh.visible = true;
    }

    if (this.isShieldActive) {
      this.shieldTimer -= delta;
      if (this.shieldMesh) this.shieldMesh.position.copy(player.mesh.position).add(new THREE.Vector3(0, 1, 0));
      if (this.shieldTimer <= 0) {
        this.isShieldActive = false;
        if (this.shieldMesh) this.shieldMesh.visible = false;
      }
    }

    hud.updateSkillCooldowns(this.dashCooldown, this.grenadeCooldown, this.shieldCooldown);
  }
}
