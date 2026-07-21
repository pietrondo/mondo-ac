import * as THREE from 'three';
import { createScene } from './render/scene';
import { HeightMap } from './world/heightmap';
import { BiomeMap, BiomeType } from './world/biomeMap';
import { createWater, updateWater } from './world/water';
import { createDecorations } from './world/decorations';
import { placeFeatures, VillageData } from './world/features';
import { InputManager } from './controls/input';
import { Player } from './entities/Player';
import { NPC } from './entities/NPC';
import { Monster } from './entities/Monster';
import { Collectible } from './entities/Collectible';
import { PowerUp } from './entities/PowerUp';
import { Weapon } from './entities/Weapon';
import { WeaponView } from './entities/WeaponView';
import { applyRifleHitDamage } from './combat/rifleHit';
import { DamageNumber } from './combat/DamageNumber';
import { HitMarker } from './combat/HitMarker';
import { Vehicle } from './entities/Vehicle';
import { Hovercar } from './entities/Hovercar';
import { Spaceship } from './entities/Spaceship';
import { Horse } from './entities/Horse';
import { ShotTracer } from './combat/shotTracer';
import { EnemyProjectileSystem } from './combat/EnemyProjectile';
import { applyPowerUp, createPowerUpRuntime, tickPowerUpRuntime } from './game/powerUpEffects';
import { HUD } from './ui/hud';
import { PerformanceProfiler } from './ui/profiler';
import { DebugOverlay } from './ui/debug';
import { SEED, WORLD_SIZE, WORLD_SCALE } from './config';
import { selectMonsterSpawnPoints } from './world/spawnSelection';
import { chooseMonsterVariant } from './world/monsterVariant';
import { SoundManager } from './utils/sound';
import { ParticlePool } from './combat/particles';
import { CloudManager } from './world/clouds';
import { WaveManager } from './game/waveManager';
import { DayNightManager } from './world/dayNight';
import { SkillSystem } from './game/skills';
import { MultiplayerManager } from './net/multiplayer';
import { ZoneManager } from './world/zones';
import { ChunkManager } from './world/chunkManager';
import { generateDungeon, DungeonResult } from './world/dungeonGenerator';
import { BossMonster } from './entities/BossMonster';
import { DialogueManager } from './dialogue/DialogueManager';
import { DialogueUI } from './dialogue/DialogueUI';
import { QuestManager } from './quest/questManager';

async function setLoadingProgress(percent: number, message: string): Promise<void> {
  const fill = document.getElementById('loading-bar-fill');
  const status = document.getElementById('loading-status');
  if (fill) fill.style.width = `${percent}%`;
  if (status) status.textContent = `${message} (${percent}%)`;
  await new Promise((resolve) => setTimeout(resolve, 40));
}

const container = document.getElementById('canvas-container');
if (!container) throw new Error('No container');

// Unregister any active Service Workers and clear Cache Storage to force fresh loads
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
}
if ('caches' in window) {
  caches.keys().then((names) => {
    for (const name of names) {
      caches.delete(name);
    }
  }).catch(() => {});
}

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

let scene: THREE.Scene;
let dayNight: DayNightManager;
let camera: THREE.PerspectiveCamera;
let soundManager: SoundManager;
let renderer: THREE.WebGLRenderer | undefined;
let heightMap: HeightMap;
let biomeMap: BiomeMap;
let water: THREE.Mesh;
let input: InputManager;
let player: Player;
let weaponView: WeaponView;
let shotTracer: ShotTracer;
let particlePool: ParticlePool;
let cloudManager: CloudManager;
let damageNumber: DamageNumber;
let hitMarker: HitMarker;
let powerUpRuntime: any;
let weapons: Weapon[];
let activeWeaponIndex = 0;
let hud: HUD;
let debug: DebugOverlay;
let lastTime = 0;
let updateHpDisplay: () => void = () => {};
let multiplayer: MultiplayerManager;
let zoneManager: ZoneManager;
let chunkManager: ChunkManager;
let dialogueManager: DialogueManager;
let dialogueUI: DialogueUI;

async function initGame(): Promise<void> {
  await setLoadingProgress(15, 'Inizializzazione motore 3D e WebGL...');

  scene = createScene();
  dayNight = new DayNightManager(scene);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );

  soundManager = new SoundManager(camera);

  if (!isGameHalted && container) {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    updateRendererSize();
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through to UI
    container.appendChild(renderer.domElement);
    renderer.compile(scene, camera); // Prewarm and compile all materials/shaders on GPU
  }

  const profiler = new PerformanceProfiler();

  // Configure shadow camera layers
  const sun = scene.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
  if (sun) {
    sun.shadow.camera.layers.enable(1);
    scene.add(sun.target);
  }

  await setLoadingProgress(40, 'Generazione mappa d\'altezza e streaming chunk VRAM...');
  heightMap = new HeightMap(SEED);
  biomeMap = new BiomeMap(heightMap, SEED + 1);
  chunkManager = new ChunkManager(scene, heightMap, biomeMap);

  water = createWater();
  water.matrixAutoUpdate = false;
  water.updateMatrix();
  scene.add(water);

  await setLoadingProgress(65, 'Costruzione villaggi e strutture...');
  const decorations = createDecorations(heightMap, biomeMap);
  decorations.group.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
      child.matrixAutoUpdate = false;
      child.updateMatrix();
    }
  });
  scene.add(decorations.group);

  const features = placeFeatures(heightMap, biomeMap);
  scene.add(features.structures);

  const lighthouses: THREE.Group[] = [];
  const houses: THREE.Group[] = [];
  features.structures.traverse((child) => {
    if (child.name === 'lighthouse') {
      lighthouses.push(child as THREE.Group);
    } else if (child.name === 'house') {
      houses.push(child as THREE.Group);
    }
  });

  // Input & Player
  input = new InputManager();
  player = new Player(camera, input);
  player.setColliders(features.structureColliders, decorations.colliders);
  weaponView = new WeaponView(camera);
  shotTracer = new ShotTracer(scene);
  particlePool = new ParticlePool(scene);
  particlePool.prewarm();
  cloudManager = new CloudManager(scene);
  damageNumber = new DamageNumber();
  hitMarker = new HitMarker();
  powerUpRuntime = createPowerUpRuntime(player.speed, 25);
  // Initialize weapons list (rifle, shotgun, flamethrower, melee knife)
  weapons = [
    new Weapon('rifle', {
      onShot: (hit) => handleWeaponShot(hit),
      onReload: () => soundManager.playReload(),
    }),
    new Weapon('shotgun', {
      onShot: (hit) => handleWeaponShot(hit),
      onReload: () => soundManager.playReload(),
    }),
    new Weapon('flamethrower', {
      onShot: (hit) => handleWeaponShot(hit),
      onReload: () => soundManager.playReload(),
    }),
    new Weapon('melee', {
      onShot: (hit) => handleWeaponShot(hit),
    }),
  ];
