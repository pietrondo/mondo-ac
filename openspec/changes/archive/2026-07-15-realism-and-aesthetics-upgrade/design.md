# Technical Design: Realism and Aesthetics Upgrade

## Technical Approach

We will upgrade the visual fidelity of structures, biomes, and enemies by introducing modular enhancements in geometry rendering, instancing, dynamic transforms, and custom particles.

1. **Volumetric Spotlight Beams**: Add an additive-blended cone mesh representing a volumetric spotlight beam to the lighthouse. Rotate the beam's pivot node in the main update loop.
2. **Cosmetic Building Details**:
   - Add a chimney box to houses and spawn rising translucent smoke particles.
   - Attach glowing yellow arched window plates to houses.
   - Decorate towers/castles with random stone relief accent boxes and glowing lit window panels.
3. **Biome Variations**:
   - Forest: Instanced meshes for low-poly mushrooms (stem + cap).
   - Mountain: Instanced meshes for cyan/blue glowing crystals.
   - Desert: Instanced meshes for rolling tumbleweeds. Update their positions and rotation matrices in the update loop using wind-velocity translation, heightmap clamping, and boundary wrapping.
4. **Monster Breathing & Footsteps**:
   - Apply a sine-wave scale and height bobbing directly to the monster meshes.
   - Track steps in the monster's update loop for heavy variants (`brute`, `golem`) and trigger dust particle puffs from the shared particle system on every footstep.

---

## Architecture Decisions

### Decision: Volumetric Spotlight Pivots
- **Choice**: Implement a pivot `THREE.Group` placed at the light source center (`y = 13.2`). The cone mesh is rotated by `Math.PI / 2` on the X-axis and translated along Z so its apex sits at `0,0,0` within the pivot.
- **Alternatives**: Rotate the cone geometry directly around its center, which makes horizontal sweeping complex.
- **Rationale**: Rotating the pivot node around the Y-axis makes the beam sweep horizontally across the terrain cleanly.

### Decision: Dynamic Instanced Meshes for Tumbleweeds
- **Choice**: Store tumbleweed state objects in `decorations.ts` (containing position, velocity, rotation, scale) and update the `InstancedMesh` matrix buffer every frame.
- **Alternatives**: Spawn distinct `THREE.Mesh` objects for tumbleweeds.
- **Rationale**: Instanced meshes minimize draw calls, keeping performance high even with dozens of active tumbleweeds rolling simultaneously.

### Decision: Breathing & Bobbing inside Monster Update Loop
- **Choice**: Use the global game time to calculate breathing scale and bobbing factors inside `Monster.update()`.
- **Rationale**: Keeps animation logic local to the monster entity and works seamlessly with heightmap clamping.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts) | Modify | Add chimney geometry and glowing window plates to houses. Generate random relief boxes and yellow window panels on towers/castles. Create lighthouse spotlight beam cone mesh and pivot group. |
| [decorations.ts](file:///C:/Users/pietr/progetti/mondo/src/world/decorations.ts) | Modify | Define geometries and instanced meshes for mushrooms and crystals. Manage tumbleweed physics, rolling rotations, heightmap alignment, and matrix updates. |
| [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) | Modify | Implement sine-wave scaling and position bobbing. Implement step tracking for heavy variants to emit footsteps. |
| [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) | Modify | Register `smoke` and `dust` particle types. Add custom rising physics for smoke and drift/fading physics for dust particles. |
| [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) | Modify | In the main loop: rotate lighthouse beam pivots, update tumbleweeds, spawn chimney smoke, and pass particles reference to monster step triggers. |

---

## Testing Strategy

### Unit Testing
- **Tumbleweed Wrap and Roll**: Validate that updating a tumbleweed's position beyond the boundaries correctly wraps it around the world and correctly updates its matrix.
- **Breathing Math**: Verify the sine-wave scale calculation results in realistic dimensions.

### Integration / Visual Testing
- **Spotlight Beam**: Verify visually that the lighthouse spotlight beam rotates around the lighthouse axis and blends additively with the sky.
- **Footstep Triggers**: Verify that dust particles spawn at the feet of `brute` and `golem` monsters when they move.
