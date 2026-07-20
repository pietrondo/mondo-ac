import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';

export class Hovercar extends Vehicle {
  private hoverTime = 0;
  private currentBank = 0;
  private bodyGroup: THREE.Group;

  constructor(position: THREE.Vector3) {
    super();
    this.maxSpeed = 50;

    this.bodyGroup = new THREE.Group();

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      flatShading: true,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xff5722,
      metalness: 0.9,
      roughness: 0.2,
      flatShading: true,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.9,
      flatShading: true,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: new THREE.Color(0x00f0ff),
      emissiveIntensity: 3.5,
      flatShading: true,
    });
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
      flatShading: true,
    });
    const tailGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: new THREE.Color(0xff1744),
      emissiveIntensity: 3.0,
    });

    // 1. Central Chasis Base
    const mainHull = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 3.8), bodyMat);
    mainHull.position.y = 0.4;
    this.bodyGroup.add(mainHull);

    // 2. Tapered Front Nose & Air Intakes
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 4), accentMat);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.y = Math.PI / 4;
    nose.position.set(0, 0.4, -2.4);
    this.bodyGroup.add(nose);

    // Side Air Skirts
    const leftSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 3.2), accentMat);
    leftSkirt.position.set(-1.05, 0.35, -0.2);
    this.bodyGroup.add(leftSkirt);

    const rightSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 3.2), accentMat);
    rightSkirt.position.set(1.05, 0.35, -0.2);
    this.bodyGroup.add(rightSkirt);

    // 3. Futuristic Cockpit Canopy
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), glassMat);
    cockpit.scale.set(0.9, 0.7, 1.4);
    cockpit.position.set(0, 0.65, -0.3);
    this.bodyGroup.add(cockpit);

    // Dashboard Glow Inside Cockpit
    const dashGlow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.25), glowMat);
    dashGlow.position.set(0, 0.68, -0.8);
    this.bodyGroup.add(dashGlow);

    // 4. Rear Wings & Stabilizers
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.2), bodyMat);
    leftWing.position.set(-1.4, 0.5, 1.2);
    leftWing.rotation.z = -Math.PI / 12;
    this.bodyGroup.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.2), bodyMat);
    rightWing.position.set(1.4, 0.5, 1.2);
    rightWing.rotation.z = Math.PI / 12;
    this.bodyGroup.add(rightWing);

    const leftFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.9), accentMat);
    leftFin.position.set(-1.75, 0.8, 1.4);
    leftFin.rotation.z = -Math.PI / 16;
    this.bodyGroup.add(leftFin);

    const rightFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.9), accentMat);
    rightFin.position.set(1.75, 0.8, 1.4);
    rightFin.rotation.z = Math.PI / 16;
    this.bodyGroup.add(rightFin);

    // 5. Dual Jet Thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.32, 0.38, 1.1, 12);
    const leftThruster = new THREE.Mesh(thrusterGeo, padMat);
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.6, 0.45, 1.85);
    this.bodyGroup.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeo, padMat);
    rightThruster.rotation.x = Math.PI / 2;
    rightThruster.position.set(0.6, 0.45, 1.85);
    this.bodyGroup.add(rightThruster);

    // Plasma Ring Exhausts
    const exhaustGeo = new THREE.RingGeometry(0.1, 0.3, 16);
    const leftExhaust = new THREE.Mesh(exhaustGeo, glowMat);
    leftExhaust.position.set(-0.6, 0.45, 2.41);
    this.bodyGroup.add(leftExhaust);

    const rightExhaust = new THREE.Mesh(exhaustGeo, glowMat);
    rightExhaust.position.set(0.6, 0.45, 2.41);
    this.bodyGroup.add(rightExhaust);

    // 6. Anti-Grav Hover Pods with Glowing Energy Rings
    const padGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.22, 10);
    const ringGeo = new THREE.TorusGeometry(0.38, 0.06, 8, 16);

    const padPositions: [number, number, number][] = [
      [-1.15, 0.12, -1.6],
      [1.15, 0.12, -1.6],
      [-1.15, 0.12, 1.4],
      [1.15, 0.12, 1.4],
    ];

    for (const [px, py, pz] of padPositions) {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(px, py, pz);
      this.bodyGroup.add(pad);

      const ring = new THREE.Mesh(ringGeo, glowMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px, py - 0.12, pz);
      this.bodyGroup.add(ring);
    }

    // 7. Headlights & Taillights
    const headlightGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f7fa });

    const leftHead = new THREE.Mesh(headlightGeo, headMat);
    leftHead.position.set(-0.65, 0.45, -2.55);
    this.bodyGroup.add(leftHead);

    const rightHead = new THREE.Mesh(headlightGeo, headMat);
    rightHead.position.set(0.65, 0.45, -2.55);
    this.bodyGroup.add(rightHead);

    const headLightPoint = new THREE.PointLight(0x00e5ff, 2.5, 18);
    headLightPoint.position.set(0, 0.5, -2.6);
    this.bodyGroup.add(headLightPoint);

    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), tailGlowMat);
    tailBar.position.set(0, 0.55, 1.95);
    this.bodyGroup.add(tailBar);

    this.bodyGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.mesh.add(this.bodyGroup);
    this.mesh.position.copy(position);
  }

  update(delta: number, input: InputManager, heightMap: HeightMap): void {
    this.hoverTime += delta;

    // 1. Steering (A/D rotates yaw & banks)
    const turnSpeed = 4.2;
    let turnInput = 0;
    if (input.state.left) {
      this.yaw += turnSpeed * delta;
      turnInput = -1;
    }
    if (input.state.right) {
      this.yaw -= turnSpeed * delta;
      turnInput = 1;
    }

    this.yaw = (this.yaw + Math.PI * 2) % (Math.PI * 2);
    this.mesh.rotation.y = this.yaw;

    // Smooth banking roll during turns
    const targetBank = turnInput * 0.25;
    this.currentBank += (targetBank - this.currentBank) * Math.min(1.0, delta * 10.0);
    this.bodyGroup.rotation.z = -this.currentBank;

    // 2. Acceleration (W/S)
    const accel = 55.0;
    const friction = 14.0;

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

    // 3. Move Hovercar
    const dirX = Math.sin(this.yaw);
    const dirZ = -Math.cos(this.yaw);
    this.velocity.set(dirX * this.speed, 0, dirZ * this.speed);
    this.mesh.position.addScaledVector(this.velocity, delta);

    // Clamp to world bounds
    const worldHalf = (WORLD_SIZE / 2) * WORLD_SCALE;
    this.mesh.position.x = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.x));
    this.mesh.position.z = Math.max(-worldHalf, Math.min(worldHalf, this.mesh.position.z));

    // 4. Align with Heightmap + Floating Animation
    const hx = (this.mesh.position.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const hz = (this.mesh.position.z / WORLD_SCALE) + WORLD_SIZE / 2;
    const terrainHeight = heightMap.getInterpolated(hx, hz);

    this.mesh.position.y = terrainHeight;
    this.bodyGroup.position.y = Math.sin(this.hoverTime * 4.5) * 0.14 + 0.3;

    // Calculate Pitch from slope
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

    this.pitch = Math.atan2(hFront - hBack, 2 * step);

    // Apply rotation (yaw, pitch, bank roll)
    this.mesh.rotation.y = this.yaw;
    this.mesh.rotation.x = -this.pitch;
    this.mesh.rotation.z = this.currentBank;
  }
}
