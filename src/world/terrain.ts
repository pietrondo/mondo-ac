import * as THREE from 'three';
import { HeightMap } from './heightmap';
import { BiomeMap, BiomeType } from './biomeMap';
import { WORLD_SIZE, WORLD_SCALE } from '../config';

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

export function createTerrainMesh(
  heightMap: HeightMap,
  biomeMap: BiomeMap
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(
    WORLD_SIZE * WORLD_SCALE,
    WORLD_SIZE * WORLD_SCALE,
    WORLD_SIZE - 1,
    WORLD_SIZE - 1
  );
  geometry.rotateX(-Math.PI * 0.5);

  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    // Map world coords to heightmap coords
    const hx = (x / WORLD_SCALE) + WORLD_SIZE / 2;
    const hz = (z / WORLD_SCALE) + WORLD_SIZE / 2;

    const h = heightMap.getInterpolated(hx, hz);
    positions.setY(i, h);

    const biome = biomeMap.getBiome(hx, hz);
    const color = biomeToColor(biome);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    metalness: 0.1,
    roughness: 0.85,
    vertexColors: true,
    flatShading: true
  });

  return new THREE.Mesh(geometry, material);
}
