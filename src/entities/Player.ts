import * as THREE from 'three';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';

export class Player {
  mesh: THREE.Group;
  camera: THREE.PerspectiveCamera;
  input: InputManager;

  private velocity = new THREE.Vector3();
  private speed = 5;
  private runSpeed = 10;
  private cameraDistance = 15;
  private cameraHeight = 8;
  private yaw = 0;
  private pitch = 0.3;

  // HP and death
  hp = 100;
  maxHp = 100;
  private alive = true;
  private respawnPosition = new THREE.Vector3();

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

    // Set initial respawn position
    this.respawnPosition.set(0, 0, 0);
  }

  isAlive(): boolean {
    return this.alive;
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.alive = false;
    this.mesh.visible = false;
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
    // Remove death message
    const msg = document.getElementById('death-message');
    if (msg) msg.remove();
  }

  setRespawnPoint(pos: THREE.Vector3): void {
    this.respawnPosition.copy(pos);
  }

  update(delta: number, heightMap: HeightMap): void {
    if (!this.alive) {
      // Check for respawn input
      if (this.input.state.interact) { // Using E as R is not in input, using interact
        this.respawn(heightMap);
      }
      return;
    }

    // Rotation from mouse
    this.yaw -= this.input.state.mouseX;
    this.pitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.pitch - this.input.state.mouseY));
    this.input.resetMouse();

    // Movement direction
    const forward = (this.input.state.forward ? 1 : 0) - (this.input.state.backward ? 1 : 0);
    const strafe = (this.input.state.right ? 1 : 0) - (this.input.state.left ? 1 : 0);

    if (forward !== 0 || strafe !== 0) {
      const moveSpeed = this.input.state.run ? this.runSpeed : this.speed;

      const moveX = Math.sin(this.yaw) * forward + Math.cos(this.yaw) * strafe;
      const moveZ = Math.cos(this.yaw) * forward - Math.sin(this.yaw) * strafe;

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

    // Clamp to world bounds
    const worldHalf = 128 * WORLD_SCALE;
    this.mesh.position.x = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.x));
    this.mesh.position.z = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.z));

    // Height collision
    const hx = (this.mesh.position.x / WORLD_SCALE) + 128;
    const hz = (this.mesh.position.z / WORLD_SCALE) + 128;
    const terrainHeight = heightMap.getInterpolated(hx, hz);
    this.mesh.position.y = terrainHeight;

    // Camera
    const camX = this.mesh.position.x + Math.sin(this.yaw) * Math.cos(this.pitch) * this.cameraDistance;
    const camY = this.mesh.position.y + Math.sin(this.pitch) * this.cameraDistance + this.cameraHeight;
    const camZ = this.mesh.position.z + Math.cos(this.yaw) * Math.cos(this.pitch) * this.cameraDistance;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.mesh.position.x, this.mesh.position.y + 2, this.mesh.position.z);
  }
}
