import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { InputManager } from '../controls/input';
import { HeightMap } from '../world/heightmap';

export class Horse extends Vehicle {
  private legs: THREE.Mesh[] = [];
  private tail: THREE.Mesh;
  private headGroup: THREE.Group;
  private gallopTime = 0;

  constructor(position: THREE.Vector3) {
    super();
    this.maxSpeed = 26;
    this.boardingRange = 4.5;

    const horseGroup = new THREE.Group();

    // Materials
    const hideMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.8, flatShading: true });
    const maneMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.9, flatShading: true });
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.5, flatShading: true });
    const saddleMat = new THREE.MeshStandardMaterial({ color: 0x4E342E, flatShading: true });

    // 1. Torso / Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 2.2), hideMat);
    body.position.y = 1.3;
    horseGroup.add(body);

    // 2. Saddle
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 0.9), saddleMat);
    saddle.position.set(0, 1.9, 0);
    horseGroup.add(saddle);

    // 3. Neck & Head
    this.headGroup = new THREE.Group();
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.6), hideMat);
    neck.rotation.x = -Math.PI / 6;
    neck.position.set(0, 2.0, -0.9);
    this.headGroup.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.9), hideMat);
    head.position.set(0, 2.5, -1.3);
    this.headGroup.add(head);

    // Mane Hair
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.4), maneMat);
    mane.position.set(0, 2.2, -0.85);
    this.headGroup.add(mane);

    // Ears
    const earLeft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), hideMat);
    earLeft.position.set(-0.15, 2.8, -1.1);
    this.headGroup.add(earLeft);

    const earRight = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), hideMat);
    earRight.position.set(0.15, 2.8, -1.1);
    this.headGroup.add(earRight);

    horseGroup.add(this.headGroup);

    // 4. Legs (Front-Left, Front-Right, Back-Left, Back-Right)
    const legPositions = [
      [-0.35, 0.5, -0.8],
      [0.35, 0.5, -0.8],
      [-0.35, 0.5, 0.8],
      [0.35, 0.5, 0.8],
    ];

    for (const [lx, ly, lz] of legPositions) {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, ly, lz);

      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.24), hideMat);
      leg.position.y = -0.5;
      legPivot.add(leg);

      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.26), hoofMat);
      hoof.position.y = -1.0;
      legPivot.add(hoof);

      horseGroup.add(legPivot);
      this.legs.push(leg as any);
    }

    // 5. Tail
    this.tail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.2), maneMat);
    this.tail.position.set(0, 1.4, 1.15);
    this.tail.rotation.x = Math.PI / 8;
    horseGroup.add(this.tail);

    this.mesh.add(horseGroup);
    this.mesh.position.copy(position);
  }

  update(delta: number, input: InputManager, heightMap: HeightMap): void {
    this.updateSteeringAndThrottle(delta, input, {
      accel: 45.0,
      brakeAccel: 90.0,
      friction: 18.0,
      turnSpeed: 4.0,
      baseMaxSpeed: 18,
      boostMultiplier: 1.5,
    });

    this.mesh.rotation.y = this.yaw;

    // Movement
    const dirX = Math.sin(this.yaw);
    const dirZ = -Math.cos(this.yaw);
    this.velocity.set(dirX * this.speed, 0, dirZ * this.speed);
    this.mesh.position.addScaledVector(this.velocity, delta);

    this.clampToBounds(this.mesh.position);

    const groundY = this.getTerrainHeight(this.mesh.position, heightMap);

    // Gallop Animation
    if (Math.abs(this.speed) > 0.5) {
      this.gallopTime += delta * Math.abs(this.speed) * 1.5;
      const bob = Math.abs(Math.sin(this.gallopTime)) * (this.isBoosting ? 0.45 : 0.3);
      this.mesh.position.y = groundY + bob;

      // Leg swinging
      for (let i = 0; i < this.legs.length; i++) {
        const sign = i % 2 === 0 ? 1 : -1;
        this.legs[i].rotation.x = Math.sin(this.gallopTime + (i < 2 ? 0 : Math.PI)) * 0.5 * sign;
      }
      this.tail.rotation.z = Math.sin(this.gallopTime) * 0.2;
    } else {
      this.mesh.position.y = groundY;
      for (const leg of this.legs) leg.rotation.x = 0;
      this.tail.rotation.z = 0;
    }

    this.pitch = this.calculateSlopePitch(this.mesh.position, this.yaw, heightMap, 0.8);
    this.mesh.rotation.x = -this.pitch;
  }
}
