</sdd-design>
<Design: New Enemies and Vehicles>
## Technical Approach
Design a modular `Vehicle` base class representing driving states and steerable mechanics. We will use a control-handover model where `main.ts` intercepts player input when the player is inside a vehicle, updates the active vehicle, and positions the camera / player model relative to the vehicle's position. Implement new procedural leg meshes for the crawler monster and hovering physics for the drone.

## Architecture Decisions
### Decision: Vehicle Control Handover
- **Choice**: Handover input processing in `main.ts` from player controls to the active vehicle.
- **Alternatives**: Implement vehicle driving code inside the `Player` class itself.
- **Rationale**: Keeps player class and vehicle class completely separated and clean.

### Decision: Vehicle Terrain Alignment
- **Choice**: Use the `HeightMap` interpolation function (`heightMap.getInterpolated()`) to lock hovercars/spaceships to height limits and calculate pitch orientation.
- **Rationale**: Prevents clip-through-ground bugs.

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `src/entities/Vehicle.ts` | Create | Abstract class defining generic vehicle structure, enter/exit, and key bindings |
| `src/entities/Hovercar.ts` | Create | Subclass for hovercars (ground-restricted WASD traversal) |
| `src/entities/Spaceship.ts` | Create | Subclass for spaceships (3D elevation & flight traversal) |
| `src/entities/Player.ts` | Modify | Add `activeVehicle` field, getter/setter, disable default movement while driving |
| `src/entities/Monster.ts` | Modify | Update constructor to generate crawler articulated legs and drone floating body |
| `src/world/monsterVariant.ts` | Modify | Register `crawler` and `drone` variant specifications |
| `src/main.ts` | Modify | Spawn vehicles at startup, check for boarding distance and KeyE interaction |

## Testing Strategy
| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Vehicle classes | Instantiate Hovercar/Spaceship and verify coordinate updates on steer inputs |
| Unit | Monster variants | Verify crawler scale/HP and drone hovering target values |
</Design: New Enemies and Vehicles>