function openShopFromNPC(): void {
  try { document.exitPointerLock(); } catch (_) {}
  hud.openShopMenu((item) => {
    if (item === 'health') {
      player.hp = Math.min(player.maxHp, player.hp + 50);
      updateHpDisplay();
      return true;
    } else if (item === 'ammo') {
      const w = weapons[activeWeaponIndex];
      w.reserveAmmo = w.maxReserveAmmo;
      hud.setWeaponState(w.magazineAmmo, w.reserveAmmo, w.isReloading, w.name);
      return true;
    } else if (item === 'shield') {
      (player as any).hp = Math.min(player.maxHp + 25, player.hp + 25);
      updateHpDisplay();
      return true;
    } else if (item === 'damage') {
      powerUpRuntime.shotDamage = Math.round(powerUpRuntime.shotDamage * 1.25);
      return true;
    } else if (item === 'grenadelauncher' || item === 'plasma' || item === 'sniper' || item === 'sword' || item === 'spear' || item === 'bow' || item === 'staff' || item === 'rock') {
      const existing = weapons.find(w => w.type === item);
      if (existing) {
        existing.reserveAmmo = existing.maxReserveAmmo;
      } else {
        weapons.push(new Weapon(item, {
          onShot: (hit) => handleWeaponShot(hit),
          onReload: () => soundManager.playReload(),
        }));
      }
      hud.showWaveBanner('⚔️ ARMA ACQUISTATA!', `Hai ottenuto: ${item.toUpperCase()}`);
      return true;
    }
    return false;
  });
}

function findDamageableAncestor(object?: THREE.Object3D): any {
  let current: THREE.Object3D | null | undefined = object;
  while (current) {
    const damageable = current.userData.damageable;
    if (damageable) return damageable;
    current = current.parent;
  }
  return undefined;
}

let lastShotTime = 0;
const handleWeaponShot = (hit: THREE.Intersection<THREE.Object3D> | undefined) => {
  const activeWeapon = weapons[activeWeaponIndex];
  const damageDealt = applyRifleHitDamage(
    hit,
    activeWeapon.type === 'melee'
      ? activeWeapon.damage
      : activeWeapon.type === 'shotgun'
      ? activeWeapon.damage
      : powerUpRuntime.shotDamage
  );

  // Check if hit was on a remote player (PvP)
  if (hit && multiplayer) {
    let remoteId = hit.object.userData?.remotePlayerId || hit.object.parent?.userData?.remotePlayerId;
    if (remoteId) {
      multiplayer.sendHitPlayer(remoteId, damageDealt);
    }
  }

  const now = performance.now();
  if (now - lastShotTime > 50) {
    lastShotTime = now;
    weaponView.fire(particlePool);
    if (activeWeapon.type === 'melee') {
      soundManager.playMelee();
    } else {
      soundManager.playShot();
      player.shakeIntensity = Math.max(player.shakeIntensity, activeWeapon.type === 'shotgun' ? 0.8 : activeWeapon.type === 'flamethrower' ? 0.15 : 0.4);
    }
  }

  // Flamethrower continuous flame particle stream
  if (activeWeapon.type === 'flamethrower') {
    const camPos = camera.getWorldPosition(new THREE.Vector3());
    const camDir = camera.getWorldDirection(new THREE.Vector3());
    for (let f = 0; f < 3; f++) {
      const dist = 1 + Math.random() * 12;
      const spread = (Math.random() - 0.5) * 0.8;
      const fPos = camPos.clone().addScaledVector(camDir, dist).add(new THREE.Vector3(spread, spread, spread));
      const fVel = camDir.clone().multiplyScalar(14 + Math.random() * 6);
      particlePool.spawn('spark', fPos, fVel, 0.4);
    }
  }

  // Spawn impact particles (blood for monsters, sparks for environments)
  if (hit) {
    const isMonster = !!findDamageableAncestor(hit.object);
    const type = isMonster ? 'blood' : 'spark';
    const count = isMonster ? 8 : 12;
    for (let i = 0; i < count; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4 + (type === 'blood' ? 2 : 3),
        (Math.random() - 0.5) * 4
      );
      particlePool.spawn(type, hit.point, velocity, 0.4 + Math.random() * 0.4);
    }

    // Combat juice: mostra damage number e hit marker quando colpisci un nemico
    if (isMonster && damageDealt > 0) {
      // Calcola posizione sopra il punto di impatto
      const damagePos = hit.point.clone().add(new THREE.Vector3(0, 1.5, 0));

      // Determina se è un colpo critico (danno > 50) o pesante (danno > 35)
      const isCritical = damageDealt >= 50;
      const isHeavy = damageDealt >= 35;

      // Mostra il numero di danno
      damageNumber.show(damageDealt, damagePos, isCritical, isHeavy);

      // Attiva l'hit marker
      hitMarker.trigger(true);

      // Aumenta lo screen shake quando colpisci (aggiungi 0.2 al shake esistente)
      const baseShake = activeWeapon.type === 'shotgun' ? 0.8 : 0.4;
      player.shakeIntensity = Math.max(player.shakeIntensity, baseShake + 0.2);
    }
  }

  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  camera.getWorldPosition(origin);
  camera.getWorldDirection(direction);

  const end = hit
    ? hit.point.clone()
    : origin.clone().add(direction.multiplyScalar(activeWeapon.range));

  shotTracer.spawn(origin, end);
};
scene.add(player.mesh);
scene.add(camera);

// HUD & Debug
hud = new HUD();

dialogueManager = new DialogueManager();
dialogueManager.onReward = (reward) => {
  if (reward.coins) {
    hud.addCoins(reward.coins);
  }
  if (reward.health) {
    player.hp = Math.min(player.maxHp, player.hp + reward.health);
    updateHpDisplay();
  }
  if (reward.ammo) {
    const w = weapons[activeWeaponIndex];
    if (w) {
      w.reserveAmmo = w.maxReserveAmmo;
      hud.setWeaponState(w.magazineAmmo, w.reserveAmmo, w.isReloading, w.name);
    }
  }
};
dialogueManager.onLoreUnlocked = (lore) => {
  hud.showLoreNotification(lore.title, lore.category);
};
dialogueManager.onAction = (action) => {
  if (action === 'open_shop') {
    openShopFromNPC();
  }
};

dialogueUI = new DialogueUI(
  dialogueManager,
  () => hud.getCoins(),
  () => {
    npcs.forEach((n) => n.resumeWandering());
  }
);

const questManager = new QuestManager();
questManager.setHUD(hud);
questManager.setOnWeaponReward((type) => {
  const existing = weapons.find(w => w.type === type);
  if (existing) {
    existing.reserveAmmo = existing.maxReserveAmmo;
  } else {
    weapons.push(new Weapon(type, {
      onShot: (hit) => handleWeaponShot(hit),
      onReload: () => soundManager.playReload(),
    }));
  }
  hud.showWaveBanner('🎁 RICOMPENSA QUEST!', `Nuova Arma Sbloccata: ${type.toUpperCase()}`);
});

const initialWeapon = weapons[activeWeaponIndex];
hud.setWeaponState(initialWeapon.magazineAmmo, initialWeapon.reserveAmmo, initialWeapon.isReloading, initialWeapon.name);
debug = new DebugOverlay(heightMap, biomeMap);
multiplayer = new MultiplayerManager(scene, camera);
multiplayer.onDamageReceived = (damage, attackerName) => {
  player.takeDamage(damage);
  updateHpDisplay();
  hud.showWaveBanner('⚔️ COLPITO DA ' + attackerName.toUpperCase(), `Hai subito -${damage} HP!`);
};
zoneManager = new ZoneManager();

// F3 to toggle debug
window.addEventListener('keydown', (e) => {
  if (e.code === 'F3') {
    debug.toggle();
  }
});

