import * as THREE from 'three';
import { BiomeType } from './biomeMap';

export function biomeToColor(biome: BiomeType): THREE.Color {
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
