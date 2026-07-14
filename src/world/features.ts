import * as THREE from 'three';
import { HeightMap } from './heightmap';
import { BiomeMap, BiomeType } from './biomeMap';
import { createHouse, createCastle, createRuin } from './structures';
import { WORLD_SIZE, WORLD_SCALE, rng } from '../config';

export interface WorldFeatures {
  structures: THREE.Group;
  structureColliders: { box: THREE.Box3; type: 'solid' | 'trigger' }[];
  npcSpawns: THREE.Vector3[];
  monsterSpawns: THREE.Vector3[];
  itemSpawns: THREE.Vector3[];
}

export function placeFeatures(
  heightMap: HeightMap,
  biomeMap: BiomeMap
): WorldFeatures {
  const structures = new THREE.Group();
  const structureColliders: { box: THREE.Box3; type: 'solid' | 'trigger' }[] = [];
  const npcSpawns: THREE.Vector3[] = [];
  const monsterSpawns: THREE.Vector3[] = [];
  const itemSpawns: THREE.Vector3[] = [];

  // Grid sampling for feature placement
  const gridSize = 8;
  for (let gx = 2; gx < WORLD_SIZE / gridSize - 2; gx++) {
    for (let gz = 2; gz < WORLD_SIZE / gridSize - 2; gz++) {
      const cx = gx * gridSize + Math.floor(rng.next() * gridSize);
      const cz = gz * gridSize + Math.floor(rng.next() * gridSize);

      const biome = biomeMap.getBiome(cx, cz);
      const elevation = heightMap.get(cx, cz);
      const worldX = (cx - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldZ = (cz - WORLD_SIZE / 2) * WORLD_SCALE;

      switch (biome) {
        case BiomeType.PLAINS: {
          // Village (cluster of houses)
          if (rng.next() < 0.03) {
            const houseCount = 3 + Math.floor(rng.next() * 4);
            for (let i = 0; i < houseCount; i++) {
              const house = createHouse();
              const offsetX = (rng.next() - 0.5) * 20;
              const offsetZ = (rng.next() - 0.5) * 20;
              const hx = cx + offsetX / WORLD_SCALE;
              const hz = cz + offsetZ / WORLD_SCALE;
              const hy = heightMap.getInterpolated(hx, hz);

              house.position.set(
                worldX + offsetX,
                hy,
                worldZ + offsetZ
              );
              house.rotation.y = rng.next() * Math.PI * 2;
              structures.add(house);

              // Extract and add house collider
              const houseCollider = (house as any).collider;
              if (houseCollider) {
                const worldBox = houseCollider.box.clone();
                worldBox.translate(house.position);
                structureColliders.push({ box: worldBox, type: houseCollider.type });
              }

              // NPC spawn near house
              npcSpawns.push(new THREE.Vector3(
                house.position.x + (rng.next() - 0.5) * 5,
                hy,
                house.position.z + (rng.next() - 0.5) * 5
              ));
            }
            // Items in village
            for (let i = 0; i < 3; i++) {
              itemSpawns.push(new THREE.Vector3(
                worldX + (rng.next() - 0.5) * 15,
                elevation,
                worldZ + (rng.next() - 0.5) * 15
              ));
            }
          }
          break;
        }
        case BiomeType.MOUNTAIN: {
          // Castle (rare)
          if (rng.next() < 0.015) {
            const castle = createCastle();
            castle.position.set(worldX, elevation, worldZ);
            structures.add(castle);

            // Extract and add castle collider
            const castleCollider = (castle as any).collider;
            if (castleCollider) {
              const worldBox = castleCollider.box.clone();
              worldBox.translate(castle.position);
              structureColliders.push({ box: worldBox, type: castleCollider.type });
            }

            // NPC guards
            for (let i = 0; i < 4; i++) {
              npcSpawns.push(new THREE.Vector3(
                worldX + (rng.next() - 0.5) * 20,
                elevation,
                worldZ + (rng.next() - 0.5) * 20
              ));
            }

            // Rare items
            itemSpawns.push(new THREE.Vector3(worldX, elevation + 1, worldZ));
          }
          break;
        }
        case BiomeType.DESERT:
        case BiomeType.SNOW: {
          // Ruins
          if (rng.next() < 0.04) {
            const ruin = createRuin();
            ruin.position.set(worldX, elevation, worldZ);
            structures.add(ruin);

            // Extract and add ruin collider
            const ruinCollider = (ruin as any).collider;
            if (ruinCollider) {
              const worldBox = ruinCollider.box.clone();
              worldBox.translate(ruin.position);
              structureColliders.push({ box: worldBox, type: ruinCollider.type });
            }

            // Items/Monsters at ruins
            for (let i = 0; i < 2; i++) {
              itemSpawns.push(new THREE.Vector3(
                worldX + (rng.next() - 0.5) * 8,
                elevation,
                worldZ + (rng.next() - 0.5) * 8
              ));
            }
          }
          break;
        }
      }

      // Random items scattered
      if (rng.next() < 0.01) {
        itemSpawns.push(new THREE.Vector3(worldX, elevation + 0.5, worldZ));
      }

      // Monster spawns (dangerous biomes)
      if (biome === BiomeType.FOREST || biome === BiomeType.DESERT || biome === BiomeType.MOUNTAIN) {
        if (rng.next() < 0.02) {
          monsterSpawns.push(new THREE.Vector3(worldX, elevation, worldZ));
        }
      }
    }
  }

  structures.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return { structures, structureColliders, npcSpawns, monsterSpawns, itemSpawns };
}