// Function to find a unique random land spawn point each time
function findRandomSpawnPoint(): THREE.Vector3 {
  for (let attempt = 0; attempt < 100; attempt++) {
    const hx = Math.floor(20 + Math.random() * (WORLD_SIZE - 40));
    const hz = Math.floor(20 + Math.random() * (WORLD_SIZE - 40));
    const h = heightMap.get(hx, hz);
    const biome = biomeMap.getBiome(hx, hz);
    if (biome !== BiomeType.COAST && h > 14) {
      const worldX = (hx - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldZ = (hz - WORLD_SIZE / 2) * WORLD_SCALE;
      const worldY = heightMap.getInterpolated(hx, hz);
      return new THREE.Vector3(worldX, worldY, worldZ);
    }
  }
  return new THREE.Vector3(0, heightMap.getInterpolated(WORLD_SIZE / 2, WORLD_SIZE / 2), 0);
}

const initialSpawn = findRandomSpawnPoint();
player.mesh.position.copy(initialSpawn);
player.setRespawnPoint(initialSpawn);

await setLoadingProgress(80, 'Creazione entità, nemici e veicoli...');
// Spawn vehicles near player spawn
const hcX = initialSpawn.x + 10;
const hcZ = initialSpawn.z;
const hcY = heightMap.getInterpolated((hcX / WORLD_SCALE) + WORLD_SIZE / 2, (hcZ / WORLD_SCALE) + WORLD_SIZE / 2);

const ssX = initialSpawn.x - 10;
const ssZ = initialSpawn.z;
const ssY = heightMap.getInterpolated((ssX / WORLD_SCALE) + WORLD_SIZE / 2, (ssZ / WORLD_SCALE) + WORLD_SIZE / 2) + 2.0;

const horseX = initialSpawn.x + 5;
const horseZ = initialSpawn.z + 5;
const horseY = heightMap.getInterpolated((horseX / WORLD_SCALE) + WORLD_SIZE / 2, (horseZ / WORLD_SCALE) + WORLD_SIZE / 2);

const vehicles: Vehicle[] = [
  new Hovercar(new THREE.Vector3(hcX, hcY, hcZ)),
  new Spaceship(new THREE.Vector3(ssX, ssY, ssZ)),
  new Horse(new THREE.Vector3(horseX, horseY, horseZ)),
];
for (const vData of features.villages.slice(0, 4)) {
  vehicles.push(new Horse(vData.center.clone().add(new THREE.Vector3(4, 0, 4))));
}
vehicles.forEach((v) => {
  scene.add(v.mesh);
});

// Spawn entities from features
const npcPresets = [
  { name: 'Anziano Eldrin', role: 'Saggio del Villaggio', dialogueTreeId: 'elder_eldrin' },
  { name: 'Mercante Garrick', role: 'Mercante d\'Armi', dialogueTreeId: 'merchant_garrick' },
  { name: 'Guardia Varus', role: 'Protettore delle Mura', dialogueTreeId: 'guard_varus' },
  { name: 'Viaggiatore Kael', role: 'Esploratore delle Rovine', dialogueTreeId: 'traveler_kael' },
  { name: 'Fabbro Thorin', role: 'Mastro Armaiolo', dialogueTreeId: 'blacksmith_thorin' },
  { name: 'Alchimista Lyra', role: 'Speziale delle Pozioni', dialogueTreeId: 'alchemist_lyra' },
  { name: 'Capitano Roderick', role: 'Comandante del Forte', dialogueTreeId: 'guard_varus' },
  { name: 'Oste Barnaby', role: 'Gestore della Taverna', dialogueTreeId: 'merchant_garrick' },
  { name: 'Cartografo Varis', role: 'Mappatore del Mondo', dialogueTreeId: 'traveler_kael' },
  { name: 'Saggia Selena', role: 'Custode della Biblioteca', dialogueTreeId: 'elder_eldrin' }
];

const npcs: NPC[] = [];
let npcPresetIdx = 0;
for (const pos of features.npcSpawns.slice(0, 30)) {
  // Find closest village for this NPC
  let closestVillage: VillageData | null = null;
  let minDist = Infinity;
  
  for (const village of features.villages) {
    const dist = pos.distanceTo(village.center);
    if (dist < minDist && dist < village.radius * 1.5) {
      minDist = dist;
      closestVillage = village;
    }
  }
  
  const villageContext = closestVillage ? {
    center: closestVillage.center,
    radius: closestVillage.radius,
    buildings: closestVillage.buildings
  } : undefined;
  
  const preset = npcPresets[npcPresetIdx % npcPresets.length];
  const npc = new NPC(pos, villageContext, preset);
  npcs.push(npc);
  scene.add(npc.mesh);
  npcPresetIdx++;
}

// Dedicated Spawn Sanctuary Lore Guide NPC
const spawnNpcPos = new THREE.Vector3(initialSpawn.x, initialSpawn.y, initialSpawn.z - 4.5);
const hxSpawn = (spawnNpcPos.x / WORLD_SCALE) + WORLD_SIZE / 2;
const hzSpawn = (spawnNpcPos.z / WORLD_SCALE) + WORLD_SIZE / 2;
spawnNpcPos.y = heightMap.getInterpolated(hxSpawn, hzSpawn);

const spawnGuideNpc = new NPC(spawnNpcPos, undefined, {
  name: 'Anziano Eldrin',
  role: 'Guida del Santuario',
  dialogueTreeId: 'elder_eldrin',
  isStationary: true
});
spawnGuideNpc.mesh.lookAt(initialSpawn.x, spawnNpcPos.y + 1, initialSpawn.z);
npcs.push(spawnGuideNpc);
scene.add(spawnGuideNpc.mesh);

const monsters: Monster[] = [];
const enemyProjectileSystem = new EnemyProjectileSystem(scene);

function spawnMonsterAtPosition(pos: THREE.Vector3, index: number, difficulty = 1.0): Monster {
  const monsterPosition = pos.clone();
  const hx = (monsterPosition.x / WORLD_SCALE) + WORLD_SIZE / 2;
  const hz = (monsterPosition.z / WORLD_SCALE) + WORLD_SIZE / 2;
  monsterPosition.y = heightMap.getInterpolated(hx, hz);

  const monster = new Monster(monsterPosition, {
    variant: chooseMonsterVariant(monsterPosition, index, biomeMap),
    onAttack: () => {
      soundManager.playPositionalAttack(monster.mesh);
    },
    onDeath: () => {
      let scoreValue = 20;
      if (monster.variant === 'titan') scoreValue = 250;
      else if (monster.variant === 'annihilator') scoreValue = 180;
      else if (monster.variant === 'golem') scoreValue = 100;
      else if (monster.variant === 'sentinel') scoreValue = 70;
      else if (monster.variant === 'brute') scoreValue = 50;
      else if (monster.variant === 'phantom') scoreValue = 40;
      else if (monster.variant === 'stalker') scoreValue = 30;
      else if (monster.variant === 'drone') scoreValue = 25;
      else if (monster.variant === 'crawler') scoreValue = 20;

      // Drop Powerup Collectible on enemy death
      const dropTypes: Array<'potion' | 'ammo' | 'coin' | 'crystal'> = ['potion', 'ammo', 'coin', 'coin', 'crystal'];
      const dropType = dropTypes[Math.floor(Math.random() * dropTypes.length)];
      const dropItem = new Collectible(monster.mesh.position.clone(), dropType);
      collectibles.push(dropItem);
      scene.add(dropItem.mesh);

      // Drop Boss Chest on boss death
      if (monster.variant === 'titan' || monster.variant === 'golem' || monster.variant === 'annihilator') {
        const chest = new Collectible(monster.mesh.position.clone(), 'boss_chest');
        collectibles.push(chest);
        scene.add(chest.mesh);
      }

      const scaledScore = Math.floor(scoreValue * difficulty);
      hud.addScore(scaledScore);
      hud.incrementCombo();
      hud.incrementKills();
      hud.triggerEnemyDeathAlert();
      waveManager.notifyEnemyKilled();
      questManager.notifyMonsterKilled();
      if (monster.variant === 'titan' || monster.variant === 'annihilator' || monster.variant === 'golem') {
        questManager.notifyBossKilled();
      }
    },
    onFootstep: (p: THREE.Vector3) => {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.0;
        const vel = new THREE.Vector3(
          Math.cos(angle) * speed,
          0.5 + Math.random() * 0.8,
          Math.sin(angle) * speed
        );
        particlePool.spawn('dust', p.clone(), vel, 0.6 + Math.random() * 0.4);
      }
    }
  });

  monster.mesh.userData.damageable = monster;
  monster.setProjectileSystem(enemyProjectileSystem);
  monsters.push(monster);
  scene.add(monster.mesh);

  return monster;
}

