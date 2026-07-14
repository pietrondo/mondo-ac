# Gameplay Changes and Additions Documentation

This document explains the technical design and implementation of the gameplay additions and fixes introduced in the `gameplay-fixes-and-additions` update.

---

## 1. Structures and Foundations

### Slope-Ready Foundations
To prevent structures from floating when spawned on slopes, all core structures (`House`, `Tower`, `Castle`, `Ruin`) have been extended:
* Appended dark slate stone foundations (`0x37474F`) spanning `y = -4` to `y = 0`.
* Adjusted bounding box colliders (`Box3`) to start at `y = -4` instead of `y = 0`.

### Pyramid Structure
Spawns in **Desert** biomes at a 2% rate.
* **Visuals**: Composed of tiered sandstone blocks (`0xDEC29B`) sized `8x2x8`, `6x2x6`, and `4x2x4` and topped with a golden cone (`0xFFD700`, size `2x2`).
* **Foundation**: Spans down to `y = -4`.
* **Colliders**: `Box3` collider covering `[-4, -4, -4]` to `[4, 8, 4]`.

### Lighthouse Structure
Spawns in **Coast** biomes at a 5% rate when elevation is greater than 5.
* **Visuals**: Features a dark stone cylindrical foundation, alternating red and white cylindrical bands (`y = 2` to `12`), a gallery deck, and a glass lantern room enclosing a glowing yellow core. It is topped with a black cone roof.
* **Light**: Integrates a functional yellow `PointLight` (color `0xFFFF00`, range `20`, intensity `3`) to illuminate the coast.
* **Colliders**: `Box3` collider covering `[-2, -4, -2]` to `[2, 12, 2]`.

---

## 2. Player Controls & Lifecycle

### Input Lock & Reset
* **Problem**: Previously, when the player died, key presses and mouse movements could carry over, leading to anomalous input locking upon respawn.
* **Solution**: Implemented `InputManager.reset()` which clears all keyboard keys and mouse movement offsets. Called on player death (`die()`) and player respawn (`respawn()`).

### Respawn Triggers & Cursor Lock
* **Respawn Keys**: Pressing either **KeyR** (Reload) or **KeyE** (Interact) while dead will now trigger a respawn.
* **Cursor Lock**: On respawning, the pointer lock is automatically re-requested (`document.body.requestPointerLock()`) to guarantee smooth resumption of gameplay.

---

## 3. Combat & Invulnerability

### Invulnerability Mechanics
* **Property**: Added `isInvulnerable: boolean` on `Player` and `isInvulnerable` on `PowerUpRecipient`.
* **Behavior**: When `isInvulnerable` is true, calling `takeDamage` will bypass the damage logic, preserving player health.

### Shield Power-Up
* **Visuals**: Features a glowing cyan icosahedron core surrounded by a rotating wireframe torus ring (`torusRing`).
* **Behavior**: Grants invulnerability and sets `shieldRemaining` to 8 seconds. This timer ticks down in the game loop and automatically resets `isInvulnerable = false` when it reaches 0.
* **HUD Integration**: Active timers for Adrenaline, Overclock, and Shield are displayed at `top: 60px` in the top-right corner, formatted to 1 decimal place.
