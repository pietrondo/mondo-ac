# Build a Colorful Low-Poly FPS Survival Loop

Upgrade the current first-person exploration prototype into a focused survival experience with responsive jumping, automatic rifle combat, distributed hostile enemies, and a coherent colorful low-poly presentation.

## Player promise

Explore a bright procedural world, spot threats in the environment, and survive short tactical encounters using movement and a responsive automatic rifle.

## Core loop

1. Explore the procedural world.
2. Detect and engage distributed enemies.
3. Manage magazine ammunition and reload timing.
4. Avoid contact damage and reposition using movement and jumping.
5. Defeat enemies and continue exploring.

## Scope

| Area | Decision |
|------|----------|
| Perspective | First-person camera with a visible low-poly rifle. |
| Jumping | `Space` initiates a grounded jump; gravity returns the player to terrain height. No double jump. |
| Shooting | Hold the primary mouse button for automatic hitscan fire. |
| Ammunition | 30-round magazine, finite reserve ammunition, and manual reload with `R`. |
| Reloading | Reload has a short duration, cannot fire while active, and transfers only available reserve rounds. |
| Enemies | Hostile enemies remain distributed across the world rather than spawning in waves. |
| Enemy behavior | Enemies detect within a limited radius, pursue the player, attack at close range, take damage, and die. |
| Combat feedback | Muzzle flash, hit marker, enemy hit reaction, crosshair, ammunition HUD, and clear reload state. |
| Visual direction | Colorful low-poly forms, coherent palette, improved lighting, atmospheric fog, and readable silhouettes. |

## Architecture

Keep the implementation lightweight and avoid introducing a physics engine in this slice.

- `Player` owns grounded vertical movement, velocity, and jump state.
- `Input` exposes held fire, reload, and jump intent without implementing gameplay rules.
- A focused weapon component owns fire cadence, magazine state, reload timing, and hitscan queries.
- Existing monsters retain navigation and health ownership while exposing explicit damage and death behavior.
- The main loop updates input, player movement, weapon state, enemies, feedback, and rendering in a deterministic order.
- HUD components display health, ammunition, reload state, crosshair, and hit confirmation.

## Data flow

1. Input captures keyboard and pointer state.
2. Player update applies horizontal movement, jump velocity, gravity, and terrain grounding.
3. Weapon update checks fire cadence and reload state.
4. A valid shot raycasts from the camera center and resolves the nearest enemy hit.
5. Enemy health changes drive hit feedback and death state.
6. HUD and visual effects reflect authoritative gameplay state.

## Gameplay rules

- Jumping is allowed only while grounded.
- Holding fire respects a fixed rounds-per-minute interval.
- Firing is blocked with an empty magazine or during reload.
- Reloading stops when the magazine is full or reserve ammunition is exhausted.
- Enemy attacks retain a cooldown to prevent frame-rate-dependent damage.
- Dead enemies stop updating, attacking, and participating in raycast hits.
- Pointer-lock loss clears held firing state to prevent accidental continuous fire.

## Visual treatment

- Use flat-shaded or deliberately faceted geometry for the rifle, enemies, and environmental accents.
- Strengthen color separation between terrain, threats, interactables, and the weapon silhouette.
- Add distance fog that matches the scene palette rather than neutral gray.
- Improve key and ambient lighting without sacrificing enemy readability.
- Keep effects short and inexpensive: pooled muzzle flash, brief emissive hit flash, and compact hit marker animation.

## Testing and verification

- Unit-test jump gating, gravity/grounding, magazine depletion, fire cadence, reload transfer, and enemy damage/death.
- Run the complete unit suite and production build.
- Browser-test one real flow: start game, jump, fire, empty part of a magazine, reload, damage an enemy, and confirm no console errors.
- Confirm controls remain camera-relative at multiple yaw angles.

## Acceptance criteria

- [ ] `Space` produces one grounded jump and cannot trigger a double jump.
- [ ] Holding primary fire shoots automatically at a stable cadence.
- [ ] The rifle consumes magazine ammunition and reloads from a finite reserve with `R`.
- [ ] Shots aligned with an enemy apply damage and can kill it.
- [ ] Distributed enemies detect, pursue, and attack the player without wave spawning.
- [ ] HUD clearly communicates health, ammunition, reload state, aim, and confirmed hits.
- [ ] The world, weapon, enemies, lighting, and fog share a colorful low-poly visual language.
- [ ] Existing tests pass, new mechanics have focused tests, production build succeeds, and the browser console remains clean.

## Non-goals

- Physics-engine integration.
- Projectile ballistics, bullet drop, or penetration.
- Multiple weapons, weapon inventory, or upgrades.
- Enemy waves, bosses, loot economy, or persistent progression.
- Advanced building collision or navigation meshes.