// Initial zone population around player spawn (70m to 160m)
const initialMonsterSpawns = selectMonsterSpawnPoints(features.monsterSpawns, player.mesh.position, 14, 160, 50);
initialMonsterSpawns.forEach((sp, idx) => {
  if (sp.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 70) {
    spawnMonsterAtPosition(sp.position, idx, sp.difficulty);
  }
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
const powerUpKinds: Array<'health' | 'ammo' | 'adrenaline' | 'overclock' | 'shield'> = [
  'health',
  'ammo',
  'adrenaline',
  'overclock',
  'shield',
];
const powerUpSpawns = [...features.itemSpawns]
  .sort((a, b) => a.distanceToSquared(player.mesh.position) - b.distanceToSquared(player.mesh.position))
  .slice(0, 5);

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

updateHpDisplay = (): void => {
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
document.addEventListener('debug-wireframe', (() => {
  // Wireframe debug handled dynamically per active chunk
}) as EventListener);
document.addEventListener('debug-camera-height', ((e: CustomEvent) => {
  (player as any).cameraHeight = e.detail;
}) as EventListener);
document.addEventListener('debug-player-speed', ((e: CustomEvent) => {
  (player as any).speed = e.detail;
}) as EventListener);

const skillSystem = new SkillSystem(scene);

await setLoadingProgress(95, 'Pre-compilazione shader WebGL e VRAM...');
// Precompile all shaders and upload textures to GPU VRAM to prevent initial stuttering
if (renderer) {
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
}
await new Promise((resolve) => setTimeout(resolve, 60));

await setLoadingProgress(100, 'Mondo caricato!');
const loadingOverlay = document.getElementById('loading-overlay');
if (loadingOverlay) loadingOverlay.style.display = 'none';

// Dungeon system state
let isInDungeon = false;
let activeDungeon: DungeonResult | null = null;
let dungeonBoss: BossMonster | null = null;
let dungeonMonsters: Monster[] = [];
const surfacePosBeforeDungeon = new THREE.Vector3();
let savedOverworldFog: THREE.Fog | THREE.FogExp2 | null = null;

// Game loop
lastTime = performance.now();
let gameTime = 0;
let damageCooldown = 0;
let wasAlive = true;
let interactWasPressed = false;
let survivalTime = 0;

const waveManager = new WaveManager();

waveManager.onWaveStart((config) => {
  hud.showWaveBanner(
    `ONDATA ${config.waveNumber}`,
    config.hasBoss ? '⚠️ ONDATA BOSS IN ARRIVO!' : `Preparati: ${config.totalEnemies} Mostri!`
  );
});

waveManager.onWaveClear((waveNum, bonusScore) => {
  hud.addScore(bonusScore);
  soundManager.playCollect();
  hud.showWaveBanner(
    `ONDATA ${waveNum} COMPLETATA!`,
    `Bonus +${bonusScore} Punti! Prossima ondata in 6s...`
  );
  player.hp = Math.min(player.maxHp, player.hp + 25);
  updateHpDisplay();
});

function animate(): void {
  if (isGameHalted || !renderer) return;

  const now = performance.now();
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  gameTime += delta;
  damageCooldown -= delta;

  // Update Day/Night & Environment
  dayNight.update(delta);
  hud.updateEnvironmentUI(dayNight.getFormattedTime(), dayNight.getWeatherIcon());

  // Spawn rain/storm particles
  if (dayNight.weather === 'rain' || dayNight.weather === 'storm') {
    const rainRate = dayNight.weather === 'storm' ? 80 : 40;
    const count = Math.floor(delta * rainRate) + (Math.random() < (delta * rainRate) % 1 ? 1 : 0);
    const pPos = player.mesh.position;
    for (let r = 0; r < count; r++) {
      const rx = (Math.random() - 0.5) * 50;
      const rz = (Math.random() - 0.5) * 50;
      const ry = 15 + Math.random() * 15;
      const pos = pPos.clone().add(new THREE.Vector3(rx, ry, rz));
      const vel = new THREE.Vector3((Math.random() - 0.5) * 0.5, -16 - Math.random() * 6, (Math.random() - 0.5) * 0.5);
      particlePool.spawn('spark', pos, vel, 0.8);
    }
  }

  // Active Skills Update
  skillSystem.update(delta, input, player, camera, monsters, particlePool, damageNumber, hitMarker, soundManager, hud, heightMap);

  // Update Multiplayer state
  if (multiplayer) {
    multiplayer.update(delta, player.mesh.position, player.yaw, player.hp, weapons[activeWeaponIndex].name);
  }

  // Update Region Zone detection & Dynamic VRAM Terrain Chunk Streaming (paused inside dungeons)
  if (zoneManager) {
    zoneManager.update(player.mesh.position, hud);
  }
  if (chunkManager && !isInDungeon) {
    chunkManager.update(player.mesh.position);
  }

  // Dungeon Portal Interactions & Updates
  let nearPortal = false;
  const interactPressed = input.state.interact;

  if (!isInDungeon) {
    const entrances = features.poiPositions.filter(p => p.type === 'dungeon_entrance');
    for (const entrance of entrances) {
      if (player.mesh.position.distanceTo(entrance.position) < 3.5) {
        nearPortal = true;
        hud.showInteractPrompt('Premi [E] per entrare nel Dungeon Subterraneo');
        if (interactPressed && !interactWasPressed) {
          surfacePosBeforeDungeon.copy(player.mesh.position);
          savedOverworldFog = scene.fog;

          activeDungeon = generateDungeon(12345 + Math.floor(Math.random() * 8888), -150);
          scene.add(activeDungeon.group);
          player.setColliders([...features.structureColliders, ...activeDungeon.colliders], decorations.colliders);

          player.teleportTo(activeDungeon.entrancePos);
          player.isSubterranean = true;
          player.dungeonFloorY = activeDungeon.floorY;

          scene.fog = new THREE.FogExp2(0x0a0814, 0.025);

          dungeonBoss = new BossMonster(activeDungeon.bossSpawnPos, {
            name: 'Titano Oscuro',
            maxHp: 800,
            onDeath: () => {
              hud.addScore(1000);
              hud.addCoins(500);
              soundManager.playCollect();
              hud.showWaveBanner('🏆 BOSS SCONFITTO!', 'Hai liberato il dungeon! +1000 PTS & +$500');
            }
          });
          scene.add(dungeonBoss.mesh);

          dungeonMonsters = [];
          for (const mPos of activeDungeon.monsterSpawns) {
            const m = new Monster(mPos, {
              variant: chooseMonsterVariant(mPos),
              onAttack: () => soundManager.playPositionalAttack(m.mesh),
              onDeath: () => {
                hud.addScore(40);
                hud.incrementKills();
                hud.incrementCombo();
              }
            });
            m.mesh.userData.damageable = m;
            m.setProjectileSystem(enemyProjectileSystem);
            dungeonMonsters.push(m);
            scene.add(m.mesh);
          }

          isInDungeon = true;
          hud.showWaveBanner('🏰 DUNGEON SUBTERRANEO', 'Sconfiggi il Boss Titano per fuggire!');
        }
        break;
      }
    }
  } else if (activeDungeon) {
    const distToExit = player.mesh.position.distanceTo(activeDungeon.exitPortalPos);
    if (distToExit < 3.5) {
      nearPortal = true;
      hud.showInteractPrompt('Premi [E] per uscire dal Dungeon');
      if (interactPressed && !interactWasPressed) {
        player.teleportTo(surfacePosBeforeDungeon);
        player.isSubterranean = false;
        player.setColliders(features.structureColliders, decorations.colliders);
        scene.fog = savedOverworldFog;

        scene.remove(activeDungeon.group);
        if (dungeonBoss) scene.remove(dungeonBoss.mesh);
        for (const m of dungeonMonsters) scene.remove(m.mesh);

        activeDungeon = null;
        dungeonBoss = null;
        dungeonMonsters = [];
        isInDungeon = false;
        hud.setDungeonStatus(false);
        hud.hideBossHealthBar();
      }
    }

    if (isInDungeon) {
      if (dungeonBoss && dungeonBoss.isAlive()) {
        dungeonBoss.update(delta, player.mesh.position, true);
        hud.showBossHealthBar(dungeonBoss.name, dungeonBoss.getHp(), dungeonBoss.maxHp, dungeonBoss.getPhase());

        if (damageCooldown <= 0 && player.isAlive() && dungeonBoss.mesh.position.distanceTo(player.mesh.position) < 3.8) {
          if (!skillSystem.isShieldActive) {
            player.takeDamage(15 * dungeonBoss.getPhase());
            damageCooldown = 1.0;
            updateHpDisplay();
            soundManager.playHurt();
          }
        }
      } else {
        hud.hideBossHealthBar();
      }

      for (const m of dungeonMonsters) {
        if (m.isAlive()) {
          m.update(delta, heightMap, player.mesh.position, camera, dungeonMonsters);
          if (damageCooldown <= 0 && player.isAlive() && m.mesh.position.distanceTo(player.mesh.position) < 2.0) {
            if (!skillSystem.isShieldActive) {
              player.takeDamage(10);
              damageCooldown = 1.0;
              updateHpDisplay();
              soundManager.playHurt();
            }
          }
        }
      }

      const aliveDungeonCount = dungeonMonsters.filter(m => m.isAlive()).length + (dungeonBoss?.isAlive() ? 1 : 0);
      hud.setDungeonStatus(true, 'Cripta Subterranea', aliveDungeonCount);
    }
  }

  if (!nearPortal && hud.getInteractPromptText().includes('Dungeon')) {
    hud.hideInteractPrompt();
  }

  // Track wasAlive transition for HP sync and leaderboard overlay on respawn/death
  const isAlive = player.isAlive();
  if (isAlive && !wasAlive) {
    updateHpDisplay();
    hud.hideLeaderboardOverlay();
  } else if (!isAlive && wasAlive) {
    hud.showLeaderboardOverlay({
      score: hud.getScore(),
      kills: hud.getKills(),
      survivalTimeSec: survivalTime,
      waveReached: waveManager.getWaveNumber(),
      accuracyPct: 75,
      favoriteWeapon: weapons[activeWeaponIndex]?.name || 'Rifle'
    }, () => {
      survivalTime = 0;
      player.setRespawnPoint(findRandomSpawnPoint());
      player.respawn(heightMap);
    });
  }
  wasAlive = isAlive;

  if (isAlive) {
    survivalTime += delta;
    waveManager.update(delta);
    hud.updateWaveInfo(waveManager.getWaveNumber(), waveManager.getEnemiesRemaining(), waveManager.hasBoss);
  }

  // Boss Health Bar UI update
  let activeBoss: Monster | null = null;
  for (const m of monsters) {
    if (m.isAlive() && (m.variant === 'titan' || m.variant === 'golem' || m.variant === 'annihilator')) {
      activeBoss = m;
      break;
    }
  }
  if (activeBoss) {
    hud.showBossHealthBar(activeBoss.variant, (activeBoss as any).hp || 0, activeBoss.maxHp);
  } else {
    hud.hideBossHealthBar();
  }

  // Update entities (night speed boost)
  const nightSpeedFactor = dayNight.getNightSpeedMultiplier();
  for (const npc of npcs) npc.update(delta, heightMap);
  for (const monster of monsters) {
    if (monster.isAlive()) {
      monster.update(delta * nightSpeedFactor, heightMap, player.mesh.position, camera, monsters);
      if (damageCooldown <= 0 && player.isAlive() && monster.mesh.position.distanceTo(player.mesh.position) < 2) {
        if (!skillSystem.isShieldActive) {
          player.takeDamage(10);
          damageCooldown = 1;
          updateHpDisplay();
          soundManager.playHurt();
        }
      }
    } else {
      scene.remove(monster.mesh);
    }
  }
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    if (!m.isAlive()) {
      scene.remove(m.mesh);
      monsters.splice(i, 1);
    } else if (m.mesh.position.distanceTo(player.mesh.position) > 230) {
      // Recycle distant monster from previous zone
      scene.remove(m.mesh);
      monsters.splice(i, 1);
    }
  }

  // Populate active zone ahead of player if density is below target (14 monsters)
  if (monsters.length < 14) {
    const activeZoneCandidates = selectMonsterSpawnPoints(
      features.monsterSpawns,
      player.mesh.position,
      14 - monsters.length,
      170,
      45
    );
    activeZoneCandidates.forEach((candidate, idx) => {
      if (candidate.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 70) {
        spawnMonsterAtPosition(candidate.position, idx, candidate.difficulty);
      }
    });
  }

  for (const item of collectibles) item.update(gameTime);
  for (const powerUp of powerUps) powerUp.update(gameTime);

  // Check collectible pickup
  for (const item of collectibles) {
    if (item.isVisible() && player.mesh.position.distanceTo(item.mesh.position) < 2) {
      const value = item.collect();
      hud.addScore(value);
      hud.addCoins(value * 5); // Add money
      soundManager.playCollect();
      if (item.type === 'potion') {
        player.hp = Math.min(player.maxHp, player.hp + 25);
        updateHpDisplay();
      } else if (item.type === 'ammo') {
        const w = weapons[activeWeaponIndex];
        w.reserveAmmo = Math.min(w.maxReserveAmmo, w.reserveAmmo + 30);
        hud.setWeaponState(w.magazineAmmo, w.reserveAmmo, w.isReloading, w.name);
      }
    }
  }

  for (const powerUp of powerUps) {
    if (powerUp.isVisible() && player.mesh.position.distanceTo(powerUp.mesh.position) < 2) {
      const kind = powerUp.collect();
      const feedback = applyPowerUp(kind, powerUpRuntime, player, weapons[0]);
      if (kind === 'ammo') {
        weapons[1].reserveAmmo = Math.min(weapons[1].maxReserveAmmo, weapons[1].reserveAmmo + 6);
      }
      hud.setStatus(feedback);
      soundManager.playCollect();
      if (feedback === 'Health restored') updateHpDisplay();
    }
  }

  tickPowerUpRuntime(delta, powerUpRuntime, player);

  // Vehicle Boarding / Exiting Logic
  if (interactPressed && !interactWasPressed) {
    if (player.activeVehicle) {
      const vehicle = player.activeVehicle;
      player.activeVehicle = null;
      
      const backOffset = new THREE.Vector3(0, 0, 3);
      backOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.yaw);
      player.mesh.position.copy(vehicle.mesh.position).add(backOffset);
      
      const px = (player.mesh.position.x / WORLD_SCALE) + WORLD_SIZE / 2;
      const pz = (player.mesh.position.z / WORLD_SCALE) + WORLD_SIZE / 2;
      player.mesh.position.y = heightMap.getInterpolated(px, pz);
      
      (player as any).yaw = vehicle.yaw;
      (player as any).pitch = 0.3;
    } else {
      let nearestVehicle: Vehicle | null = null;
      let minDist = 5;
      for (const v of vehicles) {
        const dist = player.mesh.position.distanceTo(v.mesh.position);
        if (dist < minDist) {
          minDist = dist;
          nearestVehicle = v;
        }
      }
      if (nearestVehicle) {
        player.activeVehicle = nearestVehicle;
        player.chaseCameraYaw = nearestVehicle.yaw;
      } else {
        // Check near NPC for Dialogue & Lore interaction
        let nearestNPC: NPC | null = null;
        let minDistNPC = 4;
        for (const npc of npcs) {
          const dist = player.mesh.position.distanceTo(npc.mesh.position);
          if (dist < minDistNPC) {
            minDistNPC = dist;
            nearestNPC = npc;
          }
        }
        if (nearestNPC && !dialogueUI.isOpen()) {
          nearestNPC.talkToPlayer(player.mesh.position);
          const node = dialogueManager.startDialogue(nearestNPC.dialogueTreeId, hud.getCoins());
          if (node) {
            dialogueUI.showDialogue(node, nearestNPC.name, nearestNPC.role);
          }
        }
      }
    }
  }
  interactWasPressed = interactPressed;

  // Hide held weapon model while riding vehicles/horses for clean view
  weaponView.setVisible(player.activeVehicle === null);

  // Update player
  player.update(delta, heightMap);

  const activeWeapon = weapons[activeWeaponIndex];
  activeWeapon.update(delta, {
    fireHeld: input.state.attack,
    reloadPressed: input.state.reload,
    canFire: input.pointerLocked && player.isAlive(),
    camera,
    targets: [
      ...monsters.filter((monster) => monster.isAlive()).map((monster) => monster.mesh),
      ...(multiplayer ? multiplayer.getRemoteMeshes() : [])
    ],
  });
  weaponView.update(delta);
  if (activeWeapon.type === 'rifle' || activeWeapon.type === 'shotgun') {
    weaponView.updateAmmo(activeWeapon.magazineAmmo);
  }

  cloudManager.update(delta);

  // Spawn ambient weather particles mapped to the player's active biome
  const pPos = player.mesh.position;
  const px = (pPos.x / WORLD_SCALE) + WORLD_SIZE / 2;
  const pz = (pPos.z / WORLD_SCALE) + WORLD_SIZE / 2;
  const activeBiome = biomeMap.getBiome(px, pz);

  let weatherType: 'snow' | 'sand' | 'leaf' | null = null;
  if (activeBiome === BiomeType.SNOW) {
    weatherType = 'snow';
  } else if (activeBiome === BiomeType.DESERT) {
    weatherType = 'sand';
  } else if (activeBiome === BiomeType.FOREST) {
    weatherType = 'leaf';
  }

  if (weatherType) {
    const spawnRate = 35; // particles per second
    const spawnCount = Math.floor(delta * spawnRate) + (Math.random() < (delta * spawnRate) % 1 ? 1 : 0);
    for (let i = 0; i < spawnCount; i++) {
      const rx = (Math.random() - 0.5) * 50;
      const rz = (Math.random() - 0.5) * 50;
      const ry = 12 + Math.random() * 15;
      const spawnPos = pPos.clone().add(new THREE.Vector3(rx, ry, rz));
      const spawnVel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -2.0 - Math.random() * 2.0,
        (Math.random() - 0.5) * 0.5
      );
      particlePool.spawn(weatherType, spawnPos, spawnVel, 3.5 + Math.random() * 2.0);
    }
  }

  shotTracer.update(delta);
  particlePool.update(delta, heightMap);
  damageNumber.update(delta, camera);
  hitMarker.update(delta);
  hud.update(delta);

  const aliveEnemies = monsters.filter((m) => m.isAlive()).map((m) => ({ x: m.mesh.position.x, z: m.mesh.position.z }));
  hud.updateEnemyTracker(
    { x: player.mesh.position.x, z: player.mesh.position.z },
    (player as any).yaw || 0,
    aliveEnemies
  );

  const poiPositions = features.poiPositions.map((p) => ({ x: p.position.x, z: p.position.z, type: p.type }));
  const currentYaw = player.activeVehicle ? player.activeVehicle.yaw : ((player as any).yaw || 0);

  const nextTargets = aliveEnemies.length === 0
    ? [
        ...features.poiPositions.map((p) => ({ x: p.position.x, z: p.position.z, type: p.type })),
        ...features.monsterSpawns.map((p) => ({ x: p.position.x, z: p.position.z, type: 'spawn' }))
      ].sort((a, b) => {
        const distA = Math.hypot(a.x - player.mesh.position.x, a.z - player.mesh.position.z);
        const distB = Math.hypot(b.x - player.mesh.position.x, b.z - player.mesh.position.z);
        return distA - distB;
      })
    : [];

  hud.updateMinimap(
    { x: player.mesh.position.x, z: player.mesh.position.z },
    currentYaw,
    aliveEnemies,
    poiPositions,
    nextTargets
  );

  // Update Top-Bar 3D Compass & POI distances
  let nearestPoiName = '';
  let nearestPoiDist = Infinity;
  for (const poi of features.poiPositions) {
    const d = Math.hypot(poi.position.x - player.mesh.position.x, poi.position.z - player.mesh.position.z);
    if (d < nearestPoiDist) {
      nearestPoiDist = d;
      let label = poi.type.toUpperCase();
      if (poi.type === 'village') label = 'Villaggio';
      else if (poi.type === 'castle') label = 'Castello';
      else if (poi.type === 'dungeon_entrance') label = 'Portale Dungeon';
      else if (poi.type === 'watchtower') label = 'Torre';
      else if (poi.type === 'blacksmith') label = 'Fabbro';
      else if (poi.type === 'well') label = 'Pozzo';
      nearestPoiName = label;
    }
  }

  hud.updateCompass(currentYaw, nearestPoiName, nearestPoiDist);
  hud.updateSkillCooldowns(skillSystem.dashCooldown, skillSystem.grenadeCooldown, skillSystem.shieldCooldown);

  // Update tumbleweeds
  if (decorations.tumbleweedManager) {
    decorations.tumbleweedManager.update(delta, heightMap);
  }

  // Rotate lighthouse spotlight beams & windmill sails
  for (const lh of lighthouses) {
    if (lh.userData.spotlightPivot) {
      lh.userData.spotlightPivot.rotation.y += delta * 0.8;
    }
  }
  features.structures.traverse((child) => {
    if (child.name === 'windmillSails') {
      child.rotation.z += delta * 0.8;
    }
  });

  // Spawn chimney smoke
  for (const house of houses) {
    if (house.userData.chimneyOffset && Math.random() < delta * 2.0) {
      const tipPos = house.userData.chimneyOffset.clone().applyMatrix4(house.matrixWorld);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        0.8 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.2
      );
      particlePool.spawn('smoke', tipPos, vel, 2.0 + Math.random() * 1.0);
    }
  }

  const projHit = enemyProjectileSystem.update(delta, heightMap, player.mesh.position, 0.5);
  if (projHit.hit) {
    player.takeDamage(projHit.damage);
    updateHpDisplay();
    soundManager.playHurt();
  }

  // Update ambient audio based on current player biome
  soundManager.updateAmbient(biomeMap.getBiome(px, pz));

  // Update HUD vehicle/NPC prompts based on proximity
  if (player.activeVehicle) {
    const vName = player.activeVehicle instanceof Hovercar ? 'Hovercar' : 'Spaceship';
    hud.showInteractPrompt(`Press E to exit ${vName}`);
  } else if (!nearPortal) {
    let nearestVehicle: Vehicle | null = null;
    let minDist = 5;
    for (const v of vehicles) {
      const dist = player.mesh.position.distanceTo(v.mesh.position);
      if (dist < minDist) {
        minDist = dist;
        nearestVehicle = v;
      }
    }
    if (nearestVehicle) {
      const vName = nearestVehicle instanceof Hovercar ? 'Hovercar' : 'Spaceship';
      hud.showInteractPrompt(`Press E to board ${vName}`);
    } else {
      let nearestNPC: NPC | null = null;
      let npcDist = 4;
      for (const npc of npcs) {
        const dist = player.mesh.position.distanceTo(npc.mesh.position);
        if (dist < npcDist) {
          npcDist = dist;
          nearestNPC = npc;
        }
      }
      if (nearestNPC) {
        hud.showInteractPrompt(`Premi [E] per parlare con ${nearestNPC.name}`);
      } else {
        hud.hideInteractPrompt();
      }
    }
  }

  hud.setWeaponState(activeWeapon.magazineAmmo, activeWeapon.reserveAmmo, activeWeapon.isReloading, activeWeapon.name);
  hud.updateBuffs(
    powerUpRuntime.speedBoostRemaining,
    powerUpRuntime.damageBoostRemaining,
    powerUpRuntime.shieldRemaining
  );

  // Dynamically position and target the sun directional light following the player with day/night cycle
  const sun = scene.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
  const ambient = scene.children.find(child => child instanceof THREE.AmbientLight) as THREE.AmbientLight;
  const hemi = scene.children.find(child => child instanceof THREE.HemisphereLight) as THREE.HemisphereLight;

  const DAY_DURATION = 120; // 120 seconds for a full day/night cycle
  const cycleTime = (gameTime / DAY_DURATION) * Math.PI * 2;
  const sunHeight = Math.sin(cycleTime);

  const sunOrbitRadius = 300;
  const offsetX = Math.cos(cycleTime) * sunOrbitRadius;
  const offsetY = Math.abs(sunHeight) * sunOrbitRadius;
  const offsetZ = Math.cos(cycleTime * 0.5) * 100;

  const daySkyColor = new THREE.Color(0x87CEEB);
  const sunsetSkyColor = new THREE.Color(0xff7043);
  const nightSkyColor = new THREE.Color(0x06060c);
  const skyColor = new THREE.Color();

  let sunIntensity = 0;
  let ambientIntensity = 0.05;

  if (sunHeight > 0.1) {
    // Full day
    const t = Math.min(1, (sunHeight - 0.1) / 0.4);
    skyColor.lerpColors(sunsetSkyColor, daySkyColor, t);
    sunIntensity = 1.2 * t + 0.4 * (1 - t);
    ambientIntensity = 0.4 * t + 0.15 * (1 - t);
    if (sun) sun.color.setHex(0xfffaed);
  } else if (sunHeight >= -0.1 && sunHeight <= 0.1) {
    // Transition (dawn / dusk)
    const t = (sunHeight + 0.1) / 0.2; // 0 to 1
    skyColor.lerpColors(nightSkyColor, sunsetSkyColor, t);
    sunIntensity = 0.4 * t + 0.1 * (1 - t);
    ambientIntensity = 0.15 * t + 0.05 * (1 - t);
    if (sun) sun.color.setHex(0xffaa66); // warm sunset light
  } else {
    // Night
    const t = Math.min(1, (-sunHeight - 0.1) / 0.4);
    skyColor.lerpColors(sunsetSkyColor, nightSkyColor, 1 - (1 - t) * (1 - t));
    sunIntensity = 0.2; // Moonlight
    ambientIntensity = 0.05;
    if (sun) sun.color.setHex(0x90caf9); // cool moonlight
  }

  scene.background = skyColor;
  if (scene.fog && scene.fog instanceof THREE.Fog) {
    scene.fog.color = skyColor;
  }

  if (ambient) ambient.intensity = ambientIntensity;
  if (hemi) hemi.intensity = ambientIntensity * 0.75;

  if (sun) {
    // Position sun or moon based on cycle
    if (sunHeight > 0) {
      sun.position.set(player.mesh.position.x + offsetX, player.mesh.position.y + offsetY, player.mesh.position.z + offsetZ);
    } else {
      sun.position.set(player.mesh.position.x - offsetX, player.mesh.position.y + offsetY, player.mesh.position.z - offsetZ);
    }
    sun.intensity = sunIntensity;
    sun.target.position.copy(player.mesh.position);
    sun.target.updateMatrixWorld();
  }

