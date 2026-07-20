import * as THREE from 'three';
import { HeightMap } from './heightmap';
import { BiomeMap, BiomeType } from './biomeMap';
import { WORLD_SIZE, WORLD_SCALE, rng } from '../config';

export interface DecorationCollider {
  position: THREE.Vector3;
  radius: number;
  height: number;
  type: 'tree' | 'rock' | 'cactus';
}

export class Tumbleweed {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: number;
  radius: number;

  constructor(position: THREE.Vector3, scale: number) {
    this.position = position.clone();
    this.scale = scale;
    this.radius = 0.5 * scale;
    this.velocity = new THREE.Vector3(
      2.0 + Math.random() * 2.0,
      0,
      1.0 + Math.random() * 2.0
    );
    this.quaternion = new THREE.Quaternion();
  }

  update(delta: number, heightMap: HeightMap) {
    const prevX = this.position.x;
    const prevZ = this.position.z;

    // Wind force/velocity: let's say wind is (3.0, 0, 1.5)
    const windVel = new THREE.Vector3(3.0, 0, 1.5);
    // Accelerate towards wind
    this.velocity.x += (windVel.x - this.velocity.x) * 1.5 * delta;
    this.velocity.z += (windVel.z - this.velocity.z) * 1.5 * delta;

    // Vertical bounce/gravity
    this.velocity.y -= 9.8 * delta;
    this.position.y += this.velocity.y * delta;

    // Horizontal movement
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Wrap around world boundary
    const limit = (WORLD_SIZE * WORLD_SCALE) / 2;
    if (this.position.x > limit) {
      this.position.x = -limit;
    } else if (this.position.x < -limit) {
      this.position.x = limit;
    }
    if (this.position.z > limit) {
      this.position.z = -limit;
    } else if (this.position.z < -limit) {
      this.position.z = limit;
    }

    // Heightmap alignment & bouncing
    const gx = (this.position.x / WORLD_SCALE) + WORLD_SIZE / 2;
    const gz = (this.position.z / WORLD_SCALE) + WORLD_SIZE / 2;
    const terrainY = heightMap.getInterpolated(gx, gz);
    const minY = terrainY + this.radius;

    if (this.position.y <= minY) {
      this.position.y = minY;
      // Bounce!
      this.velocity.y = 2.0 + Math.random() * 3.0;
    }

    // Roll rotation based on horizontal displacement
    // (Using the wrapped horizontal delta)
    let dx = this.position.x - prevX;
    let dz = this.position.z - prevZ;
    // Handle wrap-around boundary delta jump
    if (Math.abs(dx) > limit) {
      dx = dx > 0 ? dx - 2 * limit : dx + 2 * limit;
    }
    if (Math.abs(dz) > limit) {
      dz = dz > 0 ? dz - 2 * limit : dz + 2 * limit;
    }

    const dDistance = Math.sqrt(dx * dx + dz * dz);
    if (dDistance > 0.0001) {
      const angle = dDistance / this.radius;
      const axis = new THREE.Vector3(dz, 0, -dx).normalize();
      const rollRotation = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      this.quaternion.premultiply(rollRotation);
    }
  }
}

export class TumbleweedManager {
  tumbleweeds: Tumbleweed[];
  mesh: THREE.InstancedMesh;

  constructor(tumbleweeds: Tumbleweed[], mesh: THREE.InstancedMesh) {
    this.tumbleweeds = tumbleweeds;
    this.mesh = mesh;
  }

