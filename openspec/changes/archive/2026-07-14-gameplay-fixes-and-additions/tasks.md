# Tasks Breakdown: gameplay-fixes-and-additions

## Review Workload Forecast
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1 (Foundation & Landmark Setup)
- [x] Extend existing structures in [src/world/structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts): append dark slate (`0x37474F`) stone foundation meshes spanning `y = -4` to `0` for House, Tower, Castle, and Ruin structures. Adjust their `Box3` colliders to start at `y = -4` instead of `y = 0`.
- [x] Define the Pyramid structure builder in [src/world/structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts): implement `createPyramid(): THREE.Group` using sandstone blocks (`0xDEC29B`) sized `8x2x8`, `6x2x6`, and `4x2x4` topped with a golden cone (`0xFFD700`, size `2x2`). Add sandstone foundation down to `y = -4` and set AABB `Box3` collider covering `[-4, -4, -4]` to `[4, 8, 4]`.
- [x] Define the Lighthouse structure builder in [src/world/structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts): implement `createLighthouse(): THREE.Group` using a dark stone cylindrical foundation (`y = -4` to `2`), alternating red and white cylindrical bands (`y = 2` to `12`), a gallery deck, glass lantern room with glowing yellow core, a black cone roof, and a functional yellow `PointLight` (color `0xFFFF00`, range `20`, intensity `3`). Set AABB `Box3` collider covering `[-2, -4, -2]` to `[2, 12, 2]`.
- [x] Integrate structure spawning in [src/world/features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts): import `createPyramid` and `createLighthouse`. Separate the Desert case from Snow in `placeFeatures` and spawn Pyramids at a 2% chance and ruins at 4% chance. Add a Coast biome case to spawn Lighthouses at a 5% chance when `elevation > 5`. Ensure all recursive sub-meshes have `castShadow` and `receiveShadow` set to `true`.

