import * as THREE from 'three';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';

export interface VehicleControlConfig {
  accel: number;
  brakeAccel: number;
  friction: number;
  turnSpeed: number;
  baseMaxSpeed: number;
  boostMultiplier: number;
}

export abstract class Vehicle {
  mesh: THREE.Group;
  velocity: THREE.Vector3 = new THREE.Vector3();
  speed: number = 0;
  maxSpeed: number = 20;
  yaw: number = 0;
  pitch: number = 0;
  roll: number = 0;
  boardingRange: number = 5;
  isBoosting = false;

  constructor() {
    this.mesh = new THREE.Group();
  }

  canBoard(playerPos: THREE.Vector3): boolean {
    return this.mesh.position.distanceTo(playerPos) <= this.boardingRange;
  }

  protected getTerrainHeight(pos: THREE.Vector3, heightMap: HeightMap): number {
    const hx = (pos.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const hz = (pos.z / WORLD_SCALE) + WORLD_SIZE / 2;
    return heightMap.getInterpolated(hx, hz);
  }

  protected clampToBounds(pos: THREE.Vector3): void {
    const worldHalf = (WORLD_SIZE / 2) * WORLD_SCALE;
    pos.x = Math.max(-worldHalf, Math.min(worldHalf, pos.x));
    pos.z = Math.max(-worldHalf, Math.min(worldHalf, pos.z));
  }

  protected calculateSlopePitch(pos: THREE.Vector3, yaw: number, heightMap: HeightMap, step = 1.0): number {
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const frontPos = pos.clone().addScaledVector(fwd, step);
    const backPos = pos.clone().addScaledVector(fwd, -step);

    const hFront = this.getTerrainHeight(frontPos, heightMap);
    const hBack = this.getTerrainHeight(backPos, heightMap);

    return Math.atan2(hFront - hBack, 2 * step);
  }

  protected updateSteeringAndThrottle(
    delta: number,
    input: InputManager,
    config: VehicleControlConfig
  ): { turnInput: number } {
    this.isBoosting = input.state.run;
    const effectiveMaxSpeed = this.isBoosting ? config.baseMaxSpeed * config.boostMultiplier : config.baseMaxSpeed;
    this.maxSpeed = effectiveMaxSpeed;

    // Additional keyboard turn / banking input (A/D)
    let turnInput = 0;
    if (input.state.left) {
      this.yaw -= config.turnSpeed * delta;
      turnInput = -1;
    }
    if (input.state.right) {
      this.yaw += config.turnSpeed * delta;
      turnInput = 1;
    }

    this.yaw = (this.yaw + Math.PI * 2) % (Math.PI * 2);

    // Throttle & Responsive Braking
    if (input.state.forward) {
      if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + config.brakeAccel * delta);
      } else {
        const currentAccel = this.isBoosting ? config.accel * 1.5 : config.accel;
        this.speed = Math.min(effectiveMaxSpeed, this.speed + currentAccel * delta);
      }
    } else if (input.state.backward) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - config.brakeAccel * delta);
      } else {
        this.speed = Math.max(-effectiveMaxSpeed * 0.4, this.speed - config.accel * delta);
      }
    } else {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - config.friction * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + config.friction * delta);
      }
    }

    return { turnInput };
  }

  abstract update(delta: number, input: InputManager, heightMap: HeightMap): void;
}
