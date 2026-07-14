# Change Proposal: Gameplay Fixes and Additions

## 1. Executive Summary
This proposal outlines the design and implementation details for gameplay enhancements, structure additions, and controls optimization in **Mondo**. We will introduce new world structures (Pyramid and Lighthouse), implement a Shield power-up, add a new Golem monster variant, extend structure foundations on slope terrain to prevent visual floating, and resolve keyboard input locking during player death/respawn cycles.

These improvements will enrich gameplay variety, stabilize structure rendering, and provide a smoother, bug-free controls experience.

## 2. Scope & Objectives
We will implement three new capabilities and modify four existing capabilities:

### New Capabilities
- **`pyramid-structure`**: Add a sandstone pyramid structure in the `DESERT` biome using stepped sandstone layers and a golden cone peak, accompanied by a proper AABB collider.
- **`lighthouse-structure`**: Add a beach/coastline lighthouse structure in the `COAST` biome using alternating red/white cylindrical bands, a grey stone base, a gallery deck, a glass lantern room with a glowing yellow core, a functional `PointLight` object, and a black cone roof.
- **`shield-powerup`**: Introduce a `'shield'` power-up kind that grants the player temporary invulnerability (8 seconds), represented by a glowing icosahedron core surrounded by a rotating wireframe torus ring, and supported by a HUD countdown display.

### Modified Capabilities
- **`player-movement`**: Modify the player respawn cycle to support both `KeyR` and `KeyE` keys, clear active keyboard inputs upon death and respawn to prevent stuck states, and automatically request pointer lock again when the player respawns.
- **`rendering-shadows`**: Ensure child meshes of the new `Pyramid` and `Lighthouse` structures cast and receive shadows by enabling `castShadow` and `receiveShadow` flags.
- **`monster-spawning`**: Add a `'golem'` monster variant (1.6x scale, 150 HP, 1.5 speed, slate grey body with cyan eyes) spawning in the `MOUNTAIN` and `DESERT` biomes that fires giant red projectiles (size 0.45, speed 15, damage 30).
- **`structure-generation`**: Extend `House`, `Tower`, `Castle`, and `Ruin` structures with downward stone foundations extending 4 meters, and update their AABB collider boundaries to start at `y = -4` to support sloped terrain without clipping.

---

## 3. High-Level Technical Approach

### 3.1 pyramid-structure
- Define `createPyramid(): THREE.Group` in [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts).
- The pyramid will be built of stepped sandstone layers (e.g., base `8x2x8`, middle `6x2x6`, top `4x2x4`) and a golden cone peak (`2x2`).
- Include a sandstone foundation block extending down to `-4` meters below the ground.
- Construct and assign a solid `Box3` collider covering the range `[-4, 4]` on X/Z and `[-4, 8]` on Y.
- In [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts), when sampling a grid position with a `DESERT` biome, spawn a pyramid with a low selection chance (~2%). Add it to the structure colliders and structures group.

### 3.2 lighthouse-structure
- Define `createLighthouse(): THREE.Group` in [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts).
- The lighthouse will feature:
  - A dark grey stone cylindrical base.
  - An alternating red and white cylindrical tower (e.g., 5 stacked cylinder segments).
  - A flat gallery deck on top.
  - A glass lantern room enclosing a glowing yellow sphere (emissive basic material).
  - A functional Three.js `PointLight` (yellow color, moderate range/intensity) inside the lantern room.
  - A black cone roof.
  - A foundation extending down 4 meters to `-4` Y.
- Set up a solid `Box3` collider covering the base bounds (e.g., `[-2, 2]` on X/Z and `[-4, 12]` on Y).
- In [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts), add support for spawning the lighthouse in the `COAST` biome when elevation is close to shore level (e.g., `elevation > 5` and below plains elevation threshold), with a suitable spawn chance.