// Update water animation
        updateWater(water, gameTime);

  // Render
  renderer.render(scene, camera);
  if (profiler && renderer) {
    profiler.update(
      renderer,
      monsters.filter((m) => m.isAlive()).length,
      particlePool ? particlePool.getActiveCount() : 0
    );
  }

  // Next frame
  requestAnimationFrame(animate);
}
animate();

function updateRendererSize(): void {
  if (!renderer) return;
  const maxW = 1280;
  const maxH = 720;
  const aspect = window.innerWidth / window.innerHeight;
  let renderW = window.innerWidth;
  let renderH = window.innerHeight;

  if (renderW > maxW || renderH > maxH) {
    if (renderW / maxW > renderH / maxH) {
      renderW = maxW;
      renderH = Math.round(maxW / aspect);
    } else {
      renderH = maxH;
      renderW = Math.round(maxH * aspect);
    }
  }

  renderer.setSize(renderW, renderH, false);
  renderer.domElement.style.width = '100vw';
  renderer.domElement.style.height = '100vh';
  renderer.setPixelRatio(1.0);
}

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  updateRendererSize();
});

  await setLoadingProgress(100, 'Caricamento completato!');
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }, 300);
}

initGame();

// Registration & Start Modal Overlay
const savedName = localStorage.getItem('mondo_player_name') || '';
const registrationOverlay = document.createElement('div');
registrationOverlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 12, 22, 0.92);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
  color: white;
  pointer-events: auto;
