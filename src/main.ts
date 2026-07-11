import * as THREE from 'three';
import { createScene } from './render/scene';
import { HeightMap } from './world/heightmap';
import { BiomeMap } from './world/biomeMap';
import { createTerrainMesh } from './world/terrain';
import { createWater } from './world/water';
import { createDecorations } from './world/decorations';
import { placeFeatures } from './world/features';
import { InputManager } from './controls/input';
import { Player } from './entities/Player';
import { NPC } from './entities/NPC';
import { Monster } from './entities/Monster';
import { Collectible } from './entities/Collectible';
import { SEED } from './config';

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

const decorations = createDecorations(heightMap, biomeMap);
scene.add(decorations);

const features = placeFeatures(heightMap, biomeMap);
scene.add(features.structures);

// Input & Player
const input = new InputManager();
const player = new Player(camera, input);
scene.add(player.mesh);

// Position player at center
player.mesh.position.set(0, heightMap.getInterpolated(128, 128), 0);

// Spawn entities from features
const npcs: NPC[] = [];
for (const pos of features.npcSpawns.slice(0, 10)) {
  const npc = new NPC(pos);
  npcs.push(npc);
  scene.add(npc.mesh);
}

const monsters: Monster[] = [];
for (const pos of features.monsterSpawns.slice(0, 8)) {
  const monster = new Monster(pos);
  monsters.push(monster);
  scene.add(monster.mesh);
}

const collectibles: Collectible[] = [];
for (const pos of features.itemSpawns.slice(0, 15)) {
  const types: Array<'coin' | 'crystal' | 'potion'> = ['coin', 'coin', 'coin', 'crystal', 'potion'];
  const type = types[Math.floor(Math.random() * types.length)];
  const item = new Collectible(pos, type);
  collectibles.push(item);
  scene.add(item.mesh);
}

// Game loop
let lastTime = performance.now();
let gameTime = 0;

function animate(): void {
  const now = performance.now();
  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  gameTime += delta;

  // Update entities
  for (const npc of npcs) npc.update(delta, heightMap);
  for (const monster of monsters) monster.update(delta, heightMap, player.mesh.position);
  for (const item of collectibles) item.update(gameTime);

  // Check collectible pickup
  for (const item of collectibles) {
    if (item.isVisible() && player.mesh.position.distanceTo(item.mesh.position) < 2) {
      item.collect();
    }
  }

  player.update(delta, heightMap);
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

// Click to start
const clickToStart = document.createElement('div');
clickToStart.textContent = 'Clicca per iniziare';
clickToStart.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:24px;cursor:pointer;z-index:100;';
clickToStart.addEventListener('click', () => {
  document.body.requestPointerLock();
  clickToStart.remove();
});
document.body.appendChild(clickToStart);
