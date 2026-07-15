import * as THREE from 'three';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';

export abstract class Vehicle {
  mesh: THREE.Group;
  velocity: THREE.Vector3 = new THREE.Vector3();
  speed: number = 0;
  maxSpeed: number = 20;
  yaw: number = 0;
  pitch: number = 0;
  roll: number = 0;
  boardingRange: number = 5;

  constructor() {
    this.mesh = new THREE.Group();
  }

  canBoard(playerPos: THREE.Vector3): boolean {
    return this.mesh.position.distanceTo(playerPos) <= this.boardingRange;
  }

  abstract update(delta: number, input: InputManager, heightMap: HeightMap): void;
}