## Phase 2 (Input & Respawn System)
- [x] Implement input reset logic in [src/controls/input.ts](file:///C:/Users/pietr/progetti/mondo/src/controls/input.ts): add `reset(): void` to the `InputManager` class to clear all keyboard keys (`forward`, `backward`, `left`, `right`, `jump`, `interact`, `reload`, `attack`, `run`) to `false` and reset mouse movement offsets to `0`.
- [x] Update player death and respawn lifecycle in [src/entities/Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts):
  - In `die()` and `respawn(heightMap)`, invoke `this.input.reset()`.
  - In `respawn(heightMap)`, request pointer lock via `document.body.requestPointerLock()`.
  - In the update loop dead-state check, allow both `input.state.reload` (KeyR) and `input.state.interact` (KeyE) to trigger `respawn(heightMap)`.

## Phase 3 (Invulnerability, Golem & Shield Logic)
- [x] Add player invulnerability toggle in [src/entities/Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts): declare `isInvulnerable: boolean = false` on the `Player` class and modify `takeDamage(amount)` to bypass damage logic when `this.isInvulnerable` is `true`.
- [x] Define the Golem monster variant in [src/world/monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts):
  - Add `'golem'` to the `MonsterVariant` union type.
  - Define the golem profile: `scale: 1.6`, `bodyWidth: 1.6`, `bodyHeight: 1.8`, `bodyDepth: 1.6` (scaled up), `hp: 150`, `speed: 1.5`, `bodyColor: 0x607D8B`, `eyeColor: 0x00E5FF`.
  - Update `chooseMonsterVariant(position, index)` to accept an optional `BiomeMap`. If a biome map is provided and the biome at the position is `BiomeType.MOUNTAIN` or `BiomeType.DESERT`, return `'golem'`.
- [x] Implement Golem-specific aesthetics and attacks in [src/entities/Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts):
  - In the constructor, if `variant === 'golem'`, attach large stone fist boxes (`0x455A64`) at `x = ±0.8 * scale` and `y = 0.45 * height`.
  - Update `getAttackParams()` to return Golem parameters: `speed: 15`, `damage: 30`, `color: 0xff0000`, `size: 0.45`, `cooldown: 3.0`.
- [x] Fix enemy projectile color override bug in [src/combat/EnemyProjectile.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/EnemyProjectile.ts): clone the projectile material and invoke `material.color.setHex(options.color)` on spawn if options specify a color.
- [x] Define and build the Shield power-up in [src/entities/PowerUp.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/PowerUp.ts):
  - Add `'shield'` to `powerUpProfiles` with color `0x00e5ff` (cyan) and labelColor `0x80deea`.
  - Build the shield visual representation: a cyan glowing icosahedron core, surrounded by a rotating wireframe torus ring named `"torusRing"`.
  - In the `update(time)` loop, rotate `"torusRing"` on multiple axes.
- [x] Implement Shield power-up behavior in [src/game/powerUpEffects.ts](file:///C:/Users/pietr/progetti/mondo/src/game/powerUpEffects.ts):
  - Add `'shield'` to `PowerUpKind` union.
  - Add `shieldRemaining: number` to `PowerUpRuntime` interface, initialized to `0` in `createPowerUpRuntime`.
  - Add `isInvulnerable: boolean` to the `PowerUpRecipient` interface.
  - In `applyPowerUp()`, if `kind === 'shield'`, set `runtime.shieldRemaining = 8` and `player.isInvulnerable = true`.
  - In `tickPowerUpRuntime()`, decrement `shieldRemaining`. Reset `player.isInvulnerable = false` when it reaches `0`.
- [x] Build buff indicators in the HUD in [src/ui/hud.ts](file:///C:/Users/pietr/progetti/mondo/src/ui/hud.ts):
  - Create a new `buffsElement` container in the constructor styled at `top: 60px`, `right: 20px`, `position: fixed`, and `color: white`.
  - Implement `updateBuffs(speed, damage, shield): void` to print active buff countdowns (Adrenaline, Overclock, Shield) to 1 decimal place when their remaining time is greater than `0`.
- [x] Orchestrate the Shield power-up and HUD updates in [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts):
  - Include `'shield'` in the `powerUpKinds` list and adjust `powerUpSpawns` slice length to `5` to ensure all 5 kinds spawn.
  - Track `wasAlive` state outside the game loop. If transitioning from dead to alive (`isAlive && !wasAlive`), trigger `updateHpDisplay()` to refresh HP HUD.
  - Invoke `hud.updateBuffs(powerUpRuntime.speedBoostRemaining, powerUpRuntime.damageBoostRemaining, powerUpRuntime.shieldRemaining)` in `animate()`.
  - Ensure that `updateHpDisplay()` is also invoked when the player is hit by projectiles (`projHit.hit` is true).

## Phase 4 (Verification & Tests)
- [x] Implement unit tests for inputs in [tests/unit/input.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/input.test.ts): verify that `InputManager.reset()` properly clears all key states and mouse coordinates to their initial state.
- [x] Implement unit tests for Player lifecycle and invulnerability in [tests/unit/player.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/player.test.ts): verify that the player ignores damage when `isInvulnerable` is true, and that inputs reset on death and respawn.
- [x] Implement unit tests for the Golem variant biome selection in [tests/unit/monsterVariant.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/monsterVariant.test.ts): verify that `chooseMonsterVariant` selects `'golem'` in Desert and Mountain biomes.
- [x] Implement unit tests for Shield effects in [tests/unit/powerUpEffects.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/powerUpEffects.test.ts): verify that the shield effect timer ticks down and resets the player's invulnerability state correctly.
- [x] Perform manual testing:
  - Verify that shadows render properly on the Lighthouse and Pyramid structures.
  - Confirm the cursor locks to the viewport on respawn.
  - Collect the Shield power-up and check that the player is invulnerable to monster projectiles, with a real-time countdown showing in the HUD.

## Phase 5 (Cleanup & Documentation)
- [x] Document code and design changes: add documentation explaining the lighthouse/pyramid structures, player first-person shadow/input lock reset logic, and invulnerability mechanics.
- [x] Remove any debug, temporary, or unused comments/code segments introduced during the implementation of these tasks.

