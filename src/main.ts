import * as THREE from 'three';
import { createScene } from './render/scene';
import { HeightMap } from './world/heightmap';
import { BiomeMap } from './world/biomeMap';
import { createTerrainMesh } from './world/terrain';
import { createWater } from './world/water';
import { SEED, WORLD_SIZE, WORLD_SCALE } from './config';

const container = document.getElementById('canvas-container');
if (!container) throw new Error('No container');

const scene = createScene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Generate world
const heightMap = new HeightMap(SEED);
const biomeMap = new BiomeMap(heightMap, SEED + 1);
const terrain = createTerrainMesh(heightMap, biomeMap);
scene.add(terrain);

const water = createWater();
scene.add(water);

// Position camera at center of world
const centerH = heightMap.getInterpolated(WORLD_SIZE / 2, WORLD_SIZE / 2);
camera.position.set(
  WORLD_SIZE * WORLD_SCALE * 0.3,
  centerH + 50,
  WORLD_SIZE * WORLD_SCALE * 0.3
);
camera.lookAt(0, centerH, 0);

function animate(): void {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const loading = document.getElementById('loading');
if (loading) loading.style.display = 'none';
