import * as THREE from 'three';
import { createDungeonExitPortal } from './structures';

export interface DungeonRoom {
  x: number;
  z: number;
  width: number;
  depth: number;
  type: 'entrance' | 'regular' | 'boss';
}

export interface DungeonResult {
  group: THREE.Group;
  colliders: { box: THREE.Box3; type: 'solid' | 'trigger' }[];
  entrancePos: THREE.Vector3;
  exitPortalPos: THREE.Vector3;
  bossSpawnPos: THREE.Vector3;
  monsterSpawns: THREE.Vector3[];
  itemSpawns: THREE.Vector3[];
  rooms: DungeonRoom[];
  floorY: number;
}

// Simple seedable random number generator for procedural dungeons
class DungeonRNG {
  private s: number;
  constructor(seed: number) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  next(): number {
    return (this.s = (this.s * 16807) % 2147483647) / 2147483647;
  }
}

export function generateDungeon(seed: number = 12345, floorY: number = -150): DungeonResult {
  const rng = new DungeonRNG(seed);
  const group = new THREE.Group();
  group.name = 'dungeon_subterranean';

  const colliders: { box: THREE.Box3; type: 'solid' | 'trigger' }[] = [];
  const monsterSpawns: THREE.Vector3[] = [];
  const itemSpawns: THREE.Vector3[] = [];
  const rooms: DungeonRoom[] = [];

  // Materials
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x22222b, flatShading: true, roughness: 0.9 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x363642, flatShading: true, roughness: 0.8 });
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x181820, flatShading: true, roughness: 0.95 });
  const torchMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });

  const roomHeight = 6;
  const wallThickness = 0.5;

  // Generate sequence of rooms
  // Room 0: Entrance Room
  // Rooms 1..3: Regular Rooms
  // Room 4: Boss Arena
  const roomConfigs = [
    { type: 'entrance' as const, width: 14, depth: 14 },
    { type: 'regular' as const, width: 16, depth: 16 },
    { type: 'regular' as const, width: 18, depth: 14 },
    { type: 'regular' as const, width: 16, depth: 18 },
    { type: 'boss' as const, width: 30, depth: 30 },
  ];

  let currentZ = 0;
  for (let i = 0; i < roomConfigs.length; i++) {
    const cfg = roomConfigs[i];
    const roomX = (rng.next() - 0.5) * 6; // Slight X jitter
    const roomZ = currentZ;

    rooms.push({
      x: roomX,
      z: roomZ,
      width: cfg.width,
      depth: cfg.depth,
      type: cfg.type,
    });

    currentZ += cfg.depth / 2 + 12 + (i < roomConfigs.length - 1 ? roomConfigs[i + 1].depth / 2 : 0);
  }

  // Create room geometries, colliders, lights, and spawns
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const halfW = room.width / 2;
    const halfD = room.depth / 2;

    // Floor
    const floorGeo = new THREE.BoxGeometry(room.width, 0.4, room.depth);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(room.x, floorY - 0.2, room.z);
    group.add(floorMesh);

    // Ceiling
    const ceilGeo = new THREE.BoxGeometry(room.width, 0.4, room.depth);
    const ceilMesh = new THREE.Mesh(ceilGeo, ceilingMat);
    ceilMesh.position.set(room.x, floorY + roomHeight + 0.2, room.z);
    group.add(ceilMesh);

    // Walls
    // North wall (positive Z)
    if (i < rooms.length - 1) { // doorway to next corridor
      const doorW = 5;
      const sideW = (room.width - doorW) / 2;
      
      const nLeft = new THREE.Mesh(new THREE.BoxGeometry(sideW, roomHeight, wallThickness), wallMat);
      nLeft.position.set(room.x - (halfW - sideW / 2), floorY + roomHeight / 2, room.z + halfD);
      group.add(nLeft);
      colliders.push({ box: new THREE.Box3().setFromObject(nLeft), type: 'solid' });

      const nRight = new THREE.Mesh(new THREE.BoxGeometry(sideW, roomHeight, wallThickness), wallMat);
      nRight.position.set(room.x + (halfW - sideW / 2), floorY + roomHeight / 2, room.z + halfD);
      group.add(nRight);
      colliders.push({ box: new THREE.Box3().setFromObject(nRight), type: 'solid' });
    } else {
      const nWall = new THREE.Mesh(new THREE.BoxGeometry(room.width, roomHeight, wallThickness), wallMat);
      nWall.position.set(room.x, floorY + roomHeight / 2, room.z + halfD);
      group.add(nWall);
      colliders.push({ box: new THREE.Box3().setFromObject(nWall), type: 'solid' });
    }

    // South wall (negative Z)
    if (i > 0) { // doorway to previous corridor
      const doorW = 5;
      const sideW = (room.width - doorW) / 2;

      const sLeft = new THREE.Mesh(new THREE.BoxGeometry(sideW, roomHeight, wallThickness), wallMat);
      sLeft.position.set(room.x - (halfW - sideW / 2), floorY + roomHeight / 2, room.z - halfD);
      group.add(sLeft);
      colliders.push({ box: new THREE.Box3().setFromObject(sLeft), type: 'solid' });

      const sRight = new THREE.Mesh(new THREE.BoxGeometry(sideW, roomHeight, wallThickness), wallMat);
      sRight.position.set(room.x + (halfW - sideW / 2), floorY + roomHeight / 2, room.z - halfD);
      group.add(sRight);
      colliders.push({ box: new THREE.Box3().setFromObject(sRight), type: 'solid' });
    } else {
      const sWall = new THREE.Mesh(new THREE.BoxGeometry(room.width, roomHeight, wallThickness), wallMat);
      sWall.position.set(room.x, floorY + roomHeight / 2, room.z - halfD);
      group.add(sWall);
      colliders.push({ box: new THREE.Box3().setFromObject(sWall), type: 'solid' });
    }

    // West wall (negative X)
    const wWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, roomHeight, room.depth), wallMat);
    wWall.position.set(room.x - halfW, floorY + roomHeight / 2, room.z);
    group.add(wWall);
    colliders.push({ box: new THREE.Box3().setFromObject(wWall), type: 'solid' });

    // East wall (positive X)
    const eWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, roomHeight, room.depth), wallMat);
    eWall.position.set(room.x + halfW, floorY + roomHeight / 2, room.z);
    group.add(eWall);
    colliders.push({ box: new THREE.Box3().setFromObject(eWall), type: 'solid' });

    // Room lighting (Torches)
    const torchLight = new THREE.PointLight(0xff8833, 1.8, 18);
    torchLight.position.set(room.x, floorY + 3.5, room.z);
    group.add(torchLight);

    const torchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), torchMat);
    torchMesh.position.set(room.x, floorY + 3.5, room.z);
    group.add(torchMesh);

    // Spawns based on room type
    if (room.type === 'regular') {
      // Monster spawns
      for (let m = 0; m < 2; m++) {
        monsterSpawns.push(new THREE.Vector3(
          room.x + (rng.next() - 0.5) * (room.width - 4),
          floorY,
          room.z + (rng.next() - 0.5) * (room.depth - 4)
        ));
      }
      // Item spawns
      itemSpawns.push(new THREE.Vector3(
        room.x + (rng.next() - 0.5) * (room.width - 4),
        floorY + 0.5,
        room.z + (rng.next() - 0.5) * (room.depth - 4)
      ));
    }
  }

  // Corridors connecting rooms
  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];

    const corrStartZ = r1.z + r1.depth / 2;
    const corrEndZ = r2.z - r2.depth / 2;
    const corrLength = corrEndZ - corrStartZ;
    const corrMidZ = (corrStartZ + corrEndZ) / 2;
    const corrMidX = (r1.x + r2.x) / 2;
    const corrWidth = 5;

    // Floor
    const corrFloor = new THREE.Mesh(new THREE.BoxGeometry(corrWidth, 0.4, corrLength + 0.2), floorMat);
    corrFloor.position.set(corrMidX, floorY - 0.2, corrMidZ);
    group.add(corrFloor);

    // Ceiling
    const corrCeil = new THREE.Mesh(new THREE.BoxGeometry(corrWidth, 0.4, corrLength + 0.2), ceilingMat);
    corrCeil.position.set(corrMidX, floorY + roomHeight + 0.2, corrMidZ);
    group.add(corrCeil);

    // Side walls
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, roomHeight, corrLength), wallMat);
    leftWall.position.set(corrMidX - corrWidth / 2, floorY + roomHeight / 2, corrMidZ);
    group.add(leftWall);
    colliders.push({ box: new THREE.Box3().setFromObject(leftWall), type: 'solid' });

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, roomHeight, corrLength), wallMat);
    rightWall.position.set(corrMidX + corrWidth / 2, floorY + roomHeight / 2, corrMidZ);
    group.add(rightWall);
    colliders.push({ box: new THREE.Box3().setFromObject(rightWall), type: 'solid' });

    // Corridor torch
    const corrLight = new THREE.PointLight(0xff6622, 1.2, 12);
    corrLight.position.set(corrMidX, floorY + 3.0, corrMidZ);
    group.add(corrLight);
  }

  // Positions
  const entranceRoom = rooms[0];
  const bossRoom = rooms[rooms.length - 1];

  const entrancePos = new THREE.Vector3(entranceRoom.x, floorY, entranceRoom.z - 2);
  const exitPortalPos = new THREE.Vector3(bossRoom.x, floorY, bossRoom.z + bossRoom.depth / 2 - 4);
  const bossSpawnPos = new THREE.Vector3(bossRoom.x, floorY, bossRoom.z);

  // Add Exit Portal in Boss Room
  const exitPortal = createDungeonExitPortal();
  exitPortal.position.copy(exitPortalPos);
  group.add(exitPortal);

  const exitPortalCollider = (exitPortal as any).collider;
  if (exitPortalCollider) {
    const worldBox = exitPortalCollider.box.clone();
    worldBox.translate(exitPortal.position);
    colliders.push({ box: worldBox, type: 'trigger' });
  }

  return {
    group,
    colliders,
    entrancePos,
    exitPortalPos,
    bossSpawnPos,
    monsterSpawns,
    itemSpawns,
    rooms,
    floorY,
  };
}
