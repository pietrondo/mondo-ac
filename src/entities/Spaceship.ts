import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';

export class Spaceship extends Vehicle {
  constructor(position: THREE.Vector3) {
    super();
    this.maxSpeed = 65;

    // Body (pointing forward along -Z)
    const spaceshipBody = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x673AB7, metalness: 0.8, roughness: 0.2, flatShading: true })
    );
    spaceshipBody.rotation.x = Math.PI / 2;
    spaceshipBody.position.y = 0.5;
    this.mesh.add(spaceshipBody);

    // Cockpit
    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x00BCD4, transparent: true, opacity: 0.6, flatShading: true })
    );
    cockpit.position.set(0, 0.8, -0.5);
    this.mesh.add(cockpit);

    // Wings
    const wingGeo = new THREE.BoxGeometry(3, 0.1, 1.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x3F51B5, flatShading: true });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0.4, 0.5);
    this.mesh.add(wings);

    // Thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true });
    
    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.6, 0.4, 1.8);
    this.mesh.add(leftThruster);

    const rightThruster = leftThruster.clone();
    rightThruster.position.x = 0.6;
    this.mesh.add(rightThruster);

    this.mesh.rotation.order = 'YXZ';

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.mesh.position.copy(position);
  }

  update(delta: number, input: InputManager, heightMap: HeightMap): void {
    // 1. Yaw Steering (A/D)
    const turnSpeed = 2.5; // rad/s
    if (input.state.left) {
      this.yaw += turnSpeed * delta;
    }
    if (input.state.right) {
      this.yaw -= turnSpeed * delta;
    }
    this.yaw = (this.yaw + Math.PI * 2) % (Math.PI * 2);

    // 2. Roll banking (tilt left on A, right on D)
    const targetRoll = input.state.left ? 0.5 : (input.state.right ? -0.5 : 0);
    this.roll += (targetRoll - this.roll) * 5.0 * delta;

    // 3. Pitch (tilt up on climb Space, down on descend Shift/run)
    const targetPitch = input.state.jump ? 0.4 : (input.state.run ? -0.4 : 0);
    this.pitch += (targetPitch - this.pitch) * 5.0 * delta;

    // 4. Throttle / Speed (W/S)
    const accel = 40.0;
    const friction = 5.0;

    if (input.state.forward) {
      this.speed = Math.min(this.maxSpeed, this.speed + accel * delta);
    } else if (input.state.backward) {
      this.speed = Math.max(-this.maxSpeed / 2, this.speed - accel * delta);
    } else {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - friction * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + friction * delta);
      }
    }

    // 5. Vertical velocity (Space = Climb, Shift/run = Descend)
    const climbSpeed = 25.0;
    let vertVel = 0;
    if (input.state.jump) {
      vertVel = climbSpeed;
    } else if (input.state.run) {
      vertVel = -climbSpeed;
    }

    // 6. Apply Movement
    const dirX = -Math.sin(this.yaw);
    const dirZ = -Math.cos(this.yaw);
    this.velocity.set(dirX * this.speed, vertVel, dirZ * this.speed);
    this.mesh.position.addScaledVector(this.velocity, delta);

    // Clamp to world bounds
    const worldHalf = (WORLD_SIZE / 2) * WORLD_SCALE;
    this.mesh.position.x = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.x));
    this.mesh.position.z = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.z));

    // Ensure spaceship does not clip through terrain
    const hx = (this.mesh.position.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const hz = (this.mesh.position.z / WORLD_SCALE) + WORLD_SIZE / 2;
    const terrainHeight = heightMap.getInterpolated(hx, hz);
    if (this.mesh.position.y < terrainHeight) {
      this.mesh.position.y = terrainHeight;
    }

    // Update rotations (order YXZ ensures yaw is applied first, then pitch, then roll)
    this.mesh.rotation.y = this.yaw;
    this.mesh.rotation.x = this.pitch;
    this.mesh.rotation.z = this.roll;
  }
}
