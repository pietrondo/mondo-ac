import * as THREE from 'three';
import { HeightMap } from './heightmap';
import { BiomeMap, BiomeType } from './biomeMap';
import { WORLD_SIZE, WORLD_SCALE, rng } from '../config';

export function createDecorations(
  heightMap: HeightMap,
  biomeMap: BiomeMap,
): THREE.Group {
  const group = new THREE.Group();

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
            treePositions.push(makeMatrix(worldX, worldY, worldZ, 1 + rng.next() * 2));
          }
          break;
        case BiomeType.PLAINS:
          if (r < 0.05) {
            treePositions.push(makeMatrix(worldX, worldY, worldZ, 1 + rng.next() * 1.5));
          }
          break;
        case BiomeType.MOUNTAIN:
          if (r < 0.1) {
            rockPositions.push(makeMatrix(worldX, worldY, worldZ, 0.5 + rng.next()));
          }
          break;
        case BiomeType.DESERT:
          if (r < 0.08) {
            cactusPositions.push(makeMatrix(worldX, worldY, worldZ, 1 + rng.next()));
          }
          break;
        case BiomeType.SNOW:
          if (r < 0.05) {
            rockPositions.push(makeMatrix(worldX, worldY, worldZ, 0.3 + rng.next() * 0.7));
          }
          break;
      }
    }
  }

  // Trees
  if (treePositions.length > 0) {
    group.add(createInstancedMesh(treePositions, createTreeGeometry(), 0x33691E));
  }
  // Rocks
  if (rockPositions.length > 0) {
    group.add(createInstancedMesh(rockPositions, createRockGeometry(), 0x757575));
  }
  // Cactus
  if (cactusPositions.length > 0) {
    group.add(createInstancedMesh(cactusPositions, createCactusGeometry(), 0x8D6E63));
  }

  return group;
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
  return new THREE.CapsuleGeometry(0.4, 2, 4, 8);
}
