## Exploration: New Enemies and Vehicles

### Current State

#### 1. Enemy Types and Spawning
- **Types**: There are currently four monster variants defined in [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts): `scout`, `brute`, `stalker`, and `golem`.
- **Properties**: Each variant has a distinct profile specifying scale, body dimensions, HP, movement speed, body color, and eye color.
- **Spawning Logic**: 
  - Candidates are generated in [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts) during feature placement with a 2% chance in dangerous biomes (`FOREST`, `DESERT`, and `MOUNTAIN`).
  - At startup in [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts), the nearest 8 candidates to the player's spawn point are selected using [selectMonsterSpawns](file:///C:/Users/pietr/progetti/mondo/src/world/spawnSelection.ts).
  - If no candidate spawn points are within 60 meters, the selection falls back to spawning 4 to 6 monsters in a circle of radius 24 around the player.
  - Spawning is static at startup/respawn. There is currently no active dynamic spawning/respawning of enemies as the player explores further out.

#### 2. Enemy Graphics/Geometries
- All enemies are procedurally generated in the [Monster](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) constructor using simple THREE.js CSG/primitive shapes:
  - **Body**: Standard `BoxGeometry` scaled based on variant.
  - **Eyes**: Two `SphereGeometry` meshes positioned on the head.
  - **Brute**: Adds two red blocky `BoxGeometry` shoulders.
  - **Stalker**: Adds three red `ConeGeometry` crests on the head.
  - **Golem**: Adds two dark grey `BoxGeometry` fists.
- Simple standard/basic materials with flat shading are used, colors are configured per profile.

#### 3. Player Movement Controls and Interception
- **Input Tracking**: [InputManager](file:///C:/Users/pietr/progetti/mondo/src/controls/input.ts) maps keyboard events (WASD, Space, Shift, E, R) to a central boolean `InputState` object and tracks pointer lock mouse movements (`mouseX`, `mouseY`).
- **Player Movement**: [Player](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) reads `InputState` in its `update` loop to calculate movement velocity, apply gravity, resolve AABB collisions against structures, resolve cylindrical collisions against decorations, clamp to world bounds, and position/orient the first-person camera.
- **Interception for Driving**: To support driving a vehicle, player keyboard inputs (WASD, Space, Shift) need to be forwarded to the vehicle instead of translating the player mesh. While driving, the player's collision volume must be disabled or tied to the vehicle, and the camera must follow the vehicle rather than the player's standalone walking coordinates.

### Affected Areas
- [src/entities/Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) — Add new enemy visual profiles, scaling, and custom attack/projectile behavior if we introduce new monster types.
- [src/world/monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts) — Add new variant profiles, speed/HP metrics, and update biome-based selection logic.
- [src/entities/Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) — Add driving state, disable default movement physics when driving, and allow locking the player mesh and camera to the vehicle.
- [src/controls/input.ts](file:///C:/Users/pietr/progetti/mondo/src/controls/input.ts) — Add any vehicle-specific inputs if necessary, or reuse existing bindings (e.g., WASD, Interact `KeyE`).
- [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) — Handle vehicle spawning, interaction checks (approaching and pressing `KeyE` to enter/exit), rendering, and dynamic spawning of enemies/vehicles.

### Approaches

1. **State-based Delegation in Player** — Add an `activeVehicle` field to the `Player` class. When driving is active, the `Player.update()` method bypasses walking physics and directly calls vehicle movement updates, passing the input state.
   - Pros: Low complexity, keeps camera updates in a single place.
   - Cons: Bloats the `Player` class with driving-specific logic.
   - Effort: Low

2. **Vehicle Entity with Control Handover (Recommended)** — Create a dedicated `Vehicle` entity class. In `main.ts`, keep track of the driving state. When driving, skip player movement calculations, update the active `Vehicle` with player inputs, and position the player mesh and camera relative to the vehicle mesh.
   - Pros: Highly modular, separates vehicle code from player code, supports multiple vehicle types easily.
   - Cons: Needs clear camera ownership handoff in the main game loop.
   - Effort: Medium

### Recommendation
We recommend **Approach 2 (Vehicle Entity with Control Handover)**. Implementing vehicles as independent entities keeps code modular, aligning with the current design of `Monster` and `NPC`. The player's interaction state in `main.ts` can toggle control flow between walking (updating the player) and driving (updating the vehicle and locking the player to it).

### Risks
- **Terrain Alignment & Physics**: Vehicle height/orientation alignment on steep heights of the heightmap needs to be smoothed to prevent jittering or flipping.
- **Collision Resolution**: A larger vehicle box could get trapped inside narrow structure walls or overlap with items.
- **Camera Rigging**: Transitioning between the standard first-person camera and a vehicle camera (which may benefit from a third-person view) must be seamless.

### Ready for Proposal
Yes
