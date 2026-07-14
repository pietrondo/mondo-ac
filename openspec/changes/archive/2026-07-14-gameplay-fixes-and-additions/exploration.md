# Exploration Report: Gameplay Fixes and Additions

This report details the exploration and analysis of the codebase for the game "mondo". We have investigated the five target items requested and formulated an implementation plan.

---

## 1. Input & Respawn Key Mismatch
### Problem
The death screen shows the text "Sei caduto! Premi R per rinascere", but the player checks for `input.state.interact` (which is mapped to key **E**). Additionally, the player may feel unable to move after respawn if their input states become stuck during death (e.g. if they were holding keys when dying, the `keyup` events were missed or not cleared) or if pointer lock state behaves unexpectedly.

### Analysis & Solution
* **Key Mapping Mismatch:** In [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts#L147), change the condition for respawn to check for either `interact` (E) or `reload` (R): `if (this.input.state.interact || this.input.state.reload)`.
* **Stuck Inputs:** Add a `reset()` method in [input.ts](file:///C:/Users/pietr/progetti/mondo/src/controls/input.ts) that clears all movement and action keys. Call this method when the player dies (in `die()`) and when the player respawns (in `respawn()`).
* **Pointer Lock:** If pointer lock was lost during death, we can attempt to request pointer lock again inside `respawn()` since it is triggered by keydown (which is a valid user gesture event in modern browsers).
* **HP UI Sync:** When the player respawns, their HP is set back to max, but the HUD display is not updated. We will update the animate loop in [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) to detect when the player goes from dead to alive and trigger `updateHpDisplay()` to keep the UI in sync.

---

## 2. Floating Buildings
### Problem
Structures like houses, towers, castles, and ruins are placed at the center terrain height. On sloping terrain, parts of their bases float in the air.

### Analysis & Solution
* Add a downward foundation block (e.g., a dark stone base extending down by 4 meters) to each structure generator in [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts).
  * **House:** Add a stone box base of size `3.1 x 4 x 3.1` at `y = -2` (extending from `y = -4` to `y = 0`).
  * **Tower:** Add a stone cylinder base of radius `1.8 - 2.0` and height `4` at `y = -2`.
  * **Castle:** Add a single large stone slab base of size `15 x 4 x 15` at `y = -2` to support the whole castle structure.
  * **Ruin:** Add a stone base of size `3.1 x 4 x 0.6` at `y = -2` directly below the standing wall.
* **Physics & Colliders:** If the player is on a slope below the structure's default `y = 0`, they could clip through the floating base. To fix this, update the AABB colliders for these structures in [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts) to extend their minimum Y bounds down to `-4`.

---

## 3. New Places (Pyramid & Lighthouse)
### Problem
The world needs new distinct landmarks that spawn in specific biomes.

### Analysis & Solution
* **Pyramid:**
  * Add `createPyramid(): THREE.Group` in [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts). It will be built of stepped sandstone layers (base `8x2x8`, mid `6x2x6`, top `4x2x4`) and a golden cone peak (`2x2`), plus a deep foundation.
  * In [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts), place it in the `DESERT` biome using a random selection chance (~2%).
* **Lighthouse:**
  * Add `createLighthouse(): THREE.Group` in [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts). It will feature alternating red and white cylindrical bands (5 segments, total height 10m), a grey stone base, a gallery deck, a glass lantern room with a glowing yellow core, a functional `PointLight`, and a black cone roof.
  * In [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts), place it in the `COAST` biome when elevation is close to the water level (e.g., `elevation > 5` to keep it near shores/beaches).

---

## 4. New Golem Enemy Variant
### Problem
We want a slow, high-HP, tank-like enemy variant with large projectiles.

### Analysis & Solution
* **Profile Definition:** In [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts), add a `'golem'` variant:
  * Scale: `1.6` (large)
  * HP: `150` (high survivability)
  * Speed: `1.5` (slow)
  * Color: slate grey (`0x607D8B`) with cyan glowing eyes (`0x00E5FF`)
  * Add `'golem'` to the selection array in `chooseMonsterVariant`.
* **Visuals & Projectiles:**
  * In [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts), customize the golem mesh by adding large stone fists/shoulder details.
  * In `getAttackParams()`, add golem parameters: slow projectile speed (`15`), high damage (`30`), cyan color (`0x00E5FF`), and a larger projectile size (`0.45`).
* **Projectile Color Fix:** We discovered a bug in [EnemyProjectile.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/EnemyProjectile.ts#L53) where projectile color parameter was ignored, forcing all projectiles to be red. We will fix this by cloning the projectile material and setting its hex color from the options.

---

## 5. New Item: Shield (Invulnerability) Power-Up
### Problem
We want to add a new item variant that grants the player temporary invulnerability.

### Analysis & Solution
* **Power-Up Kind:** Add `'shield'` to the `PowerUpKind` union in [powerUpEffects.ts](file:///C:/Users/pietr/progetti/mondo/src/game/powerUpEffects.ts).
* **Effect Mechanics:**
  * Update `PowerUpRuntime` to store `shieldRemaining: number`.
  * Update `PowerUpRecipient` (implemented by `Player`) to include an `isInvulnerable: boolean` property.
  * In `applyPowerUp()`, set `shieldRemaining = 8` (seconds) when collecting a shield.
  * In `tickPowerUpRuntime()`, decrement `shieldRemaining` and set `player.isInvulnerable` accordingly.
  * In [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts#L85), short-circuit `takeDamage()` if `this.isInvulnerable` is true.
* **3D Visuals:**
  * In [PowerUp.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/PowerUp.ts), define a cyan/light-blue profile for `shield` and construct a glowing icosahedron core with a rotating wireframe torus ring.
* **HUD Buff Tracker:**
  * In [hud.ts](file:///C:/Users/pietr/progetti/mondo/src/ui/hud.ts), add an active buffs tracker element that displays remaining seconds of Speed Boost (Adrenaline), Damage Boost (Overclock), and Shield (Invulnerability) in real-time.
  * In [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts), call `hud.updateBuffs` and add `'shield'` to `powerUpKinds`.
