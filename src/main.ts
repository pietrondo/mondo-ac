import * as THREE from 'three';
import { createScene } from './render/scene';
import { HeightMap } from './world/heightmap';
import { BiomeMap, BiomeType } from './world/biomeMap';
import { createTerrainMesh } from './world/terrain';
import { createWater } from './world/water';
import { createDecorations } from './world/decorations';
import { placeFeatures } from './world/features';
import { InputManager } from './controls/input';
import { Player } from './entities/Player';
import { NPC } from './entities/NPC';
import { Monster } from './entities/Monster';
import { Collectible } from './entities/Collectible';
import { PowerUp } from './entities/PowerUp';
import { AutomaticRifle } from './entities/AutomaticRifle';
import { WeaponView } from './entities/WeaponView';
import { applyRifleHitDamage } from './combat/rifleHit';
import { ShotTracer } from './combat/shotTracer';
import { EnemyProjectileSystem } from './combat/EnemyProjectile';
import { applyPowerUp, createPowerUpRuntime, tickPowerUpRuntime } from './game/powerUpEffects';
import { HUD } from './ui/hud';
import { DebugOverlay } from './ui/debug';
import { SEED, WORLD_SIZE, WORLD_SCALE } from './config';
import { selectMonsterSpawns } from './world/spawnSelection';
import { chooseMonsterVariant } from './world/monsterVariant';

const container = document.getElementById('canvas-container');
if (!container) throw new Error('No container');

// WebGL presence check
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

let isGameHalted = false;

function showSystemError(message: string): void {
  isGameHalted = true;
  try {
    document.exitPointerLock();
  } catch (e) {}

  const overlay = document.getElementById('error-overlay');
  const msgEl = document.getElementById('error-message');
  if (overlay) {
    overlay.style.display = 'flex';
  }
  if (msgEl) {
    msgEl.textContent = message;
  }
}

const reloadBtn = document.getElementById('error-reload-btn');
if (reloadBtn) {
  reloadBtn.addEventListener('click', () => {
    window.location.reload();
  });
}

// Global error boundaries
window.onerror = function (message, source, lineno, colno, _error) {
  showSystemError(`Unhandled exception: ${message} (at ${source}:${lineno}:${colno})`);
  return true;
};

window.onunhandledrejection = function (event) {
  showSystemError(`Unhandled promise rejection: ${event.reason}`);
};

if (!detectWebGL()) {
  showSystemError('WebGL non è supportato o è disabilitato nel tuo browser.');
}

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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through to UI
container.appendChild(renderer.domElement);

// Configure shadow camera layers
const sun = scene.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
if (sun) {
  sun.shadow.camera.layers.enable(1);
  scene.add(sun.target);
}

// Generate world
const heightMap = new HeightMap(SEED);
const biomeMap = new BiomeMap(heightMap, SEED + 1);
const terrain = createTerrainMesh(heightMap, biomeMap);
scene.add(terrain);

const water = createWater();
scene.add(water);

const decorations = createDecorations(heightMap, biomeMap);
scene.add(decorations.group);

const features = placeFeatures(heightMap, biomeMap);
scene.add(features.structures);

// Input & Player
const input = new InputManager();
const player = new Player(camera, input);
player.setColliders(features.structureColliders, decorations.colliders);
const weaponView = new WeaponView(camera);
const shotTracer = new ShotTracer(scene);
const powerUpRuntime = createPowerUpRuntime(player.speed, 25);
const rifle = new AutomaticRifle({
  onShot: (hit) => {
    applyRifleHitDamage(hit, powerUpRuntime.shotDamage);
    weaponView.fire();

    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    camera.getWorldPosition(origin);
    camera.getWorldDirection(direction);

    const end = hit
      ? hit.point.clone()
      : origin.clone().add(direction.multiplyScalar(120));

    shotTracer.spawn(origin, end);
  },
});
scene.add(player.mesh);

// HUD & Debug
const hud = new HUD();
hud.setWeaponState(rifle.magazineAmmo, rifle.reserveAmmo, rifle.isReloading);
const debug = new DebugOverlay(heightMap, biomeMap);

// F3 to toggle debug
window.addEventListener('keydown', (e) => {
  if (e.code === 'F3') {
    debug.toggle();
  }
});

