## Exploration: Vehicle Indicators and Monster Glow

### Current State
- **Vehicle Rendering & Logic**: `Hovercar.ts` and `Spaceship.ts` subclass `Vehicle.ts`. Currently, vehicles are only updated when they are actively controlled by the player. There are no visual indicators showing where vehicles are parked or highlighting their locations from a distance.
- **Monster Visuals**: Monsters are spawned and updated in `Monster.ts`. While Golem chest runes (`0x00E5FF`) and Brute spikes exist as mesh groups, they lack dynamic aesthetic particle emissions.
- **Camera Recoil**: Camera screen-shake is triggered upon weapon fire in `main.ts` by setting `player.shakeIntensity`, which randomly translates the camera's position in 3D space during the update loop. There is no rotational kick (pitch/yaw recoil) representing weapon recoil.
- **Ambient Particles**: Weather/ambient particles (snow, sand, leaves) are only spawned for three biomes: `SNOW`, `DESERT`, and `FOREST`. Other biomes like `PLAINS` or `MOUNTAIN` do not emit any ambient effects.

### Affected Areas
- [Vehicle.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Vehicle.ts) — Add `indicator: THREE.Group` containing a floating neon cylinder and cone pointing down. Define `updateIndicator(time: number, isOccupied: boolean)` to handle rotation/bobbing and toggle visibility.
- [Hovercar.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Hovercar.ts) and [Spaceship.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Spaceship.ts) — Pass distinct colors (e.g., cyan `0x00FFCC` for Hovercar, magenta `0xFF00FF` for Spaceship) to the `super` constructor.
- [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) — Extend `Particle` type to support `'spark_cyan'` and `'spark_red'`. Adjust gravity and behaviors in `update()` so these spark variants float upwards/outwards slowly like glowing embers.
- [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) — Modify `update` signature to optionally accept `particlePool` and procedurally spawn cyan sparks from the Golem's chest core and red sparks from the Brute's spikes.
- [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) — Implement rotational recoil variables (`recoilPitch`, `recoilYaw`) that kick the camera back/upward and recover smoothly over time, adjusting camera look-at calculation.
- [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) — Update all vehicles' indicators every frame, pass `particlePool` to the weapons and monsters update loops, and add extra ambient particle configurations (e.g., green leaves or glowing spores in `PLAINS` biome).

### Approaches
1. **Direct Integration (Recommended)**
   - **Description**: Add the floating arrow group directly to the base `Vehicle` class, register cyan and red spark types in the existing `ParticlePool`, and track camera recoil directly inside `Player.ts`.
   - **Pros**: Reuses existing geometries/materials, zero dependency overhead, extremely simple, conforms perfectly to existing code patterns.
   - **Cons**: Modifies base class constructors.
   - **Effort**: Low

2. **Decoupled Manager and Custom Shader Materials**
   - **Description**: Implement a separate `VehicleIndicatorManager` class to overlay UI indicators in world space, and write custom GPU shader materials for glowing ember effects.
   - **Pros**: Highly customizable visuals, isolates indicator logic from core physics/entity classes.
   - **Cons**: Adds substantial complexity, increases compile/build overhead, and deviates from the existing flat-shaded aesthetic of the project.
   - **Effort**: High

### Recommendation
I recommend **Approach 1 (Direct Integration)**. The project already has simple, elegant patterns for floating and spinning elements (e.g., in `PowerUp.ts` and `Collectible.ts`), and extending the centralized `ParticlePool` ensures particle counts are capped correctly and recycled efficiently, avoiding performance degradation.

### Risks
- **Particle Pool Cap**: Spawning glowing embers every frame might hit the particle pool's max capacity (300). This will be mitigated by keeping the spawn rate low (probabilistic check like `Math.random() < 0.15` per frame).
- **Rotational Gimbal Lock / Camera Flipping**: Applying rotational recoil directly to camera pitch could theoretically cause clipping or screen flipping. This will be mitigated by strictly clamping the total pitch (base pitch + recoil pitch) to `[-Math.PI / 2 + 0.05, Math.PI / 2 - 0.05]`.

### Ready for Proposal
Yes
