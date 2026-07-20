import * as THREE from 'three';
import { HeightMap } from './heightmap';
import { BiomeMap, BiomeType } from './biomeMap';
import { createHouse, createCastle, createRuin, createPyramid, createLighthouse, createTavern, createTemple, createWarehouse, createLibrary, createBunker, createWell, createMarketStall, createLantern, createFarmField, createPath, createCart, createTreeStump, createHayBale, createWindmill, createWatchtower, createBlacksmith } from './structures';
import { WORLD_SIZE, WORLD_SCALE, rng } from '../config';
import { getSpawnConfigForBiome, MonsterSpawnPoint, calculateDifficultyMultiplier } from './spawnSelection';

export interface VillageData {
  center: THREE.Vector3;
  radius: number;
  buildings: THREE.Vector3[];
  npcSpawns: THREE.Vector3[];
}

export interface WorldFeatures {
  structures: THREE.Group;
  structureColliders: { box: THREE.Box3; type: 'solid' | 'trigger' }[];
  npcSpawns: THREE.Vector3[];
  monsterSpawns: MonsterSpawnPoint[];
  itemSpawns: THREE.Vector3[];
  villages: VillageData[];
  poiPositions: { position: THREE.Vector3; type: string }[];
}

export function placeFeatures(
  heightMap: HeightMap,
  biomeMap: BiomeMap
): WorldFeatures {
  const structures = new THREE.Group();
  const structureColliders: { box: THREE.Box3; type: 'solid' | 'trigger' }[] = [];
  const npcSpawns: THREE.Vector3[] = [];
  const monsterSpawns: MonsterSpawnPoint[] = [];
  const itemSpawns: THREE.Vector3[] = [];
  const villages: VillageData[] = [];
  const poiPositions: { position: THREE.Vector3; type: string }[] = [];

  const gridSize = 32;
  for (let gx = 1; gx < WORLD_SIZE / gridSize - 1; gx++) {
    for (let gz = 1; gz < WORLD_SIZE / gridSize - 1; gz++) {
      const cx = gx * gridSize + Math.floor(rng.next() * gridSize);
      const cz = gz * gridSize + Math.floor(rng.next() * gridSize);

      const biome = biomeMap.getBiome(cx, cz);
      const elevation = heightMap.get(cx, cz);
      const worldX = (cx - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldZ = (cz - WORLD_SIZE / 2) * WORLD_SCALE;

      const spawnConfig = getSpawnConfigForBiome(biome);

      switch (biome) {
        case BiomeType.PLAINS: {
          if (rng.next() < 0.25) {
            const villageCenter = new THREE.Vector3(worldX, elevation, worldZ);
            const villageBuildings: THREE.Vector3[] = [];
            const villageNpcSpawns: THREE.Vector3[] = [];

            const houseCount = 4 + Math.floor(rng.next() * 4);
            const plazaRadius = 18;

            // House variants with colors
            const houseVariants = [
              { variant: 'small' as const, wallColor: 0xE8D5B7, roofColor: 0x8B4513, scale: 0.8 },
              { variant: 'small' as const, wallColor: 0xD7CCC8, roofColor: 0x795548, scale: 0.9 },
              { variant: 'medium' as const, wallColor: 0xFFE0B2, roofColor: 0x6D4C41, scale: 1.0 },
              { variant: 'medium' as const, wallColor: 0xF5F5DC, roofColor: 0x8D6E63, scale: 1.1 },
              { variant: 'large' as const, wallColor: 0xEFEBE9, roofColor: 0x5D4037, scale: 1.2 },
              { variant: 'large' as const, wallColor: 0xFFF8E1, roofColor: 0x4E342E, scale: 1.3 },
            ];

            for (let i = 0; i < houseCount; i++) {
              const angle = (i / houseCount) * Math.PI * 2 + rng.next() * 0.3;
              const radius = plazaRadius * (0.4 + rng.next() * 0.6);
              const offsetX = Math.cos(angle) * radius;
              const offsetZ = Math.sin(angle) * radius;
              const hx = cx + offsetX / WORLD_SCALE;
              const hz = cz + offsetZ / WORLD_SCALE;
              const hy = heightMap.getInterpolated(hx, hz);

              const variant = houseVariants[Math.floor(rng.next() * houseVariants.length)];
              const house = createHouse({
                variant: variant.variant,
                wallColor: variant.wallColor,
                roofColor: variant.roofColor,
                scale: variant.scale
              });
              const pos = new THREE.Vector3(worldX + offsetX, hy, worldZ + offsetZ);
              house.position.copy(pos);
              house.rotation.y = angle + Math.PI;
              structures.add(house);

              villageBuildings.push(pos.clone());

              const houseCollider = (house as any).collider;
              if (houseCollider) {
                const worldBox = houseCollider.box.clone();
                worldBox.translate(house.position);
                structureColliders.push({ box: worldBox, type: houseCollider.type });
              }

              for (let j = 0; j < 2; j++) {
                const npcSpawn = new THREE.Vector3(
                  pos.x + Math.cos(angle + j * Math.PI) * 3,
                  hy,
                  pos.z + Math.sin(angle + j * Math.PI) * 3
                );
                villageNpcSpawns.push(npcSpawn);
                npcSpawns.push(npcSpawn);
              }
            }

            // Central well
            const well = createWell();
            well.position.set(worldX, elevation, worldZ);
            structures.add(well);
            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'well' });

            // Market stall near tavern
            if (rng.next() < 0.6) {
              const marketStall = createMarketStall();
              const marketAngle = rng.next() * Math.PI * 2;
              const marketRadius = plazaRadius * 0.3;
              const marketPos = new THREE.Vector3(
                worldX + Math.cos(marketAngle) * marketRadius,
                elevation,
                worldZ + Math.sin(marketAngle) * marketRadius
              );
              marketStall.position.copy(marketPos);
              marketStall.rotation.y = marketAngle + Math.PI;
              structures.add(marketStall);
              poiPositions.push({ position: marketPos.clone(), type: 'market' });
            }

            // Lanterns along paths
            for (let i = 0; i < 3; i++) {
              const lanternAngle = (i / 3) * Math.PI * 2 + rng.next() * 0.5;
              const lanternRadius = plazaRadius * 0.5;
              const lantern = createLantern();
              lantern.position.set(
                worldX + Math.cos(lanternAngle) * lanternRadius,
                elevation,
                worldZ + Math.sin(lanternAngle) * lanternRadius
              );
              structures.add(lantern);
            }

            // Paths connecting buildings
            for (let i = 0; i < houseCount; i++) {
              const targetBuilding = villageBuildings[i];
              const pathLength = targetBuilding.distanceTo(villageCenter);
              const path = createPath(pathLength, 1.5);
              path.position.copy(villageCenter);
              path.lookAt(targetBuilding);
              path.rotation.x = 0;
              structures.add(path);
            }

            // Farm fields around village
            if (rng.next() < 0.8) {
              const farmAngle = rng.next() * Math.PI * 2;
              const farmRadius = plazaRadius * 1.3;
              const farm = createFarmField(3 + Math.floor(rng.next() * 2), 4 + Math.floor(rng.next() * 3));
              farm.position.set(
                worldX + Math.cos(farmAngle) * farmRadius,
                elevation,
                worldZ + Math.sin(farmAngle) * farmRadius
              );
              farm.rotation.y = farmAngle;
              structures.add(farm);
              poiPositions.push({ position: new THREE.Vector3(
                worldX + Math.cos(farmAngle) * farmRadius,
                elevation,
                worldZ + Math.sin(farmAngle) * farmRadius
              ), type: 'farm' });
            }

            // Decorative elements
            if (rng.next() < 0.7) {
              const cart = createCart();
              const cartAngle = rng.next() * Math.PI * 2;
              const cartRadius = plazaRadius * 0.7;
              cart.position.set(
                worldX + Math.cos(cartAngle) * cartRadius,
                elevation,
                worldZ + Math.sin(cartAngle) * cartRadius
              );
              cart.rotation.y = cartAngle;
              structures.add(cart);
            }

            // Hay bales near farm
            for (let i = 0; i < 2; i++) {
              if (rng.next() < 0.6) {
                const hay = createHayBale();
                const hayAngle = rng.next() * Math.PI * 2;
                const hayRadius = plazaRadius * (1.0 + rng.next() * 0.5);
                hay.position.set(
                  worldX + Math.cos(hayAngle) * hayRadius,
                  elevation,
                  worldZ + Math.sin(hayAngle) * hayRadius
                );
                structures.add(hay);
              }
            }

            // Tree stumps
            for (let i = 0; i < 2; i++) {
              if (rng.next() < 0.5) {
                const stump = createTreeStump();
                const stumpAngle = rng.next() * Math.PI * 2;
                const stumpRadius = plazaRadius * (0.8 + rng.next() * 0.4);
                stump.position.set(
                  worldX + Math.cos(stumpAngle) * stumpRadius,
                  elevation,
                  worldZ + Math.sin(stumpAngle) * stumpRadius
                );
                structures.add(stump);
              }
            }

            if (rng.next() < 0.7) {
              const tavern = createTavern();
              const tavernPos = new THREE.Vector3(worldX, elevation, worldZ);
              tavern.position.copy(tavernPos);
              structures.add(tavern);
              villageBuildings.push(tavernPos.clone());

              const tavernCollider = (tavern as any).collider;
              if (tavernCollider) {
                const worldBox = tavernCollider.box.clone();
                worldBox.translate(tavern.position);
                structureColliders.push({ box: worldBox, type: tavernCollider.type });
              }

              for (let i = 0; i < 3; i++) {
                const npcSpawn = new THREE.Vector3(
                  tavernPos.x + (rng.next() - 0.5) * 8,
                  elevation,
                  tavernPos.z + (rng.next() - 0.5) * 8
                );
                villageNpcSpawns.push(npcSpawn);
                npcSpawns.push(npcSpawn);
              }

              poiPositions.push({ position: tavernPos.clone(), type: 'tavern' });
            }

            for (let i = 0; i < 4; i++) {
              itemSpawns.push(new THREE.Vector3(
                villageCenter.x + (rng.next() - 0.5) * 12,
                elevation,
                villageCenter.z + (rng.next() - 0.5) * 12
              ));
            }

            villages.push({
              center: villageCenter,
              radius: plazaRadius,
              buildings: villageBuildings,
              npcSpawns: villageNpcSpawns,
            });

            poiPositions.push({ position: villageCenter.clone(), type: 'village' });
          }

          if (rng.next() < 0.01) {
            const temple = createTemple();
            const templePos = new THREE.Vector3(worldX, elevation, worldZ);
            temple.position.copy(templePos);
            structures.add(temple);

            const templeCollider = (temple as any).collider;
            if (templeCollider) {
              const worldBox = templeCollider.box.clone();
              worldBox.translate(temple.position);
              structureColliders.push({ box: worldBox, type: templeCollider.type });
            }

            for (let i = 0; i < 2; i++) {
              itemSpawns.push(new THREE.Vector3(
                templePos.x + (rng.next() - 0.5) * 10,
                elevation,
                templePos.z + (rng.next() - 0.5) * 10
              ));
            }

            poiPositions.push({ position: templePos.clone(), type: 'temple' });
          }

          if (rng.next() < 0.015) {
            const warehouse = createWarehouse();
            warehouse.position.set(worldX, elevation, worldZ);
            structures.add(warehouse);

            const warehouseCollider = (warehouse as any).collider;
            if (warehouseCollider) {
              const worldBox = warehouseCollider.box.clone();
              worldBox.translate(warehouse.position);
              structureColliders.push({ box: worldBox, type: warehouseCollider.type });
            }

            for (let i = 0; i < 3; i++) {
              itemSpawns.push(new THREE.Vector3(
                worldX + (rng.next() - 0.5) * 12,
                elevation,
                worldZ + (rng.next() - 0.5) * 12
              ));
            }

            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'warehouse' });
          }

          if (rng.next() < 0.008) {
            const library = createLibrary();
            library.position.set(worldX, elevation, worldZ);
            structures.add(library);

            const libraryCollider = (library as any).collider;
            if (libraryCollider) {
              const worldBox = libraryCollider.box.clone();
              worldBox.translate(library.position);
              structureColliders.push({ box: worldBox, type: libraryCollider.type });
            }

            itemSpawns.push(new THREE.Vector3(worldX, elevation + 1, worldZ));
            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'library' });
          }

          if (rng.next() < 0.015) {
            const windmill = createWindmill();
            windmill.position.set(worldX, elevation, worldZ);
            structures.add(windmill);

            const windmillCollider = (windmill as any).collider;
            if (windmillCollider) {
              const worldBox = windmillCollider.box.clone();
              worldBox.translate(windmill.position);
              structureColliders.push({ box: worldBox, type: windmillCollider.type });
            }
            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'windmill' });
          }

          if (rng.next() < 0.015) {
            const watchtower = createWatchtower();
            watchtower.position.set(worldX, elevation, worldZ);
            structures.add(watchtower);

            const watchtowerCollider = (watchtower as any).collider;
            if (watchtowerCollider) {
              const worldBox = watchtowerCollider.box.clone();
              worldBox.translate(watchtower.position);
              structureColliders.push({ box: worldBox, type: watchtowerCollider.type });
            }
            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'watchtower' });
          }

          if (rng.next() < 0.012) {
            const blacksmith = createBlacksmith();
            blacksmith.position.set(worldX, elevation, worldZ);
            structures.add(blacksmith);

            const blacksmithCollider = (blacksmith as any).collider;
            if (blacksmithCollider) {
              const worldBox = blacksmithCollider.box.clone();
              worldBox.translate(blacksmith.position);
              structureColliders.push({ box: worldBox, type: blacksmithCollider.type });
            }
            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'blacksmith' });
          }
          break;
        }
        case BiomeType.MOUNTAIN: {
          if (rng.next() < 0.015) {
            const castle = createCastle();
            const castlePos = new THREE.Vector3(worldX, elevation, worldZ);
            castle.position.copy(castlePos);
            structures.add(castle);

            const castleColliders = (castle as any).colliders;
            if (castleColliders && Array.isArray(castleColliders)) {
              for (const col of castleColliders) {
                const worldBox = col.box.clone();
                worldBox.translate(castle.position);
                structureColliders.push({ box: worldBox, type: col.type });
              }
            }

            // Spawn Royal Guard NPCs at gatehouse and courtyard
            const guardOffsets = [
              new THREE.Vector3(-4, 0, 12),
              new THREE.Vector3(4, 0, 12),
              new THREE.Vector3(0, 0, 5),
              new THREE.Vector3(6, 0, 4),
              new THREE.Vector3(0, 1, -6), // King on throne
            ];
            for (const offset of guardOffsets) {
              npcSpawns.push(castlePos.clone().add(offset));
            }

            for (let i = 0; i < 3; i++) {
              itemSpawns.push(new THREE.Vector3(
                castlePos.x + (rng.next() - 0.5) * 16,
                elevation + 0.5,
                castlePos.z + (rng.next() - 0.5) * 16
              ));
            }

            poiPositions.push({ position: castlePos.clone(), type: 'castle' });
          }

          if (rng.next() < 0.01) {
            const bunker = createBunker();
            bunker.position.set(worldX, elevation, worldZ);
            structures.add(bunker);

            const bunkerCollider = (bunker as any).collider;
            if (bunkerCollider) {
              const worldBox = bunkerCollider.box.clone();
              worldBox.translate(bunker.position);
              structureColliders.push({ box: worldBox, type: bunkerCollider.type });
            }

            for (let i = 0; i < 2; i++) {
              itemSpawns.push(new THREE.Vector3(
                worldX + (rng.next() - 0.5) * 8,
                elevation,
                worldZ + (rng.next() - 0.5) * 8
              ));
            }

            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'bunker' });
          }
          break;
        }
        case BiomeType.DESERT: {
          if (rng.next() < 0.03) {
            // Desert Oasis Village
            const oasisCenter = new THREE.Vector3(worldX, elevation, worldZ);
            const oasisBuildings: THREE.Vector3[] = [];
            const oasisNpcSpawns: THREE.Vector3[] = [];

            const well = createWell();
            well.position.copy(oasisCenter);
            structures.add(well);

            for (let i = 0; i < 4; i++) {
              const angle = (i / 4) * Math.PI * 2;
              const radius = 14;
              const housePos = new THREE.Vector3(
                worldX + Math.cos(angle) * radius,
                elevation,
                worldZ + Math.sin(angle) * radius
              );
              const house = createHouse({ variant: 'medium', wallColor: 0xE0C097, roofColor: 0x8D6E63, scale: 1.0 });
              house.position.copy(housePos);
              house.lookAt(oasisCenter);
              structures.add(house);
              oasisBuildings.push(housePos);

              const npcSpawn = housePos.clone().add(new THREE.Vector3(0, 0, 2));
              oasisNpcSpawns.push(npcSpawn);
              npcSpawns.push(npcSpawn);
            }

            const market = createMarketStall();
            market.position.set(worldX + 5, elevation, worldZ + 5);
            structures.add(market);

            villages.push({
              center: oasisCenter,
              radius: 18,
              buildings: oasisBuildings,
              npcSpawns: oasisNpcSpawns,
            });
            poiPositions.push({ position: oasisCenter.clone(), type: 'desert_oasis' });
          }

          if (rng.next() < 0.02) {
            const pyramid = createPyramid();
            const pyramidPos = new THREE.Vector3(worldX, elevation, worldZ);
            pyramid.position.copy(pyramidPos);
            structures.add(pyramid);

            const pyramidCollider = (pyramid as any).collider;
            if (pyramidCollider) {
              const worldBox = pyramidCollider.box.clone();
              worldBox.translate(pyramid.position);
              structureColliders.push({ box: worldBox, type: pyramidCollider.type });
            }

            for (let i = 0; i < 2; i++) {
              itemSpawns.push(new THREE.Vector3(
                pyramidPos.x + (rng.next() - 0.5) * 8,
                elevation,
                pyramidPos.z + (rng.next() - 0.5) * 8
              ));
            }

            poiPositions.push({ position: pyramidPos.clone(), type: 'pyramid' });
          }
          else if (rng.next() < 0.04) {
            const ruin = createRuin();
            ruin.position.set(worldX, elevation, worldZ);
            structures.add(ruin);

            const ruinCollider = (ruin as any).collider;
            if (ruinCollider) {
              const worldBox = ruinCollider.box.clone();
              worldBox.translate(ruin.position);
              structureColliders.push({ box: worldBox, type: ruinCollider.type });
            }

            for (let i = 0; i < 2; i++) {
              itemSpawns.push(new THREE.Vector3(
                worldX + (rng.next() - 0.5) * 8,
                elevation,
                worldZ + (rng.next() - 0.5) * 8
              ));
            }

            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'ruin' });
          }
          break;
        }
        case BiomeType.SNOW: {
          if (rng.next() < 0.04) {
            const ruin = createRuin();
            ruin.position.set(worldX, elevation, worldZ);
            structures.add(ruin);

            const ruinCollider = (ruin as any).collider;
            if (ruinCollider) {
              const worldBox = ruinCollider.box.clone();
              worldBox.translate(ruin.position);
              structureColliders.push({ box: worldBox, type: ruinCollider.type });
            }

            for (let i = 0; i < 2; i++) {
              itemSpawns.push(new THREE.Vector3(
                worldX + (rng.next() - 0.5) * 8,
                elevation,
                worldZ + (rng.next() - 0.5) * 8
              ));
            }

            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'ruin' });
          }

          if (rng.next() < 0.008) {
            const bunker = createBunker();
            bunker.position.set(worldX, elevation, worldZ);
            structures.add(bunker);

            const bunkerCollider = (bunker as any).collider;
            if (bunkerCollider) {
              const worldBox = bunkerCollider.box.clone();
              worldBox.translate(bunker.position);
              structureColliders.push({ box: worldBox, type: bunkerCollider.type });
            }

            for (let i = 0; i < 2; i++) {
              itemSpawns.push(new THREE.Vector3(
                worldX + (rng.next() - 0.5) * 8,
                elevation,
                worldZ + (rng.next() - 0.5) * 8
              ));
            }

            poiPositions.push({ position: new THREE.Vector3(worldX, elevation, worldZ), type: 'bunker' });
          }
          break;
        }
        case BiomeType.COAST: {
          if (elevation > 5 && rng.next() < 0.05) {
            const lighthouse = createLighthouse();
            const lighthousePos = new THREE.Vector3(worldX, elevation, worldZ);
            lighthouse.position.copy(lighthousePos);
            structures.add(lighthouse);

            const lighthouseCollider = (lighthouse as any).collider;
            if (lighthouseCollider) {
              const worldBox = lighthouseCollider.box.clone();
              worldBox.translate(lighthouse.position);
              structureColliders.push({ box: worldBox, type: lighthouseCollider.type });
            }

            itemSpawns.push(new THREE.Vector3(
              lighthousePos.x + (rng.next() - 0.5) * 5,
              elevation,
              lighthousePos.z + (rng.next() - 0.5) * 5
            ));

            poiPositions.push({ position: lighthousePos.clone(), type: 'lighthouse' });
          }
          break;
        }
      }

      if (rng.next() < 0.01) {
        itemSpawns.push(new THREE.Vector3(worldX, elevation + 0.5, worldZ));
      }

      const denseBiomes: BiomeType[] = [BiomeType.FOREST, BiomeType.DESERT, BiomeType.MOUNTAIN];
      if (denseBiomes.includes(biome)) {
        if (rng.next() < spawnConfig.densityPerChunk * 0.005) {
          const diff = calculateDifficultyForPosition(worldX, worldZ);
          monsterSpawns.push({
            position: new THREE.Vector3(worldX, elevation, worldZ),
            biome,
            difficulty: diff,
          });
        }
      } else if (rng.next() < 0.008) {
        const diff = calculateDifficultyForPosition(worldX, worldZ);
        monsterSpawns.push({
          position: new THREE.Vector3(worldX, elevation, worldZ),
          biome,
          difficulty: diff,
        });
      }
    }
  }

  structures.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.name === 'spotlightBeam') {
        child.castShadow = false;
        child.receiveShadow = false;
        child.matrixAutoUpdate = true;
      } else {
        child.castShadow = true;
        child.receiveShadow = true;
        child.matrixAutoUpdate = false;
        child.updateMatrix();
      }
    }
  });

  return { structures, structureColliders, npcSpawns, monsterSpawns, itemSpawns, villages, poiPositions };
}

function calculateDifficultyForPosition(worldX: number, worldZ: number): number {
  const distFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
  return calculateDifficultyMultiplier(distFromCenter);
}
