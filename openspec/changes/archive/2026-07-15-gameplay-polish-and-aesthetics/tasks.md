## Review Workload Forecast
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phase 1: Infrastructure & Particle System
- [x] 1.1 Create `src/combat/particles.ts` with classes or functions to support a particle pool (`ParticlePool`) for sparks and blood particles.
- [x] 1.2 Implement Euler integration physics (adding gravity to velocity) and decay logic (opacity and size scaling) in the particle update loops.
- [x] 1.3 Add bouncing shell simulation matching ground contact heightmaps in `particles.ts`.

## Phase 2: HUD & Prompts
- [x] 2.1 Modify `src/ui/hud.ts` to support elements for displaying contextual vehicle interact prompts ("Press E to board" / "Press E to exit").
- [x] 2.2 Modify `src/main.ts` update loop to check proximity to vehicles and dynamically show/hide appropriate HUD prompt states.

## Phase 3: Monster Visuals, Health Bars & Hit Wiring
- [x] 3.1 Modify `src/entities/Monster.ts` to construct screen-facing health bar subgroups above monsters that scale according to remaining HP ratio.
- [x] 3.2 Add visual enhancements (such as emissive eyes, propellers, armor plates) to individual monster meshes depending on their variants.
- [x] 3.3 Modify `src/main.ts` weapon hit raycast handlers to pull and spawn impact particles (blood for monsters, sparks for environments) from the pool.

## Phase 4: Weapon Visuals & Recoil
- [x] 4.1 Modify `src/entities/WeaponView.ts` to add holographic optical sights and physical stocks to the weapon meshes.
- [x] 4.2 Modify firing handler in `WeaponView.ts` to trigger a momentary pitch rotation recoil that decays via linear interpolation.
- [x] 4.3 Update weapon firing in `WeaponView.ts` to trigger physical brass shell ejection spawning in `particles.ts`.

## Phase 5: Testing
- [x] 5.1 Create `tests/unit/particles.test.ts` to test particle pool allocation, recycling behavior, and maximum capacity caps.
- [x] 5.2 Verify project compilation and run the test suite to ensure all unit tests pass successfully.
