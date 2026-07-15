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

export function createDecorations(
  heightMap: HeightMap,
  biomeMap: BiomeMap,
): { group: THREE.Group; colliders: DecorationCollider[] } {
  const group = new THREE.Group();
  const colliders: DecorationCollider[] = [];

  const treePositions: THREE.Matrix4[] = [];
  const rockPositions: THREE.Matrix4[] = [];
  const cactusPositions: THREE.Matrix4[] = [];

  for (let x = 2; x < WORLD_SIZE - 2; x += 2) {
    for (let z = 2; z < WORLD_SIZE - 2; z += 2) {
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
    group.add(createInstancedMesh(treePositions, trunkGeometry, 0x5D4037)); // Brown trunk

    const foliageGeometry = new THREE.ConeGeometry(2, 4, 6);
    foliageGeometry.translate(0, 3, 0);
    group.add(createInstancedMesh(treePositions, foliageGeometry, 0x33691E)); // Green foliage
  }
  // Rocks
  if (rockPositions.length > 0) {
    group.add(createInstancedMesh(rockPositions, createRockGeometry(), 0x757575));
  }
  // Cactus
  if (cactusPositions.length > 0) {
    group.add(createInstancedMesh(cactusPositions, createCactusGeometry(), 0x2E7D32)); // Green cactus
  }

  return { group, colliders };
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
  colorHex: number
): THREE.InstancedMesh {
  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    flatShading: true
  });
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  for (let i = 0; i < matrices.length; i++) {
    mesh.setMatrixAt(i, matrices[i]);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function createTreeGeometry(): THREE.BufferGeometry {
  const trunk = new THREE.CylinderGeometry(0.3, 0.5, 2, 5);
  trunk.translate(0, 1, 0);
  const foliage = new THREE.ConeGeometry(2, 4, 6);
  foliage.translate(0, 3, 0);

  // Simplified: just return foliage as tree representation
  return foliage;
}

function createRockGeometry(): THREE.BufferGeometry {
  return new THREE.IcosahedronGeometry(1, 0);
}

function createCactusGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CapsuleGeometry(0.4, 2, 4, 8);
  geo.translate(0, 1.4, 0);
  return geo;
}