// Find a good spawn point on plains or forest (green areas) with decent elevation
let bestSpawnHx = 128;
let bestSpawnHz = 128;
let bestSpawnH = heightMap.get(128, 128);

// Search for plains or forest first
let foundGoodBiome = false;
for (let dx = -40; dx <= 40; dx++) {
  for (let dz = -40; dz <= 40; dz++) {
    const hx = 128 + dx;
    const hz = 128 + dz;
    if (hx < 0 || hx >= WORLD_SIZE || hz < 0 || hz >= WORLD_SIZE) continue;
    const h = heightMap.get(hx, hz);
    const biome = biomeMap.getBiome(hx, hz);
    // Prefer plains or forest with good height (above water, below mountains)
    if ((biome === BiomeType.PLAINS || biome === BiomeType.FOREST) && h > 15 && h < 35) {
      bestSpawnHx = hx;
      bestSpawnHz = hz;
      bestSpawnH = h;
      foundGoodBiome = true;
      break;
    }
  }
  if (foundGoodBiome) break;
}

// Fallback: if no plains/forest found, find any non-water, non-snow spot
if (!foundGoodBiome) {
  for (let dx = -50; dx <= 50; dx += 2) {
    for (let dz = -50; dz <= 50; dz += 2) {
      const hx = 128 + dx;
      const hz = 128 + dz;
      if (hx < 0 || hx >= WORLD_SIZE || hz < 0 || hz >= WORLD_SIZE) continue;
      const h = heightMap.get(hx, hz);
      const biome = biomeMap.getBiome(hx, hz);
      if (biome !== BiomeType.SNOW && biome !== BiomeType.COAST && h > 12) {
        bestSpawnHx = hx;
        bestSpawnHz = hz;
        bestSpawnH = h;
        foundGoodBiome = true;
        break;
      }
    }
    if (foundGoodBiome) break;
  }
}

const spawnWorldX = (bestSpawnHx - WORLD_SIZE / 2) * WORLD_SCALE;
const spawnWorldZ = (bestSpawnHz - WORLD_SIZE / 2) * WORLD_SCALE;
player.mesh.position.set(spawnWorldX, bestSpawnH, spawnWorldZ);
player.setRespawnPoint(player.mesh.position.clone());

// Spawn entities from features
const npcs: NPC[] = [];
for (const pos of features.npcSpawns.slice(0, 10)) {
  const npc = new NPC(pos);
  npcs.push(npc);
  scene.add(npc.mesh);
}

const monsters: Monster[] = [];
const enemyProjectileSystem = new EnemyProjectileSystem(scene);
const monsterSpawns = selectMonsterSpawns(features.monsterSpawns, player.mesh.position, 8);
monsterSpawns.forEach((pos, index) => {
  const monsterPosition = pos.clone();
  const hx = (monsterPosition.x / WORLD_SCALE) + WORLD_SIZE / 2;
  const hz = (monsterPosition.z / WORLD_SCALE) + WORLD_SIZE / 2;
  monsterPosition.y = heightMap.getInterpolated(hx, hz);
  const monster = new Monster(monsterPosition, { variant: chooseMonsterVariant(monsterPosition, index) });
  monster.mesh.userData.damageable = monster;
  monster.setProjectileSystem(enemyProjectileSystem);
  monsters.push(monster);
  scene.add(monster.mesh);
});

const collectibles: Collectible[] = [];
for (const pos of features.itemSpawns.slice(0, 15)) {
  const types: Array<'coin' | 'crystal' | 'potion'> = ['coin', 'coin', 'coin', 'crystal', 'potion'];
  const type = types[Math.floor(Math.random() * types.length)];
  const item = new Collectible(pos, type);
  collectibles.push(item);
  scene.add(item.mesh);
}

const powerUps: PowerUp[] = [];
const powerUpKinds: Array<'health' | 'ammo' | 'adrenaline' | 'overclock'> = [
  'health',
  'ammo',
  'adrenaline',
  'overclock',
];
const powerUpSpawns = [...features.itemSpawns]
  .sort((a, b) => a.distanceToSquared(player.mesh.position) - b.distanceToSquared(player.mesh.position))
  .slice(0, 4);