  update(delta: number, heightMap: HeightMap) {
    const tempMatrix = new THREE.Matrix4();
    const tempScaleVec = new THREE.Vector3();
    for (let i = 0; i < this.tumbleweeds.length; i++) {
      const tw = this.tumbleweeds[i];
      tw.update(delta, heightMap);
      tempScaleVec.set(tw.scale, tw.scale, tw.scale);
      tempMatrix.compose(tw.position, tw.quaternion, tempScaleVec);
      this.mesh.setMatrixAt(i, tempMatrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export function createDecorations(
  heightMap: HeightMap,
  biomeMap: BiomeMap,
): {
  group: THREE.Group;
  colliders: DecorationCollider[];
  tumbleweedManager?: TumbleweedManager;
} {
  const group = new THREE.Group();
  const colliders: DecorationCollider[] = [];

  const treePositions: THREE.Matrix4[] = [];
  const rockPositions: THREE.Matrix4[] = [];
  const cactusPositions: THREE.Matrix4[] = [];
  const mushroomPositions: THREE.Matrix4[] = [];
  const crystalPositions: THREE.Matrix4[] = [];

  for (let x = 2; x < WORLD_SIZE - 2; x += 3) {
    for (let z = 2; z < WORLD_SIZE - 2; z += 3) {
      const hx = x;
      const hz = z;
      const h = heightMap.get(hx, hz);
      const biome = biomeMap.getBiome(hx, hz);

      const worldX = (x - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldZ = (z - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldY = h;

      const r = rng.next();

      switch (biome) {
        case BiomeType.FOREST:
          if (r < 0.3) {
            const scale = 1 + rng.next() * 2;
            treePositions.push(makeMatrix(worldX, worldY, worldZ, scale));
            colliders.push({ position: new THREE.Vector3(worldX, worldY, worldZ), radius: 0.5 * scale, height: 4 * scale, type: 'tree' });
          } else if (r < 0.5) {
            const scale = 0.5 + rng.next() * 0.8;
            const ox = (rng.next() - 0.5) * 1.5;
            const oz = (rng.next() - 0.5) * 1.5;
            const my = heightMap.getInterpolated((worldX + ox) / WORLD_SCALE + WORLD_SIZE / 2, (worldZ + oz) / WORLD_SCALE + WORLD_SIZE / 2);
            mushroomPositions.push(makeMatrix(worldX + ox, my, worldZ + oz, scale));
          }
          break;
        case BiomeType.PLAINS:
          if (r < 0.05) {
            const scale = 1 + rng.next() * 1.5;
            treePositions.push(makeMatrix(worldX, worldY, worldZ, scale));
            colliders.push({ position: new THREE.Vector3(worldX, worldY, worldZ), radius: 0.5 * scale, height: 4 * scale, type: 'tree' });
          }
          break;
        case BiomeType.MOUNTAIN:
          if (r < 0.1) {
            const scale = 0.5 + rng.next();
            rockPositions.push(makeMatrix(worldX, worldY, worldZ, scale));
            colliders.push({ position: new THREE.Vector3(worldX, worldY, worldZ), radius: 0.8 * scale, height: 1 * scale, type: 'rock' });
          } else if (r < 0.25) {
            const scale = 0.6 + rng.next() * 0.8;
            const ox = (rng.next() - 0.5) * 1.5;
            const oz = (rng.next() - 0.5) * 1.5;
            const cy = heightMap.getInterpolated((worldX + ox) / WORLD_SCALE + WORLD_SIZE / 2, (worldZ + oz) / WORLD_SCALE + WORLD_SIZE / 2);
            crystalPositions.push(makeMatrix(worldX + ox, cy, worldZ + oz, scale));
          }
          break;
        case BiomeType.DESERT:
          if (r < 0.08) {
            const scale = 1 + rng.next();
            cactusPositions.push(makeMatrix(worldX, worldY, worldZ, scale));
            colliders.push({ position: new THREE.Vector3(worldX, worldY, worldZ), radius: 0.4 * scale, height: 2 * scale, type: 'cactus' });
          }
          break;
        case BiomeType.SNOW:
          if (r < 0.05) {
            const scale = 0.3 + rng.next() * 0.7;
            rockPositions.push(makeMatrix(worldX, worldY, worldZ, scale));
            colliders.push({ position: new THREE.Vector3(worldX, worldY, worldZ), radius: 0.8 * scale, height: 1 * scale, type: 'rock' });
          }
          break;
      }
    }
  }

  // Trees
  if (treePositions.length > 0) {
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 5);
    trunkGeometry.translate(0, 1, 0);
    group.add(createInstancedMesh(treePositions, trunkGeometry, 0x5D4037, true)); // Brown trunk

    const foliageGeometry = new THREE.ConeGeometry(2, 4, 6);
    foliageGeometry.translate(0, 3, 0);
    group.add(createInstancedMesh(treePositions, foliageGeometry, 0x33691E, true)); // Green foliage
  }
  // Rocks
  if (rockPositions.length > 0) {
    group.add(createInstancedMesh(rockPositions, createRockGeometry(), 0x757575));
  }
  // Cactus
  if (cactusPositions.length > 0) {
    group.add(createInstancedMesh(cactusPositions, createCactusGeometry(), 0x2E7D32)); // Green cactus
  }

  // Mushrooms (cap + stem)
  if (mushroomPositions.length > 0) {
    const stemGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.5, 5);
    stemGeom.translate(0, 0.25, 0);
    group.add(createInstancedMesh(mushroomPositions, stemGeom, 0xEEEEEE));

    const capGeom = new THREE.SphereGeometry(0.25, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    capGeom.translate(0, 0.5, 0);
    group.add(createInstancedMesh(mushroomPositions, capGeom, 0xD32F2F));
  }

  // Crystals (mountain)
  if (crystalPositions.length > 0) {
    const crystalGeom = createCrystalGeometry();
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      emissive: 0x00E5FF,
      emissiveIntensity: 1.5,
      flatShading: true,
      transparent: true,
      opacity: 0.9
    });
    const crystalMesh = new THREE.InstancedMesh(crystalGeom, crystalMat, crystalPositions.length);
    crystalMesh.castShadow = true;
    crystalMesh.receiveShadow = true;
    for (let i = 0; i < crystalPositions.length; i++) {
      crystalMesh.setMatrixAt(i, crystalPositions[i]);
    }
    crystalMesh.instanceMatrix.needsUpdate = true;
    group.add(crystalMesh);
  }

  // Tumbleweeds
  const tumbleweeds: Tumbleweed[] = [];
  let tumbleweedCount = 0;
  for (let attempt = 0; attempt < 1000 && tumbleweedCount < 20; attempt++) {
    const tx = Math.floor(rng.next() * (WORLD_SIZE - 4)) + 2;
    const tz = Math.floor(rng.next() * (WORLD_SIZE - 4)) + 2;
    if (biomeMap.getBiome(tx, tz) === BiomeType.DESERT) {
      const worldX = (tx - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldZ = (tz - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldY = heightMap.get(tx, tz);
      const scale = 0.8 + rng.next() * 0.6;
      tumbleweeds.push(new Tumbleweed(new THREE.Vector3(worldX, worldY, worldZ), scale));
      tumbleweedCount++;
    }
  }

  // Fallback if no desert biome found
  if (tumbleweeds.length === 0) {
    for (let i = 0; i < 10; i++) {
      const tx = Math.floor(rng.next() * (WORLD_SIZE - 4)) + 2;
      const tz = Math.floor(rng.next() * (WORLD_SIZE - 4)) + 2;
      const worldX = (tx - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldZ = (tz - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldY = heightMap.get(tx, tz);
      const scale = 0.8 + rng.next() * 0.6;
      tumbleweeds.push(new Tumbleweed(new THREE.Vector3(worldX, worldY, worldZ), scale));
    }
  }

  let tumbleweedManager: TumbleweedManager | undefined;
  if (tumbleweeds.length > 0) {
    const geom = new THREE.IcosahedronGeometry(0.5, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8D6E63,
      flatShading: true
    });
    const instancedMesh = new THREE.InstancedMesh(geom, mat, tumbleweeds.length);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    for (let i = 0; i < tumbleweeds.length; i++) {
      const tw = tumbleweeds[i];
      const m = new THREE.Matrix4().compose(
        tw.position,
        tw.quaternion,
        new THREE.Vector3(tw.scale, tw.scale, tw.scale)
      );
      instancedMesh.setMatrixAt(i, m);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    group.add(instancedMesh);
    tumbleweedManager = new TumbleweedManager(tumbleweeds, instancedMesh);
  }

  return { group, colliders, tumbleweedManager };
}

function makeMatrix(x: number, y: number, z: number, scale: number): THREE.Matrix4 {
  const m = new THREE.Matrix4();
  m.compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion(),
    new THREE.Vector3(scale, scale, scale)
  );
  return m;
}

function createInstancedMesh(
  matrices: THREE.Matrix4[],
  geometry: THREE.BufferGeometry,
  colorHex: number,
  castShadow = false
): THREE.InstancedMesh {
  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    flatShading: true
  });
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  for (let i = 0; i < matrices.length; i++) {
    mesh.setMatrixAt(i, matrices[i]);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function createRockGeometry(): THREE.BufferGeometry {
  return new THREE.IcosahedronGeometry(1, 0);
}

function createCactusGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CapsuleGeometry(0.4, 2, 4, 8);
  geo.translate(0, 1.4, 0);
  return geo;
}

function createCrystalGeometry(): THREE.BufferGeometry {
  const geom = new THREE.OctahedronGeometry(0.4, 0);
  geom.scale(0.6, 1.5, 0.6);
  geom.translate(0, 0.4, 0);
  return geom;
}
