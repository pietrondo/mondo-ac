# Specification: Lighthouse Structure

## Description
This specification defines the rendering, lighting, collider geometry, and biome spawning behavior for the Lighthouse structure.

## Requirements
1. **Visual & Lighting Components**:
   - The Lighthouse structure MUST consist of a dark grey stone cylindrical base, an alternating red/white cylindrical tower (with 5 stacked segments), a flat gallery deck, a glass lantern room enclosing a glowing yellow sphere (emissive material), and a black cone roof.
   - The structure MUST include a foundation extending down to at least -4 meters below ground level (y = -4).
   - Inside the glass lantern room, the structure MUST contain a functional Three.js `PointLight` of yellow color.
   - All meshes within the Lighthouse group MUST have `castShadow = true` and `receiveShadow = true`.
2. **Collision Geometry**:
   - The Lighthouse structure MUST have a solid Axis-Aligned Bounding Box (AABB) collider.
   - The collider's local boundaries MUST be X/Z range `[-2, 2]` and Y range `[-4, 12]`.
   - The collider MUST be registered with the physics collision system.
3. **Generation & Spawning**:
   - The Lighthouse structure MUST spawn only in the `COAST` biome.
   - The spawn position MUST be close to shore level, satisfying the condition that elevation is greater than 5 and below the plains elevation threshold.
   - The spawning check MUST determine whether to generate a Lighthouse at valid shore/coast grid positions based on a configured spawn chance.

## Scenarios

### Scenario 1: Lighthouse spawning in the COAST biome
* **Given** a grid position with biome `COAST` and elevation 8 (above 5, below plains threshold)
* **When** terrain features are populated
* **Then** a Lighthouse structure MAY be spawned based on the coast spawn probability
* **And** a Lighthouse MUST NOT spawn at positions with elevation <= 5 or above the plains threshold, or in non-`COAST` biomes

### Scenario 2: Lighthouse light is active and colors are correct
* **Given** a Lighthouse structure is spawned in the world
* **When** the scene is updated and rendered
* **Then** the `PointLight` inside the lantern room MUST emit yellow light
* **And** the sphere core MUST have a yellow emissive material

### Scenario 3: Lighthouse collider bounds cover base and foundation
* **Given** a Lighthouse structure is instantiated
* **When** its collision boundaries are resolved
* **Then** the resulting AABB collider MUST have bounds covering `[-2, 2]` on X/Z and `[-4, 12]` on Y relative to the structure's origin
