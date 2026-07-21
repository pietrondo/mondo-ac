import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';

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
    const { turnInput } = this.updateSteeringAndThrottle(delta, input, {
      accel: 50.0,
      brakeAccel: 100.0,
      friction: 8.0,
      turnSpeed: 4.0,
      baseMaxSpeed: 38,
      boostMultiplier: 1.4,
    });

    // Roll banking (tilt left on A, right on D)
    const targetRoll = -turnInput * 0.5;
    this.roll += (targetRoll - this.roll) * 5.0 * delta;

    // Vertical climb (Space = Climb, Shift/run = Descend)
    const climbSpeed = 25.0;
    let vertVel = 0;
    if (input.state.jump) {
      vertVel = climbSpeed;
    } else if (input.state.run || input.state.skillShield) {
      vertVel = -climbSpeed;
    }

    const targetPitch = input.state.jump ? 0.4 : (vertVel < 0 ? -0.4 : 0);
    this.pitch += (targetPitch - this.pitch) * 5.0 * delta;

    const dirX = Math.sin(this.yaw);
    const dirZ = -Math.cos(this.yaw);
    this.velocity.set(dirX * this.speed, vertVel, dirZ * this.speed);
    this.mesh.position.addScaledVector(this.velocity, delta);

    this.clampToBounds(this.mesh.position);

    const terrainHeight = this.getTerrainHeight(this.mesh.position, heightMap);
    if (this.mesh.position.y < terrainHeight) {
      this.mesh.position.y = terrainHeight;
    }

    this.mesh.rotation.y = this.yaw;
    this.mesh.rotation.x = this.pitch;
    this.mesh.rotation.z = this.roll;
  }
}
