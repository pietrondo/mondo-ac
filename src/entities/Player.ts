import * as THREE from 'three';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';
import { Vehicle } from './Vehicle';

export class Player {
  mesh: THREE.Group;
  camera: THREE.PerspectiveCamera;
  input: InputManager;
  activeVehicle: Vehicle | null = null;
  shakeIntensity = 0;

  private velocity = new THREE.Vector3();
  private grounded = true;
  private jumpWasPressed = false;
  speed = 5;
  private runSpeed = 10;
  private readonly jumpVelocity = 8;
  private readonly gravity = 24;
  cameraHeight = 2.4; // Eye level height
  yaw = 0;
  private pitch = 0.3;

  // HP and death
  hp = 100;
  maxHp = 100;
  isInvulnerable = false;
  private alive = true;
  private respawnPosition = new THREE.Vector3();

  // Collision
  private structureColliders: { box: THREE.Box3; type: 'solid' | 'trigger' }[] = [];
  private decorationColliders: { position: THREE.Vector3; radius: number; height: number }[] = [];
  private playerRadius = 0.5; // Player collision radius

  constructor(camera: THREE.PerspectiveCamera, input: InputManager) {
    this.camera = camera;
    this.input = input;

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
    return this.alive;
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    if (this.isInvulnerable) return;
    this.hp -= amount;
    this.shakeIntensity = Math.max(this.shakeIntensity, 1.2);
    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    const existingMsg = document.getElementById('death-message');
    if (existingMsg) existingMsg.remove();
    this.alive = false;
    this.mesh.visible = false;
    this.input.reset();
    // Show death message
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
    this.alive = true;
    this.hp = this.maxHp;
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
    document.body.requestPointerLock();
    // Remove death message
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

    if (!this.alive) {
      // Check for respawn input
      if (this.input.state.interact || this.input.state.reload) {
        this.respawn(heightMap);
      }
      return;
    }

    if (this.activeVehicle) {
      this.mesh.position.copy(this.activeVehicle.mesh.position);
      this.mesh.rotation.y = this.activeVehicle.yaw;
      this.velocity.set(0, 0, 0);

      const vehicle = this.activeVehicle;
      const yaw = vehicle.yaw;
      const pitch = vehicle.pitch || 0;
      
      const offset = new THREE.Vector3(0, 3, 8);
      offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      
      const targetCamPos = vehicle.mesh.position.clone().add(offset);
      this.camera.position.copy(targetCamPos);
      this.camera.lookAt(vehicle.mesh.position);
      
      if (this.shakeIntensity > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
      }

      this.input.resetMouse();
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

    // Collision resolution with structures (AABB)
    const playerBox = new THREE.Box3();

    for (const collider of this.structureColliders) {
      if (collider.type !== 'solid') continue;

      playerBox.set(
        new THREE.Vector3(
          this.mesh.position.x - this.playerRadius,
          this.mesh.position.y,
          this.mesh.position.z - this.playerRadius
        ),
        new THREE.Vector3(
          this.mesh.position.x + this.playerRadius,
          this.mesh.position.y + this.cameraHeight,
          this.mesh.position.z + this.playerRadius
        )
      );

      if (playerBox.intersectsBox(collider.box)) {
        const overlapX1 = playerBox.max.x - collider.box.min.x;
        const overlapX2 = collider.box.max.x - playerBox.min.x;
        const pushX = overlapX1 < overlapX2 ? -overlapX1 : overlapX2;

        const overlapZ1 = playerBox.max.z - collider.box.min.z;
        const overlapZ2 = collider.box.max.z - playerBox.min.z;
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

    // Collision resolution with decorations (cylindrical)
    for (const collider of this.decorationColliders) {
      const dx = this.mesh.position.x - collider.position.x;
      const dz = this.mesh.position.z - collider.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = this.playerRadius + collider.radius;
      if (dist < minDist && dist > 0.001) {
        const pushX = (dx / dist) * minDist;
        const pushZ = (dz / dist) * minDist;
        this.mesh.position.x = collider.position.x + pushX;
        this.mesh.position.z = collider.position.z + pushZ;
      }
    }

    // Clamp to world bounds
    const worldHalf = (WORLD_SIZE / 2) * WORLD_SCALE;
    this.mesh.position.x = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.x));
    this.mesh.position.z = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.z));

    // Grounded jump and gravity
    const hx = (this.mesh.position.x / WORLD_SCALE) + (WORLD_SIZE / 2);
    const hz = (this.mesh.position.z / WORLD_SCALE) + (WORLD_SIZE / 2);
    const terrainHeight = heightMap.getInterpolated(hx, hz);
    const jumpPressed = this.input.state.jump;
    if (this.grounded && jumpPressed && !this.jumpWasPressed) {
      this.velocity.y = this.jumpVelocity;
      this.grounded = false;
    }

    this.velocity.y -= this.gravity * delta;
    this.mesh.position.y += this.velocity.y * delta;

    if (this.mesh.position.y <= terrainHeight) {
      this.mesh.position.y = terrainHeight;
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
