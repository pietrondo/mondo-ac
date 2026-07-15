## Review Workload Forecast
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phase 1: Infrastructure & Vehicle Classes
- [x] 1.1 Create `src/entities/Vehicle.ts` abstract class defining positions, mesh, bounds, speed, and KeyE boarding logic.
- [x] 1.2 Create `src/entities/Hovercar.ts` extending `Vehicle`, implementing WASD steering and heightmap alignment.
- [x] 1.3 Create `src/entities/Spaceship.ts` extending `Vehicle`, implementing 3D elevation, pitch, roll, and flying traversal.

## Phase 2: Player & Controls Integration
- [x] 2.1 Modify `src/entities/Player.ts` to support activeVehicle state, disable walking physics/velocity while driving, and bind camera.
- [x] 2.2 Modify `src/main.ts` to spawn vehicles, track boarding distance, intercept player WASD input for active vehicles.

## Phase 3: Monster Visuals & New Variants
- [x] 3.1 Modify `src/world/monsterVariant.ts` to register `crawler` (scale 0.8, hp 50, speed 4.0, red body) and `drone` (scale 0.6, hp 40, speed 3.0, cyan body).
- [x] 3.2 Modify `src/entities/Monster.ts` constructor to render 6 cylinders for crawler legs and a hovering ring for the drone.
- [x] 3.3 Modify `src/entities/Monster.ts` update to make drone hover 3m above heightmap.

## Phase 4: Testing & Verification
- [x] 4.1 Write `tests/unit/vehicle.test.ts` to verify Hovercar WASD steering and Spaceship elevation updates.
- [x] 4.2 Verify crawler leg generation and drone hover update loops in tests.
