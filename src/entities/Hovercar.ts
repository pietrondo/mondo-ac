import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';

export class Hovercar extends Vehicle {
  constructor(position: THREE.Vector3) {
    super();
    this.maxSpeed = 45;

    // Body
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.6, 4),
      new THREE.MeshStandardMaterial({ color: 0xFF5722, metalness: 0.8, roughness: 0.2, flatShading: true })
    );
    carBody.position.y = 0.3;
    this.mesh.add(carBody);

    // Cockpit
    const cockpit = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.6, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x2196F3, transparent: true, opacity: 0.6, flatShading: true })
    );
    cockpit.position.set(0, 0.9, 0.2);
    this.mesh.add(cockpit);

    // 4 hover pads at the corners
    const padGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8);
    const padMaterial = new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true });
    
    const padPositions = [
      [-1.1, 0, -1.5],
      [1.1, 0, -1.5],
      [-1.1, 0, 1.5],
      [1.1, 0, 1.5]
    ];
    for (const [px, py, pz] of padPositions) {
      const pad = new THREE.Mesh(padGeometry, padMaterial);
      pad.position.set(px, py, pz);
      this.mesh.add(pad);
    }

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.mesh.position.copy(position);
  }

  update(delta: number, input: InputManager, heightMap: HeightMap): void {
    // 1. Steering (A/D rotates yaw)
    const turnSpeed = 3.0; // rad/s
    if (input.state.left) {
      this.yaw += turnSpeed * delta;
    }
    if (input.state.right) {
      this.yaw -= turnSpeed * delta;
    }

    // Keep yaw normalized between 0 and 2PI for simplicity
    this.yaw = (this.yaw + Math.PI * 2) % (Math.PI * 2);

    // 2. Acceleration (W/S)
    const accel = 30.0;
    const friction = 5.0;

    if (input.state.forward) {
      this.speed = Math.min(this.maxSpeed, this.speed + accel * delta);
    } else if (input.state.backward) {
      this.speed = Math.max(-this.maxSpeed / 2, this.speed - accel * delta);
    } else {
      // Apply friction slowing down to stop
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - friction * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + friction * delta);
      }
    }

    // 3. Move Hovercar
    const dirX = -Math.sin(this.yaw);
    const dirZ = -Math.cos(this.yaw);
    this.velocity.set(dirX * this.speed, 0, dirZ * this.speed);
    this.mesh.position.addScaledVector(this.velocity, delta);

    // Clamp to world bounds
    const worldHalf = (WORLD_SIZE / 2) * WORLD_SCALE;
    this.mesh.position.x = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.x));
    this.mesh.position.z = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.z));

    // 4. Align with Heightmap
    const hx = (this.mesh.position.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const hz = (this.mesh.position.z / WORLD_SCALE) + WORLD_SIZE / 2;
    const terrainHeight = heightMap.getInterpolated(hx, hz);
    this.mesh.position.y = terrainHeight;

    // Calculate Pitch from heightmap slope
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const step = 1.0;
    const frontPos = this.mesh.position.clone().addScaledVector(fwd, step);
    const backPos = this.mesh.position.clone().addScaledVector(fwd, -step);

    const hxFront = (frontPos.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const hzFront = (frontPos.z / WORLD_SCALE) + WORLD_SIZE / 2;
    const hxBack = (backPos.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const hzBack = (backPos.z / WORLD_SCALE) + WORLD_SIZE / 2;

    const hFront = heightMap.getInterpolated(hxFront, hzFront);
    const hBack = heightMap.getInterpolated(hxBack, hzBack);

    // Pitch is the angle between front and back heights over the horizontal distance
    this.pitch = Math.atan2(hFront - hBack, 2 * step);

    // Apply rotation
    this.mesh.rotation.y = this.yaw;
    this.mesh.rotation.x = -this.pitch;
    this.mesh.rotation.z = 0;
  }
}