for (let i = 0; i < powerUpSpawns.length; i++) {
  const pos = powerUpSpawns[i].clone();
  const powerUp = new PowerUp(pos, powerUpKinds[i % powerUpKinds.length]);
  powerUps.push(powerUp);
  scene.add(powerUp.mesh);
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

// Debug events (setup once)
document.addEventListener('debug-wireframe', ((e: CustomEvent) => {
  (terrain.material as THREE.MeshStandardMaterial).wireframe = e.detail;
}) as EventListener);
document.addEventListener('debug-camera-height', ((e: CustomEvent) => {
  (player as any).cameraHeight = e.detail;
}) as EventListener);
document.addEventListener('debug-player-speed', ((e: CustomEvent) => {
  (player as any).speed = e.detail;
}) as EventListener);

// Game loop
let lastTime = performance.now();
let gameTime = 0;
let damageCooldown = 0;

function animate(): void {
  if (isGameHalted) return;

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
  for (const powerUp of powerUps) powerUp.update(gameTime);

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

  for (const powerUp of powerUps) {
    if (powerUp.isVisible() && player.mesh.position.distanceTo(powerUp.mesh.position) < 2) {
      const kind = powerUp.collect();
      const feedback = applyPowerUp(kind, powerUpRuntime, player, rifle);
      hud.setStatus(feedback);
      if (feedback === 'Health restored') updateHpDisplay();
    }
  }

  tickPowerUpRuntime(delta, powerUpRuntime, player);

  // Update player
  player.update(delta, heightMap);

  rifle.update(delta, {
    fireHeld: input.state.attack,
    reloadPressed: input.state.reload,
    canFire: input.pointerLocked && player.isAlive(),
    camera,
    targets: monsters.filter((monster) => monster.isAlive()).map((monster) => monster.mesh),
  });
  weaponView.update(delta);
  shotTracer.update(delta);
  const projHit = enemyProjectileSystem.update(delta, heightMap, player.mesh.position, 0.5);
  if (projHit.hit) {
    player.takeDamage(projHit.damage);
  }
  hud.setWeaponState(rifle.magazineAmmo, rifle.reserveAmmo, rifle.isReloading);

  // Dynamically position and target the sun directional light following the player
  const sun = scene.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
  if (sun) {
    sun.position.set(player.mesh.position.x + 100, 200, player.mesh.position.z + 100);
    sun.target.position.copy(player.mesh.position);
    sun.target.updateMatrixWorld();
  }

  // Update water vertices (waves)
  const waterPos = water.geometry.attributes.position;
  for (let i = 0; i < waterPos.count; i++) {
    const x = waterPos.getX(i);
    const z = waterPos.getZ(i);
    const height = Math.sin(x * 0.05 + gameTime * 2.0) * 0.5 + Math.cos(z * 0.05 + gameTime * 1.5) * 0.5;
    waterPos.setY(i, height);
  }
  waterPos.needsUpdate = true;
  water.geometry.computeVertexNormals();

  // Render
  renderer.render(scene, camera);

  // Next frame
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

// Click to start overlay
const clickToStart = document.createElement('div');
clickToStart.textContent = 'Clicca per iniziare (WASD per muoverti, E per interagire)';
clickToStart.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:24px;cursor:pointer;z-index:9999;padding:20px;background:rgba(0,0,0,0.5);border-radius:10px;pointer-events:auto;';

function startGame(): void {
  try {
    document.body.requestPointerLock();
    renderer.domElement.style.pointerEvents = 'auto'; // Re-enable for gameplay
  } catch (e) {
    console.error('Pointer lock failed:', e);
  }
  clickToStart.remove();
}

clickToStart.addEventListener('click', startGame);
clickToStart.addEventListener('mousedown', (e) => e.stopPropagation());

// Fallback: clicking anywhere on the page starts the game
document.addEventListener('click', () => {
  if (document.body.contains(clickToStart)) {
    startGame();
  }
});

// Keyboard fallback: press Enter or Space to start
window.addEventListener('keydown', (e) => {
  if ((e.code === 'Enter' || e.code === 'Space') && document.body.contains(clickToStart)) {
    e.preventDefault();
    startGame();
  }
});

// Touch fallback for mobile devices
document.addEventListener('touchstart', () => {
  if (document.body.contains(clickToStart)) {
    startGame();
  }
});

document.body.appendChild(clickToStart);
