import * as THREE from 'three';
import { HeightMap } from '../world/heightmap';
import { WORLD_SCALE, WORLD_SIZE } from '../config';
import { disposeObject3D, markSharedGeometry, markSharedMaterial } from '../utils/dispose';

const npcMatCache = new Map<string, THREE.Material>();
function getOrCreateNPCMaterial(key: string, createFn: () => THREE.Material): THREE.Material {
  let mat = npcMatCache.get(key);
  if (!mat) {
    mat = createFn();
    markSharedMaterial(mat);
    npcMatCache.set(key, mat);
  }
  return mat;
}

const npcGeoCache = new Map<string, THREE.BufferGeometry>();
function getOrCreateNPCGeometry(key: string, createFn: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = npcGeoCache.get(key);
  if (!geo) {
    geo = createFn();
    markSharedGeometry(geo);
    npcGeoCache.set(key, geo);
  }
  return geo;
}

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
  private animTime = 0;
  private bodyMesh: THREE.Mesh;
  private headGroup: THREE.Group;
  private indicatorGroup: THREE.Group;
  private exclamation: THREE.Group;
  private question: THREE.Group;
  private targetHeadQuat = new THREE.Quaternion();
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
        getOrCreateNPCGeometry('merchant_hat', () => new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8)),
        getOrCreateNPCMaterial('merchant_hat_mat', () => new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true }))
      );
      hatMesh.position.y = 2.4;
    } else if (this.dialogueTreeId.includes('elder')) {
      bodyColor = 0x3F51B5; // Deep Blue Robes
      headColor = 0xFFECB3;
      // White Staff
      const staff = new THREE.Mesh(
        getOrCreateNPCGeometry('elder_staff', () => new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6)),
        getOrCreateNPCMaterial('elder_staff_mat', () => new THREE.MeshStandardMaterial({ color: 0xFFFFFF, flatShading: true }))
      );
      staff.position.set(0.6, 1.1, 0.2);
      this.mesh.add(staff);
    } else if (this.dialogueTreeId.includes('guard')) {
      bodyColor = 0x78909C; // Iron/Steel
      headColor = 0xFFCC80;
      // Guard Helmet
      hatMesh = new THREE.Mesh(
        getOrCreateNPCGeometry('guard_helmet', () => new THREE.BoxGeometry(0.7, 0.6, 0.7)),
        getOrCreateNPCMaterial('guard_helmet_mat', () => new THREE.MeshStandardMaterial({ color: 0x37474F, flatShading: true }))
      );
      hatMesh.position.y = 2.15;
    } else if (this.dialogueTreeId.includes('traveler')) {
      bodyColor = 0x009688; // Teal Cloak
      headColor = 0xD7CCC8;
    }

    
    this.bodyMesh = new THREE.Mesh(
      getOrCreateNPCGeometry('body_box', () => new THREE.BoxGeometry(0.8, 1.4, 0.5)),
      getOrCreateNPCMaterial(`body_mat_${bodyColor}`, () => new THREE.MeshStandardMaterial({ color: bodyColor, flatShading: true }))
    );
    this.bodyMesh.position.y = 0.7;
    this.mesh.add(this.bodyMesh);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.6, 0);
    
    const head = new THREE.Mesh(
      getOrCreateNPCGeometry('head_sphere', () => new THREE.SphereGeometry(0.35, 8, 8)),
      getOrCreateNPCMaterial(`head_mat_${headColor}`, () => new THREE.MeshStandardMaterial({ color: headColor, flatShading: true }))
    );
    head.position.y = 0.25;
    this.headGroup.add(head);

    if (hatMesh) {
      hatMesh.position.y -= 1.6; // adjust relative to headGroup
      this.headGroup.add(hatMesh);
    }
    
    this.mesh.add(this.headGroup);

    // Floating 3D status indicators
    this.indicatorGroup = new THREE.Group();
    this.indicatorGroup.position.set(0, 2.8, 0);
    
    const yellowBasicMat = getOrCreateNPCMaterial('yellow_basic_mat', () => new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    
    this.exclamation = new THREE.Group();
    const eLine = new THREE.Mesh(
      getOrCreateNPCGeometry('exclamation_line', () => new THREE.CylinderGeometry(0.06, 0.02, 0.3)),
      yellowBasicMat
    );
    eLine.position.y = 0.2;
    this.exclamation.add(eLine);
    const eDot = new THREE.Mesh(
      getOrCreateNPCGeometry('indicator_dot', () => new THREE.SphereGeometry(0.06)),
      yellowBasicMat
    );
    eDot.position.y = -0.05;
    this.exclamation.add(eDot);
    this.indicatorGroup.add(this.exclamation);

    this.question = new THREE.Group();
    const qArc = new THREE.Mesh(
      getOrCreateNPCGeometry('question_arc', () => new THREE.TorusGeometry(0.12, 0.04, 8, 16, Math.PI * 1.5)),
      yellowBasicMat
    );
    qArc.position.y = 0.2;
    this.question.add(qArc);
    const qDot2 = new THREE.Mesh(
      getOrCreateNPCGeometry('indicator_dot', () => new THREE.SphereGeometry(0.06)),
      yellowBasicMat
    );
    qDot2.position.set(0.12, -0.05, 0);
    this.question.add(qDot2);
    this.question.visible = false;
    this.indicatorGroup.add(this.question);
    
    this.mesh.add(this.indicatorGroup);

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

  update(delta: number, heightMap: HeightMap, playerPos?: THREE.Vector3): void {
    this.animTime += delta;
    
    // Breathing animation
    const breathY = 1.0 + Math.sin(this.animTime * 3.0) * 0.05;
    const breathXZ = 1.0 - Math.sin(this.animTime * 3.0) * 0.02;
    this.bodyMesh.scale.set(breathXZ, breathY, breathXZ);

    // Indicator animation
    this.indicatorGroup.position.y = 2.8 + Math.sin(this.animTime * 4.0) * 0.1;
    this.indicatorGroup.rotation.y += delta * 2.0;

    // Head orientation tracking
    if (playerPos) {
      const dist = this.mesh.position.distanceTo(playerPos);
      if (dist < 10) {
        // Track player
        const targetPoint = playerPos.clone().add(new THREE.Vector3(0, 1.5, 0));
        const dummy = new THREE.Object3D();
        dummy.position.copy(this.mesh.position).add(this.headGroup.position);
        dummy.lookAt(targetPoint);
        // Correct for mesh base rotation
        dummy.quaternion.premultiply(this.mesh.quaternion.clone().invert());
        this.targetHeadQuat.copy(dummy.quaternion);
        
        if (this.isTalking) {
           // Nodding
           const nod = Math.sin(this.animTime * 8.0) * 0.2;
           const nodQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), nod);
           this.targetHeadQuat.multiply(nodQuat);
        }
      } else {
        this.targetHeadQuat.identity();
      }
      this.headGroup.quaternion.slerp(this.targetHeadQuat, 5.0 * delta);
    }

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

  dispose(): void {
    disposeObject3D(this.mesh);
  }
}
