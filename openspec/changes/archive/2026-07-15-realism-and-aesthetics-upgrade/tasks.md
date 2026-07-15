# Tasks: Realism and Aesthetics Upgrade

## Review Workload Forecast
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phase 1: Volumetric Spotlight, Chimneys & Stone Reliefs
- [x] 1.1 Modify `src/world/structures.ts` to implement lighthouse volumetric spotlight beam (additive-blended cone mesh, pivot group).
- [x] 1.2 Modify `src/world/structures.ts` to add chimney boxes and yellow arched window plates to houses.
- [x] 1.3 Modify `src/world/structures.ts` to add random stone relief accent boxes and glowing lit window panels to towers and castles.

## Phase 2: Biome Instanced Details & Rolling Tumbleweeds
- [x] 2.1 Modify `src/world/decorations.ts` to register geometries and instanced meshes for mushrooms (cap + stem) and mountain crystals.
- [x] 2.2 Modify `src/world/decorations.ts` to implement desert tumbleweed physics, wind translation, heightmap clamping, boundary wrapping, and rotation updates.

## Phase 3: Monster Breathing & Footstep Dust
- [x] 3.1 Modify `src/entities/Monster.ts` update loop to calculate sine-wave scale and height bobbing based on game time.
- [x] 3.2 Modify `src/entities/Monster.ts` update loop to track footstep intervals for heavy variants (`brute`, `golem`) and invoke footstep callback.
- [x] 3.3 Modify `src/combat/particles.ts` to register `smoke` and `dust` particle types with rising, drift, and fading behaviors.

## Phase 4: Main Integration
- [x] 4.1 Modify `src/main.ts` to rotate the lighthouse spotlight beams around the Y-axis.
- [x] 4.2 Modify `src/main.ts` to tick tumbleweed state updates and refresh their instance matrices in the render loop.
- [x] 4.3 Modify `src/main.ts` to spawn rising chimney smoke particles and pass a particle spawn callback to monsters for footstep dust.

## Phase 5: Testing
- [x] 5.1 Create or update unit tests (e.g., `tests/unit/decorations.test.ts` or `tests/unit/clouds.test.ts`) to verify tumbleweed rolling velocity, boundary wrapping, and rotation updates.
- [x] 5.2 Compile successfully and run tests to ensure all visual and logic updates pass verification.
