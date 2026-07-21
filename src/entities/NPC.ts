import * as THREE from 'three';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';

export interface VillageContext {
  center: THREE.Vector3;
  radius: number;
  buildings: THREE.Vector3[];
}

export interface NPCOptions {
  name?: string;
  role?: string;
  dialogueTreeId?: string;
  isStationary?: boolean;
}

export class NPC {
  mesh: THREE.Group;
  name: string;
  role: string;
  dialogueTreeId: string;
  isTalking = false;
  isStationary = false;

  private targetPos = new THREE.Vector3();
  private speed = 2;
  private waitTime = 0;
  private village: VillageContext | null;

  constructor(position: THREE.Vector3, village?: VillageContext, options?: NPCOptions) {
    this.mesh = new THREE.Group();
    this.village = village || null;

    this.name = options?.name || 'Villico';
    this.role = options?.role || 'Abitante';
    this.dialogueTreeId = options?.dialogueTreeId || 'elder_eldrin';
    this.isStationary = options?.isStationary || false;

    // Color theme according to role
    let bodyColor = 0x4CAF50;
    let headColor = 0xFFCC80;
    let hatMesh: THREE.Mesh | null = null;

    if (this.dialogueTreeId.includes('merchant')) {
      bodyColor = 0xFFD700; // Gold
      headColor = 0xFFE0B2;
      // Merchant Hat
      hatMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true })
      );
      hatMesh.position.y = 2.4;
    } else if (this.dialogueTreeId.includes('elder')) {
      bodyColor = 0x3F51B5; // Deep Blue Robes
      headColor = 0xFFECB3;
      // White Staff
      const staff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, flatShading: true })
      );
      staff.position.set(0.6, 1.1, 0.2);
      this.mesh.add(staff);
    } else if (this.dialogueTreeId.includes('guard')) {
      bodyColor = 0x78909C; // Iron/Steel
      headColor = 0xFFCC80;
      // Guard Helmet
      hatMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.6, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true })
      );
      hatMesh.position.y = 2.15;
    } else if (this.dialogueTreeId.includes('traveler')) {
      bodyColor = 0x009688; // Teal Cloak
      headColor = 0xD7CCC8;
    }

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.4, 0.5),
      new THREE.MeshStandardMaterial({ color: bodyColor, flatShading: true })
    );
    body.position.y = 1;
    this.mesh.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshStandardMaterial({ color: headColor, flatShading: true })
    );
    head.position.y = 2;
    this.mesh.add(head);

    if (hatMesh) {
      this.mesh.add(hatMesh);
    }

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.mesh.position.copy(position);
    if (!this.isStationary) {
      this.pickNewTarget();
    }
  }

  talkToPlayer(playerPos: THREE.Vector3): void {
    this.isTalking = true;
    this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
  }

  resumeWandering(): void {
    this.isTalking = false;
  }

  private pickNewTarget(): void {
    if (this.isStationary) return;
    if (this.village && this.village.buildings.length > 0) {
      const targetBuilding = this.village.buildings[Math.floor(Math.random() * this.village.buildings.length)];
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        0,
        (Math.random() - 0.5) * 4
      );
      this.targetPos.copy(targetBuilding).add(offset);
      this.targetPos.y = this.mesh.position.y;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.random() * 10;
      this.targetPos.set(
        this.mesh.position.x + Math.cos(angle) * dist,
        this.mesh.position.y,
        this.mesh.position.z + Math.sin(angle) * dist
      );
    }
  }

  update(delta: number, heightMap: HeightMap): void {
    if (this.isTalking || this.isStationary) return;

    if (this.waitTime > 0) {
      this.waitTime -= delta;
      return;
    }

    // Move toward target
    const dir = new THREE.Vector3().subVectors(this.targetPos, this.mesh.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 0.5) {
      this.waitTime = 1 + Math.random() * 2;
      this.pickNewTarget();
      return;
    }

    dir.normalize();
    const moveX = dir.x * this.speed * delta;
    const moveZ = dir.z * this.speed * delta;
    
    const newX = this.mesh.position.x + moveX;
    const newZ = this.mesh.position.z + moveZ;

    // Constrain to village radius if in a village
    if (this.village) {
      const distFromCenter = Math.sqrt(
        Math.pow(newX - this.village.center.x, 2) + 
        Math.pow(newZ - this.village.center.z, 2)
      );
      
      if (distFromCenter <= this.village.radius) {
        this.mesh.position.x = newX;
        this.mesh.position.z = newZ;
      } else {
        this.waitTime = 0.5;
        this.pickNewTarget();
        return;
      }
    } else {
      this.mesh.position.x = newX;
      this.mesh.position.z = newZ;
    }

    // Update height from terrain heightmap
    const hx = (this.mesh.position.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const hz = (this.mesh.position.z / WORLD_SCALE) + WORLD_SIZE / 2;
    this.mesh.position.y = heightMap.getInterpolated(hx, hz);

    // Face direction
    this.mesh.lookAt(this.targetPos.x, this.mesh.position.y, this.targetPos.z);
  }
}