`;
registrationOverlay.innerHTML = `
  <div style="background: rgba(20, 25, 40, 0.95); border: 2px solid #00E5FF; border-radius: 16px; padding: 32px; width: 440px; max-width: 92vw; box-shadow: 0 0 35px rgba(0,229,255,0.4); text-align: center;">
    <h1 style="color: #00E5FF; font-size: 32px; font-weight: 900; letter-spacing: 3px; margin-bottom: 8px; text-shadow: 0 0 15px rgba(0,229,255,0.6);">MONDO 3D</h1>
    <p style="color: #B0BEC5; font-size: 14px; margin-bottom: 24px;">Registrati per salvare i tuoi punteggi in classifica e scegliere la tua classe!</p>

    <div style="text-align: left; margin-bottom: 20px;">
      <label style="display: block; font-size: 13px; font-weight: bold; color: #80DEEA; margin-bottom: 6px;">NOME GIOCATORE:</label>
      <input id="reg-player-name" type="text" value="${savedName}" placeholder="Inserisci il tuo nome..." maxlength="20" style="width: 100%; background: #0A0D18; border: 1.5px solid #00E5FF; border-radius: 8px; padding: 10px 14px; color: white; font-size: 15px; font-weight: bold; outline: none; box-shadow: inset 0 0 8px rgba(0,0,0,0.8);" />
    </div>

    <div style="text-align: left; margin-bottom: 24px;">
      <label style="display: block; font-size: 13px; font-weight: bold; color: #80DEEA; margin-bottom: 8px;">SCEGLI CLASSE / RUOLO:</label>
      <div style="display: flex; gap: 8px;">
        <button id="class-warrior" class="class-btn" style="flex: 1; background: rgba(255,23,68,0.2); border: 2px solid #FF1744; border-radius: 8px; padding: 10px 6px; color: white; font-weight: bold; font-size: 12px; cursor: pointer; transition: transform 0.1s;">
          🛡️ GUERRIERO<br><span style="font-size: 10px; color: #FF8A80; font-weight: normal;">+30 HP Max</span>
        </button>
        <button id="class-scout" class="class-btn" style="flex: 1; background: rgba(0,230,118,0.2); border: 2px solid #00E676; border-radius: 8px; padding: 10px 6px; color: white; font-weight: bold; font-size: 12px; cursor: pointer; transition: transform 0.1s;">
          ⚡ ESPLORATORE<br><span style="font-size: 10px; color: #B9F6CA; font-weight: normal;">+20% Speed</span>
        </button>
        <button id="class-engineer" class="class-btn" style="flex: 1; background: rgba(0,229,255,0.2); border: 2px solid #00E5FF; border-radius: 8px; padding: 10px 6px; color: white; font-weight: bold; font-size: 12px; cursor: pointer; transition: transform 0.1s;">
          🔧 INGEGNERE<br><span style="font-size: 10px; color: #80DEEA; font-weight: normal;">-30% Cooldown</span>
        </button>
      </div>
    </div>

    <button id="start-game-btn" style="width: 100%; background: linear-gradient(90deg, #00E5FF, #76FF03); border: none; border-radius: 10px; padding: 14px; color: #050A14; font-size: 18px; font-weight: 900; letter-spacing: 1px; cursor: pointer; box-shadow: 0 0 20px rgba(0,229,255,0.6); transition: transform 0.1s;">
      ENTRA NEL MONDO 3D
    </button>
  </div>
