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
import { HUD } from './ui/hud';
import { DebugOverlay } from './ui/debug';
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

// HUD & Debug
const hud = new HUD();
const debug = new DebugOverlay(heightMap, biomeMap);

// F3 to toggle debug
window.addEventListener('keydown', (e) => {
  if (e.code === 'F3') {
    debug.toggle();
  }
});

// Position player at center
player.mesh.position.set(0, heightMap.getInterpolated(128, 128), 0);
player.setRespawnPoint(player.mesh.position.clone());

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

// HP Display
const hpDisplay = document.createElement('div');
hpDisplay.id = 'hp-display';
hpDisplay.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  color: #ff4444;
  font-family: system-ui, sans-serif;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  z-index: 100;
`;
hpDisplay.textContent = 'HP: 100';
document.body.appendChild(hpDisplay);

function updateHpDisplay(): void {
  hpDisplay.textContent = `HP: ${Math.max(0, player.hp)}`;
  if (player.hp <= 30) {
    hpDisplay.style.color = '#ff0000';
  } else if (player.hp <= 60) {
    hpDisplay.style.color = '#ffaa00';
  } else {
    hpDisplay.style.color = '#44ff44';
  }
}

// Game loop
let lastTime = performance.now();
let gameTime = 0;
let damageCooldown = 0;

function animate(): void {
  const now = performance.now();
  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  gameTime += delta;
  damageCooldown -= delta;

  // Update entities
  for (const npc of npcs) npc.update(delta, heightMap);
  for (const monster of monsters) {
    if (monster.isAlive()) {
      monster.update(delta, heightMap, player.mesh.position);
      // Check damage to player
      if (damageCooldown <= 0 && player.isAlive() && monster.mesh.position.distanceTo(player.mesh.position) < 2) {
        player.takeDamage(10);
        damageCooldown = 1; // 1 second between damage
        updateHpDisplay();
      }
    }
  }
  for (const item of collectibles) item.update(gameTime);

  // Check collectible pickup
  for (const item of collectibles) {
    if (item.isVisible() && player.mesh.position.distanceTo(item.mesh.position) < 2) {
      const value = item.collect();
      hud.addScore(value);
      // Potion heals
      if (value === 10) {
        player.hp = Math.min(player.maxHp, player.hp + 20);
        updateHpDisplay();
      }
    }
  }

  // Debug events
  document.addEventListener('debug-wireframe', ((e: CustomEvent) => {
    (terrain.material as THREE.MeshStandardMaterial).wireframe = e.detail;
  }) as EventListener);
  document.addEventListener('debug-camera-height', ((e: CustomEvent) => {
    (player as any).cameraHeight = e.detail;
  }) as EventListener);
  document.addEventListener('debug-player-speed', ((e: CustomEvent) => {
    (player as any).speed = e.detail;
  }) as EventListener);
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
clickToStart.textContent = 'Clicca per iniziare (WASD per muoverti, E per interagire)';
clickToStart.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:24px;cursor:pointer;z-index:100;';
clickToStart.addEventListener('click', () => {
  document.body.requestPointerLock();
  clickToStart.remove();
});
document.body.appendChild(clickToStart);
