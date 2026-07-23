import * as THREE from 'three';
import { HeightMap } from './heightmap';
import { BiomeMap } from './biomeMap';
import { WORLD_SIZE, WORLD_SCALE } from '../config';
import { biomeToColor } from './biomeColor';
import { eventBus } from '../events/EventBus';

export const CHUNK_SIZE = 32;
export const RENDER_RADIUS = 2;

interface TerrainChunk {
  mesh: THREE.Mesh;
  key: string;
  cx: number;
  cz: number;
}

export class ChunkManager {
  private activeChunks = new Map<string, TerrainChunk>();
  private cachedChunks = new Map<string, TerrainChunk>();
  private terrainMaterial: THREE.MeshStandardMaterial;
  private heightMap: HeightMap;
  private biomeMap: BiomeMap;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, heightMap: HeightMap, biomeMap: BiomeMap) {
    this.scene = scene;
    this.heightMap = heightMap;
    this.biomeMap = biomeMap;

    this.terrainMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.1,
      roughness: 0.85,
      vertexColors: true,
      flatShading: true
    });
  }

  update(playerPosition: THREE.Vector3): void {
    // Map world position to grid chunk indices
    const gridX = Math.floor((playerPosition.x / WORLD_SCALE) + WORLD_SIZE / 2);
    const gridZ = Math.floor((playerPosition.z / WORLD_SCALE) + WORLD_SIZE / 2);

    const playerChunkX = Math.floor(gridX / CHUNK_SIZE);
    const playerChunkZ = Math.floor(gridZ / CHUNK_SIZE);

    const visibleKeys = new Set<string>();
    let createdThisFrame = false;

    // Load active chunks around player
    for (let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
      for (let dz = -RENDER_RADIUS; dz <= RENDER_RADIUS; dz++) {
        const cx = playerChunkX + dx;
        const cz = playerChunkZ + dz;

        const maxChunk = Math.floor(WORLD_SIZE / CHUNK_SIZE);
        if (cx < 0 || cz < 0 || cx >= maxChunk || cz >= maxChunk) continue;

        const key = `${cx}_${cz}`;
        visibleKeys.add(key);

        if (!this.activeChunks.has(key)) {
          const cached = this.cachedChunks.get(key);
          if (cached) {
            cached.mesh.visible = true;
            this.cachedChunks.delete(key);
            this.activeChunks.set(key, cached);
          } else if (!createdThisFrame) {
            const chunkMesh = this.buildChunkMesh(cx, cz);
            this.activeChunks.set(key, { mesh: chunkMesh, key, cx, cz });
            this.scene.add(chunkMesh);
            createdThisFrame = true;
            eventBus.emit('chunk.loaded', { cx, cz });
          }
        }
      }
    }

    // Hide distant chunks into cache to prevent frame hitches
    for (const [key, chunk] of this.activeChunks.entries()) {
      if (!visibleKeys.has(key)) {
        chunk.mesh.visible = false;
        this.cachedChunks.set(key, chunk);
        this.activeChunks.delete(key);
        eventBus.emit('chunk.unloaded', { cx: chunk.cx, cz: chunk.cz });
      }
    }

    // Prune cache if exceeds 36 chunks
    if (this.cachedChunks.size > 36) {
      const keysToPrune = Array.from(this.cachedChunks.keys()).slice(0, this.cachedChunks.size - 36);
      for (const k of keysToPrune) {
        const chunk = this.cachedChunks.get(k);
        if (chunk) {
          this.scene.remove(chunk.mesh);
          chunk.mesh.geometry.dispose();
          this.cachedChunks.delete(k);
        }
      }
    }
  }

  private buildChunkMesh(cx: number, cz: number): THREE.Mesh {
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;
    const width = CHUNK_SIZE * WORLD_SCALE;
    const height = CHUNK_SIZE * WORLD_SCALE;

    const geometry = new THREE.PlaneGeometry(width, height, CHUNK_SIZE, CHUNK_SIZE);
    geometry.rotateX(-Math.PI * 0.5);

    const positions = geometry.getAttribute('position');
    const colors = new Float32Array(positions.count * 3);

    const worldOffsetCenterX = (startX + CHUNK_SIZE / 2 - WORLD_SIZE / 2) * WORLD_SCALE;
    const worldOffsetCenterZ = (startZ + CHUNK_SIZE / 2 - WORLD_SIZE / 2) * WORLD_SCALE;

    for (let i = 0; i < positions.count; i++) {
      const localX = positions.getX(i);
      const localZ = positions.getZ(i);

      const worldX = worldOffsetCenterX + localX;
      const worldZ = worldOffsetCenterZ + localZ;

      const hx = (worldX / WORLD_SCALE) + WORLD_SIZE / 2;
      const hz = (worldZ / WORLD_SCALE) + WORLD_SIZE / 2;

      const h = this.heightMap.getInterpolated(hx, hz);
      positions.setY(i, h);

      const biome = this.biomeMap.getBiome(hx, hz);
      const color = biomeToColor(biome);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.terrainMaterial);
    mesh.position.set(worldOffsetCenterX, 0, worldOffsetCenterZ);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
  }
}