`;
document.body.appendChild(registrationOverlay);

let selectedClass: 'warrior' | 'scout' | 'engineer' = 'scout';

const btnW = document.getElementById('class-warrior');
const btnS = document.getElementById('class-scout');
const btnE = document.getElementById('class-engineer');

function selectRole(role: 'warrior' | 'scout' | 'engineer'): void {
  selectedClass = role;
  if (btnW) btnW.style.opacity = role === 'warrior' ? '1.0' : '0.4';
  if (btnS) btnS.style.opacity = role === 'scout' ? '1.0' : '0.4';
  if (btnE) btnE.style.opacity = role === 'engineer' ? '1.0' : '0.4';
}
selectRole('scout');

if (btnW) btnW.addEventListener('click', () => selectRole('warrior'));
if (btnS) btnS.addEventListener('click', () => selectRole('scout'));
if (btnE) btnE.addEventListener('click', () => selectRole('engineer'));

const startBtn = document.getElementById('start-game-btn');
if (startBtn) {
  startBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('reg-player-name') as HTMLInputElement;
    const finalName = nameInput?.value.trim() || 'Giocatore';
    hud.setPlayerName(finalName);
    if (multiplayer) multiplayer.connect(finalName);

    // Apply class passive bonuses
    if (selectedClass === 'warrior') {
      player.maxHp = 130;
      player.hp = 130;
      updateHpDisplay();
    } else if (selectedClass === 'scout') {
      (player as any).speed *= 1.2;
    }

    registrationOverlay.remove();
    try {
      lastTime = performance.now();
      document.body.requestPointerLock();
      if (renderer) renderer.domElement.style.pointerEvents = 'auto';
      soundManager.startAmbient();
    } catch (e) {}
  });
}

// Toggle Minimap Expansion with Key M and Skill Tree with Key U
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') {
    hud.toggleMinimapExpanded();
  }
  if (e.code === 'KeyU') {
    try { document.exitPointerLock(); } catch (_) {}
    hud.toggleUpgradeMenu((type) => {
      if (type === 'hp') {
        player.maxHp += 25;
        player.hp += 25;
        updateHpDisplay();
        return true;
      } else if (type === 'speed') {
        (player as any).speed *= 1.15;
        return true;
      } else if (type === 'damage') {
        powerUpRuntime.shotDamage = Math.round(powerUpRuntime.shotDamage * 1.2);
        return true;
      }
      return false;
    });
  }
});



// Weapon switching keyboard controls (Keys 1..0)
window.addEventListener('keydown', (e) => {
  if (e.code === 'Digit1') switchWeapon(0);
  if (e.code === 'Digit2') switchWeapon(1);
  if (e.code === 'Digit3') switchWeapon(2);
  if (e.code === 'Digit4') switchWeapon(3);
  if (e.code === 'Digit5') switchWeapon(4);
  if (e.code === 'Digit6') switchWeapon(5);
  if (e.code === 'Digit7') switchWeapon(6);
  if (e.code === 'Digit8') switchWeapon(7);
  if (e.code === 'Digit9') switchWeapon(8);
  if (e.code === 'Digit0') switchWeapon(9);
});

function switchWeapon(index: number): void {
  if (index < 0 || index >= weapons.length || index === activeWeaponIndex) return;
  if (weapons[activeWeaponIndex].isReloading) return; // Prevent switching while reloading

  activeWeaponIndex = index;
  const activeWeapon = weapons[activeWeaponIndex];
  weaponView.setWeapon(activeWeapon.type);
  hud.setWeaponState(activeWeapon.magazineAmmo, activeWeapon.reserveAmmo, activeWeapon.isReloading, activeWeapon.name);
}

// Listen for pointer lock rejection
document.addEventListener('pointerlockerror', () => {
  if (document.getElementById('pointer-lock-warning')) return;

  const warning = document.createElement('div');
  warning.id = 'pointer-lock-warning';
  warning.textContent = 'Cattura del mouse fallita. Clicca sulla pagina per riprovare.';
  warning.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: #ffffff;
    background: rgba(211, 47, 47, 0.9);
    padding: 12px 24px;
    border-radius: 4px;
    font-family: system-ui, sans-serif;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    z-index: 10000;
    pointer-events: none;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(warning);

  setTimeout(() => {
    warning.style.opacity = '0';
    setTimeout(() => warning.remove(), 300);
  }, 3000);
});