### 3.3 shield-powerup
- In [powerUpEffects.ts](file:///C:/Users/pietr/progetti/mondo/src/game/powerUpEffects.ts):
  - Expand `PowerUpKind` union to include `'shield'`.
  - Add `shieldRemaining: number` to `PowerUpRuntime` interface.
  - Add `isInvulnerable: boolean` to `PowerUpRecipient` interface.
  - In `createPowerUpRuntime()`, initialize `shieldRemaining: 0`.
  - In `applyPowerUp()`, handle `'shield'` by setting `shieldRemaining = 8` and returning `'Shield activated'`.
  - In `tickPowerUpRuntime()`, decrement `shieldRemaining` by `delta`. If it reaches `0`, set `player.isInvulnerable = false`. Otherwise, keep `player.isInvulnerable = true`.
- In [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts):
  - Define `isInvulnerable: boolean` initialized to `false`.
  - Update `takeDamage()` to ignore damage if `this.isInvulnerable` is true.
- In [PowerUp.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/PowerUp.ts):
  - Define profile for `'shield'` with color slate cyan/light-blue (`0x00e5ff`) and label color (`0x80deea`).
  - Create a cyan/light-blue glowing icosahedron core, with a rotating wireframe torus ring.
  - Name the torus ring child group to allow rotating it in `update()`.
- In [hud.ts](file:///C:/Users/pietr/progetti/mondo/src/ui/hud.ts):
  - Add a buffs tracker element (e.g., at the top-right / bottom-right HUD area) that aggregates active timed buffs (Adrenaline, Overclock, and Shield) and prints their remaining seconds in real-time.
- In [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts):
  - Register `'shield'` in `powerUpKinds`.
  - In the update loop, call `hud.updateBuffs(powerUpRuntime.speedBoostRemaining, powerUpRuntime.damageBoostRemaining, powerUpRuntime.shieldRemaining)`.

### 3.4 player-movement
- Update `Player.ts`'s update loop to trigger respawn when `input.state.reload` (KeyR) is pressed in addition to `input.state.interact` (KeyE).
- In [input.ts](file:///C:/Users/pietr/progetti/mondo/src/controls/input.ts), implement a `reset()` method in `InputManager` that resets all boolean key states (`forward`, `backward`, `left`, `right`, `jump`, `interact`, `reload`, `attack`, `run`) and mouse states to false or zero.
- Call `input.reset()` in `Player.ts` when player dies (in `die()`) and when player respawns (in `respawn()`) to clear stuck keystates.
- In `Player.ts`'s `respawn()` method, call `document.body.requestPointerLock()` to lock the cursor back to the canvas.

### 3.5 rendering-shadows
- Ensure all meshes making up the `Pyramid` and `Lighthouse` groups in [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts) have `castShadow = true` and `receiveShadow = true` set on construction.
- Traversal logic in [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts) will also be run on the structure groups to guarantee casting/receiving shadows are enabled.

### 3.6 monster-spawning
- In [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts):
  - Add `'golem'` to `MonsterVariant` type.
  - Define golem profile: `scale: 1.6`, `hp: 150`, `speed: 1.5`, `bodyColor: 0x607D8B` (slate grey), `eyeColor: 0x00E5FF` (glowing cyan).
  - Update `chooseMonsterVariant()` signature and implementation to optionally receive `BiomeMap` and select `'golem'` if the spawn position resolves to `MOUNTAIN` or `DESERT` biomes.
- In [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts):
  - Add specific body modifications for the golem variant: attach large stone shoulder/fist meshes (slate grey boxes) to distinguish its silhouette.
  - In `getAttackParams()`, return golem values: `speed: 15`, `damage: 30`, `color: 0xff0000` (red projectile), `size: 0.45` (giant), `cooldown: 3.0`.
- In [EnemyProjectile.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/EnemyProjectile.ts):
  - Fix the projectile color bug by cloning the material and properly calling `material.color.setHex(options?.color)` inside the `spawn()` method, instead of discarding the projectile options color parameter.

### 3.7 structure-generation
- In [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts):
  - **House**: Add dark slate stone box base of size `3.1 x 4 x 3.1` positioned at `y = -2`.
  - **Tower**: Add dark slate stone cylindrical base of radius `1.9` and height `4` positioned at `y = -2`.
  - **Castle**: Add dark slate stone base slab of size `15 x 4 x 15` positioned at `y = -2`.
  - **Ruin**: Add dark slate stone base block of size `3.1 x 4 x 0.6` at `y = -2` directly below the standing wall.
- Modify the minimum Y boundary of AABB colliders for `House`, `Tower`, `Castle`, and `Ruin` structures to `-4` to align with the bottom of the new foundations.

---

## 4. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Pointer lock requests blocked on respawn** | Medium | Medium | Ensure `requestPointerLock()` is only invoked as a direct result of user interaction events (e.g., within the keyboard handler loop for KeyR/KeyE respawn). |
| **Visual clipping on steep slopes** | Low | Low | Foundations are extended to 4 meters, which covers ordinary terrain variation. If slopes exceed 4m, additional foundation depth or terracing can be added. |
| **Projectile material cloning overhead** | Low | Low | Projectile count is constrained (usually < 20 active). Cloning materials is highly optimized in WebGL/Three.js, but if performance issues occur, a material pool can be implemented. |
| **Golem variant spawning in other biomes** | Low | Low | Ensure the biome resolver checks the exact heightmap and moisture noise ranges so that `golem` is correctly restricted to Mountain and Desert. |

---

## 5. Rollback Plan
If any changes introduce severe performance issues or stability issues:
1. **Structures Foundation**: Revert the additions of base meshes in [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts) and restore AABB colliders' min Y bounds to `0`.
2. **New Structures (Pyramid/Lighthouse)**: Disable pyramid and lighthouse generation in [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts) or return empty THREE.Groups from the generator functions.
3. **Shield Power-Up**: Revert `PowerUpKind` modifications and fallback to default effects.
4. **Monster Spawning (Golem)**: Revert golem variant parameters and fallback to choosing from only scout, brute, and stalker variants.
5. **Key Controls**: Revert `InputManager.reset()` calls on player respawn and restore the original `KeyE`-only check.

---

## 6. Verification Plan
- **Unit / Integration Tests**:
  - In [input.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/input.test.ts), add tests checking `InputManager.reset()` properly clears all tracked keys.
  - In [player.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/player.test.ts), add tests verifying player invulnerability blocks `takeDamage()` execution and that respawn state resets correctly.
  - In [monsterVariant.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/monsterVariant.test.ts), add tests verifying Golem profile settings (HP, speed, etc.) and check that biome-restricted spawn selection works.
  - In [powerUpEffects.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/powerUpEffects.test.ts), verify that applying the `'shield'` power-up sets remaining time to 8 seconds, and ticks down correctly.
- **E2E / Manual Tests**:
  - Run the Vitest unit tests suite with `npx vitest run`.
  - Compile the code using TypeScript compiler `npx tsc --noEmit` to ensure type correctness.
  - Manual gameplay testing: spawn inside a desert, check that the pyramid generates correctly and has solid collision bounds down to the slope; get hit by a golem projectile to test its damage; collect a shield power-up to confirm invulnerability and HUD timer count down.
