# Technical Design: Gameplay Fixes and Additions

This document details the design for introducing new world structures (Pyramid, Lighthouse), the Shield power-up, the Golem monster variant, slope-ready structure foundations, and resolving input locking on player death/respawn.

---

## 1. Component Modifications

| File Path | Description of Changes | Details & Types |
| :--- | :--- | :--- |
| **[input.ts](file:///C:/Users/pietr/progetti/mondo/src/controls/input.ts)** | Add input reset capability. | Implement `reset(): void` to set all key states (`forward`, `backward`, `left`, `right`, `jump`, `interact`, `reload`, `attack`, `run`) to `false` and mouse movement to `0`. |
| **[Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts)** | Integrate invulnerability, reset inputs on lifecycle events, map KeyR and KeyE for respawn. | <ul><li>Add `isInvulnerable: boolean = false`.</li><li>Update `takeDamage(amount)` to bypass damage if `isInvulnerable === true`.</li><li>In `die()` and `respawn()`, call `this.input.reset()`.</li><li>In `respawn()`, call `document.body.requestPointerLock()`.</li><li>In the dead-state update check, allow `input.state.reload` (KeyR) in addition to `input.state.interact` (KeyE) to trigger `respawn()`.</li></ul> |
| **[structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts)** | Extend existing foundations to -4 Y; define new structures (Pyramid, Lighthouse). | <ul><li>**House/Tower/Castle/Ruin**: Append stone foundation meshes spanning `y = -4` to `0` with dark slate material (`0x37474F`). Modify bounding box colliders to start at `y = -4`.</li><li>**Pyramid**: Create `createPyramid(): THREE.Group`. Build with sandstone blocks (`0xDEC29B`) sized `8x2x8`, `6x2x6`, and `4x2x4` topped by a golden cone (`0xFFD700`, `2x2`). Add sandstone foundation down to `y = -4`. Assign AABB `Box3` collider covering `[-4, -4, -4]` to `[4, 8, 4]`.</li><li>**Lighthouse**: Create `createLighthouse(): THREE.Group`. Build with a dark stone cylindrical foundation cylinder (`y = -4` to `2`), alternating red and white cylindrical bands (`y = 2` to `12`), gallery deck, glass lantern room with glowing yellow core, a functional yellow `PointLight` (color `0xFFFF00`, range `20`, intensity `3`), and black cone roof. Assign AABB `Box3` collider covering `[-2, -4, -2]` to `[2, 12, 2]`.</li></ul> |
| **[features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts)** | Spawn new structures and propagate shadow mapping. | <ul><li>In `placeFeatures()`, import new builders.</li><li>**Desert**: Spawn `createPyramid` at 2% chance. Spawn ruins at 4% chance.</li><li>**Coast**: Spawn `createLighthouse` at 5% chance when `elevation > 5`.</li><li>Enable `castShadow = true` and `receiveShadow = true` recursively on all structure sub-meshes.</li></ul> |
| **[monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts)** | Define Golem variant. | <ul><li>Add `'golem'` to `MonsterVariant` union.</li><li>Define golem profile: `scale: 1.6`, `hp: 150`, `speed: 1.5`, `bodyColor: 0x607D8B`, `eyeColor: 0x00E5FF`.</li><li>Update `chooseMonsterVariant()` signature to accept optional `BiomeMap`. Return `'golem'` if spawn coordinates fall in `MOUNTAIN` or `DESERT`.</li></ul> |
| **[Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts)** | Customize Golem mesh and attacks. | <ul><li>If `variant === 'golem'`, instantiate large stone fist boxes (`0x455A64`) at `x = ±0.8 * scale` and `y = 0.45 * height`.</li><li>Implement `getAttackParams()` for `golem`: `speed: 15`, `damage: 30`, `color: 0xff0000`, `size: 0.45`, `cooldown: 3.0`.</li></ul> |
| **[EnemyProjectile.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/EnemyProjectile.ts)** | Fix projectile color override bug. | Clone material and apply `material.color.setHex(options.color)` on projectile spawning. |
| **[PowerUp.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/PowerUp.ts)** | Render Shield power-up mesh. | <ul><li>Define `'shield'` in `powerUpProfiles` with cyan/light-blue (`0x00e5ff`) and label color (`0x80deea`).</li><li>Create cyan glowing icosahedron core, with a rotating wireframe torus ring. Name the torus ring group child `"torusRing"`.</li><li>In `update(time)`, rotate `"torusRing"` on multiple axes.</li></ul> |
| **[powerUpEffects.ts](file:///C:/Users/pietr/progetti/mondo/src/game/powerUpEffects.ts)** | Implement Shield logic. | <ul><li>Add `'shield'` to `PowerUpKind`. Add `shieldRemaining` to `PowerUpRuntime` and `isInvulnerable` to `PowerUpRecipient`.</li><li>Set `shieldRemaining = 8` and `isInvulnerable = true` upon collection.</li><li>In `tickPowerUpRuntime()`, decrement `shieldRemaining`. Reset `isInvulnerable = false` when timer expires.</li></ul> |
| **[hud.ts](file:///C:/Users/pietr/progetti/mondo/src/ui/hud.ts)** | Display buff countdowns. | <ul><li>Create `buffsElement` container at `top: 60px`, `right: 20px` to avoid HP overlapping.</li><li>Implement `updateBuffs(speed, damage, shield): void` to print active timers (Adrenaline, Overclock, Shield) to 1 decimal place.</li></ul> |
| **[main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts)** | Orchestrate buffs update, transition handling, and input resetting. | <ul><li>Include `'shield'` in `powerUpKinds` list and instantiate.</li><li>Track `wasAlive` state. If transitioning from dead to alive, trigger `updateHpDisplay()` to refresh HP HUD.</li><li>Invoke `hud.updateBuffs(...)` in the animation loop.</li></ul> |

---

## 2. Verification Plan

### 2.1 Unit Tests
* **`tests/unit/input.test.ts`**: Verify `InputManager.reset()` clears keys and mouse offsets.
* **`tests/unit/player.test.ts`**: Verify player ignores damage when `isInvulnerable` is true. Ensure input resets on player death/respawn.
* **`tests/unit/monsterVariant.test.ts`**: Verify `chooseMonsterVariant` selects `'golem'` in Desert/Mountain biomes.
* **`tests/unit/powerUpEffects.test.ts`**: Test that the shield effect ticks down and updates player invulnerability state.

### 2.2 Manual Tests
1. Verify shadows render properly on the Lighthouse and Pyramid structures.
2. Confirm the cursor locks to viewport on respawn.
3. Collect the Shield power-up and check that the player is invulnerable to monster projectiles, with a real-time countdown showing in the HUD.
