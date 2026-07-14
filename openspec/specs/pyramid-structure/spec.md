# Specification: Pyramid Structure

## Description
This specification defines the rendering, collider geometry, and biome spawning behavior for the Pyramid structure.

## Requirements
1. **Visual Representation**:
   - The Pyramid structure MUST be constructed using stepped sandstone layers and a golden cone peak.
   - The base layer MUST have dimensions 8x2x8.
   - The middle layer MUST have dimensions 6x2x6.
   - The top layer MUST have dimensions 4x2x4.
   - The golden cone peak MUST have dimensions 2x2.
   - The structure MUST include a sandstone foundation block extending down to at least -4 meters below ground level (y = -4).
   - All meshes within the Pyramid group MUST have `castShadow = true` and `receiveShadow = true`.
2. **Collision Geometry**:
   - The Pyramid structure MUST have a solid Axis-Aligned Bounding Box (AABB) collider.
   - The collider's local boundaries MUST be X/Z range `[-4, 4]` and Y range `[-4, 8]`.
   - The collider MUST be added to the physics collision system.
3. **Generation & Spawning**:
   - The Pyramid structure MUST spawn only in the `DESERT` biome.
   - The spawn rate for Pyramids in the `DESERT` biome SHOULD be approximately 2% when sampling grid positions.

## Scenarios

### Scenario 1: Pyramid generation is biome-restricted
* **Given** a grid position with biome set to `DESERT`
* **When** terrain features are populated
* **Then** a Pyramid structure MAY be spawned at that position with a 2% chance
* **And** a Pyramid structure MUST NOT spawn in any biome other than `DESERT`

### Scenario 2: Pyramid structure has correct collider bounds
* **Given** a Pyramid structure is instantiated
* **When** its collision boundaries are resolved
* **Then** the resulting AABB collider MUST have bounds covering `[-4, 4]` on X/Z and `[-4, 8]` on Y relative to the structure's origin

### Scenario 3: Pyramid meshes cast and receive shadows
* **Given** a Pyramid structure is spawned
* **When** shadows are rendered in the scene
* **Then** all meshes in the Pyramid group MUST cast shadows and receive shadows
