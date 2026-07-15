# Tasks: Gameplay Polish Part 2

## Review Workload Forecast
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phase 1: Weather Particles & Player Screen Shake
- [x] 1.1 Modify [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) to support weather particle types (snow, sand, leaves) with distinct color, speed, gravity, and wind-drift behaviors.
- [x] 1.2 Modify [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) to implement screen shake intensity, camera offset jittering, and decay over time.

## Phase 2: Holographic Ammo & Monster Hit Flash
- [x] 2.1 Modify [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts) to draw dynamic holographic ammunition counters onto a CanvasTexture.
- [x] 2.2 Modify [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) to implement an emissive hit flash effect upon taking damage, including material/color caching.

## Phase 3: Clouds & Weather Integration
- [x] 3.1 Create [clouds.ts](file:///C:/Users/pietr/progetti/mondo/src/world/clouds.ts) defining a CloudManager that spawns, updates, and wraps volumetric clouds around the play area bounds.
- [x] 3.2 Modify [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) to initialize/update CloudManager, trigger camera screen shake on weapon fire, and spawn ambient weather particles.

## Phase 4: Unit Testing
- [x] 4.1 Update [particles.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/particles.test.ts) to verify particle life cycle and wind/gravity physics calculations for weather variants.
- [x] 4.2 Update [player.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/player.test.ts) to verify camera shake trigger and decay rate logic.
- [x] 4.3 Create [clouds.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/clouds.test.ts) to verify cloud spawning, boundaries, and wrap-around movement.
