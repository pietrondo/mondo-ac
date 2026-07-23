import * as THREE from 'three';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';
import { PLAYER } from '../config/entities';
import { Vehicle } from './Vehicle';
import { requestPointerLockSafe } from '../controls/pointerLock';
import { Health } from '../components/Health';

export class Player {
  mesh: THREE.Group;
  camera: THREE.PerspectiveCamera;
  input: InputManager;
  activeVehicle: Vehicle | null = null;
  shakeIntensity = 0;

  private velocity = new THREE.Vector3();
  private grounded = true;
  private jumpWasPressed = false;
  speed = PLAYER.speed;
  private runSpeed = PLAYER.runSpeed;
  private readonly jumpVelocity = PLAYER.jumpVelocity;
  private readonly gravity = PLAYER.gravity;
  cameraHeight = PLAYER.cameraHeight;
  yaw = 0;
  chaseCameraYaw = 0;
  private pitch = 0.3;

  // HP and death
  private health: Health;
  get hp(): number { return this.health.hp; }
  get maxHp(): number { return this.health.maxHp; }
  get isInvulnerable(): boolean { return this.health.isInvulnerable; }
  set isInvulnerable(value: boolean) { this.health.isInvulnerable = value; }
  isSubterranean = false;
  dungeonFloorY = -150;
  private respawnPosition = new THREE.Vector3();

  teleportTo(pos: THREE.Vector3): void {
    this.mesh.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.grounded = true;
  }

  // Collision
  private structureColliders: { box: THREE.Box3; type: 'solid' | 'trigger' }[] = [];
  private decorationColliders: { position: THREE.Vector3; radius: number; height: number }[] = [];
  private playerRadius = PLAYER.playerRadius;

