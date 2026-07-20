import * as THREE from 'three';
import { HeightMap } from './heightmap';
import { BiomeMap, BiomeType } from './biomeMap';
import { WORLD_SIZE, WORLD_SCALE } from '../config';

export const CHUNK_SIZE = 32; // cells per chunk
export const RENDER_RADIUS = 2; // active chunks radius around player

function biomeToColor(biome: BiomeType): THREE.Color {
  switch (biome) {
    case BiomeType.COAST: return new THREE.Color('#E8DCC4');
    case BiomeType.PLAINS: return new THREE.Color('#8BC34A');
    case BiomeType.FOREST: return new THREE.Color('#558B2F');
    case BiomeType.DESERT: return new THREE.Color('#E6D690');
    case BiomeType.MOUNTAIN: return new THREE.Color('#9E9E9E');
    case BiomeType.SNOW: return new THREE.Color('#FAFAFA');
    default: return new THREE.Color('#888888');
  }
}

interface TerrainChunk {
  mesh: THREE.Mesh;
  key: string;
  cx: number;
  cz: number;
}

export class ChunkManager {
  private activeChunks = new Map<string, TerrainChunk>();
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

    // Load active chunks around player (max 1 chunk creation per frame to avoid CPU spike)
    for (let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
      for (let dz = -RENDER_RADIUS; dz <= RENDER_RADIUS; dz++) {
        const cx = playerChunkX + dx;
        const cz = playerChunkZ + dz;

        // Check bounds
        const maxChunk = Math.floor(WORLD_SIZE / CHUNK_SIZE);
        if (cx < 0 || cz < 0 || cx >= maxChunk || cz >= maxChunk) continue;

        const key = `${cx}_${cz}`;
        visibleKeys.add(key);

        if (!this.activeChunks.has(key) && !createdThisFrame) {
          const chunkMesh = this.buildChunkMesh(cx, cz);
          this.activeChunks.set(key, { mesh: chunkMesh, key, cx, cz });
          this.scene.add(chunkMesh);
          createdThisFrame = true;
        }
      }
    }

    // Unload distant chunks out of render radius to free VRAM
    for (const [key, chunk] of this.activeChunks.entries()) {
      if (!visibleKeys.has(key)) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        this.activeChunks.delete(key);
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
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
  }
}