  private static readonly tempPlayerBox = new THREE.Box3();
  private static readonly tempMinVec = new THREE.Vector3();
  private static readonly tempMaxVec = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, input: InputManager) {
    this.camera = camera;
    this.input = input;
    this.health = new Health(PLAYER.maxHp);
    this.health.isInvulnerable = false;

    // Create player mesh (simple humanoid)
    this.mesh = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x2196F3, flatShading: true })
    );
    body.position.y = 1.25;
    this.mesh.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xFFCC80, flatShading: true })
    );
    head.position.y = 2.4;
    this.mesh.add(head);

    // Shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.8, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    this.mesh.add(shadow);

    // Traverse child meshes to assign them to Layer 1, and set cast/receive shadows
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.layers.set(1);
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Make player mesh visible
    this.mesh.visible = true;

    // Set initial respawn position
    this.respawnPosition.set(0, 0, 0);
  }

  isAlive(): boolean {
    return this.health.isAlive();
  }

  heal(amount: number): number {
    return this.health.heal(amount);
  }

  upgradeMaxHp(bonusHp: number): void {
    const fresh = new Health(this.health.maxHp + bonusHp);
    fresh.isInvulnerable = this.health.isInvulnerable;
    fresh.heal(this.health.maxHp);
    (this as any).health = fresh;
  }

  resetToMaxHp(maxHp: number): void {
    (this as any).health = new Health(maxHp);
    (this as any).health.heal(maxHp);
  }

  takeDamage(amount: number): void {
    if (!this.isAlive()) return;
    const dealt = this.health.takeDamage(amount);
    if (dealt > 0) {
      this.shakeIntensity = Math.max(this.shakeIntensity, 1.2);
    }
    if (!this.isAlive()) {
      this.die();
    }
  }

  private die(): void {
    const existingMsg = document.getElementById('death-message');
    if (existingMsg) existingMsg.remove();
    this.mesh.visible = false;
    this.input.reset();
    const deathMsg = document.createElement('div');
    deathMsg.id = 'death-message';
    deathMsg.textContent = 'Sei caduto! Premi R per rinascere';
    deathMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ff4444;
      font-size: 32px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      z-index: 200;
      font-family: system-ui, sans-serif;
    `;
    document.body.appendChild(deathMsg);
  }

  respawn(heightMap: HeightMap): void {
    this.health.reset();
    this.mesh.visible = true;
    this.mesh.position.copy(this.respawnPosition);
    this.mesh.position.y = heightMap.getInterpolated(
      (this.mesh.position.x / WORLD_SCALE) + WORLD_SIZE / 2,
      (this.mesh.position.z / WORLD_SCALE) + WORLD_SIZE / 2
    );
    this.velocity.set(0, 0, 0);
    this.grounded = true;
    this.jumpWasPressed = false;
    this.input.reset();
    requestPointerLockSafe(document.body);
    const msg = document.getElementById('death-message');
    if (msg) msg.remove();
  }

  setRespawnPoint(pos: THREE.Vector3): void {
    this.respawnPosition.copy(pos);
  }

  setColliders(
    structures: { box: THREE.Box3; type: 'solid' | 'trigger' }[],
    decorations: { position: THREE.Vector3; radius: number; height: number }[]
  ): void {
    this.structureColliders = structures;
    this.decorationColliders = decorations;
  }

  update(delta: number, heightMap: HeightMap): void {
    if (this.shakeIntensity > 0) {
      this.shakeIntensity -= delta * 15.0; // Decay shakeIntensity
      if (this.shakeIntensity < 0) {
        this.shakeIntensity = 0;
      }
    }

    if (!this.isAlive()) {
      // Check for respawn input
      if (this.input.state.interact || this.input.state.reload) {
        this.respawn(heightMap);
      }
      return;
    }

    if (this.activeVehicle) {
      // Direct mouse aiming for vehicles
      this.activeVehicle.yaw += this.input.state.mouseX;
      this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch - this.input.state.mouseY));
      this.input.resetMouse();

      this.activeVehicle.update(delta, this.input, heightMap);
      this.mesh.position.copy(this.activeVehicle.mesh.position);
      this.mesh.rotation.y = this.activeVehicle.yaw;
      this.velocity.set(0, 0, 0);

      // Smooth chase camera angular lag behind vehicle yaw
      let diff = this.activeVehicle.yaw - this.chaseCameraYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.chaseCameraYaw += diff * Math.min(1.0, delta * 3.8);

      // 3rd-person chase camera positioned using chaseCameraYaw so vehicle nose visibly turns on screen
      const distBehind = 6.0;
      const heightAbove = 2.8;

      const camX = this.mesh.position.x + Math.sin(this.chaseCameraYaw) * Math.cos(this.pitch) * distBehind;
      const camY = this.mesh.position.y + heightAbove + Math.sin(this.pitch) * distBehind;
      const camZ = this.mesh.position.z + Math.cos(this.chaseCameraYaw) * Math.cos(this.pitch) * distBehind;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(
        this.mesh.position.x,
        this.mesh.position.y + heightAbove * 0.7,
        this.mesh.position.z
      );

      if (this.shakeIntensity > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
      }

      return;
    }

    // Rotation from mouse
    this.yaw += this.input.state.mouseX;
    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch - this.input.state.mouseY));
    this.input.resetMouse();

    // Movement direction
    const forward = (this.input.state.forward ? 1 : 0) - (this.input.state.backward ? 1 : 0);
    const strafe = (this.input.state.right ? 1 : 0) - (this.input.state.left ? 1 : 0);

    if (forward !== 0 || strafe !== 0) {
      const moveSpeed = this.input.state.run ? this.runSpeed : this.speed;

      const moveX = Math.sin(this.yaw) * forward + Math.cos(this.yaw) * strafe;
      const moveZ = -Math.cos(this.yaw) * forward + Math.sin(this.yaw) * strafe;

      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (len > 0) {
        this.velocity.x = (moveX / len) * moveSpeed;
        this.velocity.z = (moveZ / len) * moveSpeed;
      }

      this.mesh.rotation.y = this.yaw;
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }
    // Apply velocity
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.z += this.velocity.z * delta;

    // Platform floor standing & ladder climbing collision resolution
    let platformFloorY = -Infinity;

    for (const collider of this.structureColliders) {
      Player.tempMinVec.set(
        this.mesh.position.x - this.playerRadius,
        this.mesh.position.y,
        this.mesh.position.z - this.playerRadius
      );
      Player.tempMaxVec.set(
        this.mesh.position.x + this.playerRadius,
        this.mesh.position.y + this.cameraHeight,
        this.mesh.position.z + this.playerRadius
      );
      Player.tempPlayerBox.set(Player.tempMinVec, Player.tempMaxVec);

      if (collider.type === 'trigger') {
        // Ladder trigger zone: climbing upward on Space / W
        if (Player.tempPlayerBox.intersectsBox(collider.box)) {
          if (this.input.state.jump || this.input.state.forward) {
            this.velocity.y = 8.5; // Climb up ladder smoothly
            this.grounded = false;
          }
        }
        continue;
      }

      if (Player.tempPlayerBox.intersectsBox(collider.box)) {
        const feetY = this.mesh.position.y;
        const platformTop = collider.box.max.y;

        // If player is landing/standing on top of a floor/platform surface
        if (feetY >= platformTop - 0.75 && feetY <= platformTop + 0.5 && this.velocity.y <= 0) {
          platformFloorY = Math.max(platformFloorY, platformTop);
        } else {
          // Lateral wall pushing
          const overlapX1 = Player.tempPlayerBox.max.x - collider.box.min.x;
          const overlapX2 = collider.box.max.x - Player.tempPlayerBox.min.x;
          const pushX = overlapX1 < overlapX2 ? -overlapX1 : overlapX2;

          const overlapZ1 = Player.tempPlayerBox.max.z - collider.box.min.z;
          const overlapZ2 = collider.box.max.z - Player.tempPlayerBox.min.z;
          const pushZ = overlapZ1 < overlapZ2 ? -overlapZ1 : overlapZ2;

          if (Math.abs(pushX) < Math.abs(pushZ)) {
            this.mesh.position.x += pushX;
            this.velocity.x = 0;
          } else {
            this.mesh.position.z += pushZ;
            this.velocity.z = 0;
          }
        }
      }
    }

    // Collision resolution with decorations (cylindrical)
    for (const collider of this.decorationColliders) {
      const dx = this.mesh.position.x - collider.position.x;
      const dz = this.mesh.position.z - collider.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = this.playerRadius + collider.radius;
      if (dist < minDist && dist > 0.0001) {
        const overlap = minDist - dist;
        this.mesh.position.x += (dx / dist) * overlap;
        this.mesh.position.z += (dz / dist) * overlap;
      }
    }

    // Clamp to world bounds
    if (!this.isSubterranean) {
      const worldHalf = (WORLD_SIZE / 2) * WORLD_SCALE;
      this.mesh.position.x = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.x));
      this.mesh.position.z = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.z));
    }

    // Grounded jump and gravity
    const hx = (this.mesh.position.x / WORLD_SCALE) + (WORLD_SIZE / 2);
    const hz = (this.mesh.position.z / WORLD_SCALE) + (WORLD_SIZE / 2);
    const terrainHeight = heightMap.getInterpolated(hx, hz);
    const baseFloor = this.isSubterranean ? this.dungeonFloorY : terrainHeight;
    const targetFloor = Math.max(baseFloor, platformFloorY);
    const jumpPressed = this.input.state.jump;
    if (this.grounded && jumpPressed && !this.jumpWasPressed) {
      this.velocity.y = this.jumpVelocity;
      this.grounded = false;
    }

    this.velocity.y -= this.gravity * delta;
    this.mesh.position.y += this.velocity.y * delta;

    if (this.mesh.position.y <= targetFloor) {
      this.mesh.position.y = targetFloor;
      this.velocity.y = 0;
      this.grounded = true;
    }
    this.jumpWasPressed = jumpPressed;

    // First person camera
    const camX = this.mesh.position.x;
    const camY = this.mesh.position.y + this.cameraHeight;
    const camZ = this.mesh.position.z;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(
      this.mesh.position.x + Math.sin(this.yaw) * Math.cos(this.pitch),
      camY + Math.sin(this.pitch),
      this.mesh.position.z - Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    if (this.shakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
    }
  }
}
