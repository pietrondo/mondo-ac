# Specification: Rendering Shadows

## Description
This specification defines the shadow mapping setup, shadow camera tracking system, layer-based first-person player shadow rendering, and shadow configuration for game entities.

## Requirements
1. **Directional Light & Shadow Camera Setup**:
   - The primary directional light (sun) MUST cast shadows (`castShadow = true`).
   - The shadow map resolution MUST be set to at least 2048x2048 pixels for high resolution.
   - The shadow camera's orthographic frustum bounds MUST be sized tightly around the player (e.g., left/right/top/bottom between 30 and 100 units) to optimize shadow details.
   - A shadow bias MUST be applied to the light's shadow configuration to minimize shadow acne.
2. **Shadow Camera Follow Loop**:
   - In the animation/render loop, the position of the directional light and its shadow camera MUST follow the player's X and Z world positions, maintaining a constant offset.
3. **First-Person Layer-Based Shadows**:
   - The player's mesh MUST be set to `visible = true`.
   - The player's mesh and all its child meshes MUST be assigned to Layer 1.
   - The player's camera (first-person viewport) MUST remain configured to render only Layer 0. This ensures the player does not see their own head/body meshes clipping in their view.
   - The directional light's shadow camera MUST be configured to render Layer 0 and Layer 1. This ensures that the player's mesh casts a shadow in the depth map.
4. **Entity Shadow Configuration**:
   - The terrain mesh MUST be set to receive shadows (`receiveShadow = true`).
   - All structure meshes MUST traverse their children and set `castShadow = true` and `receiveShadow = true`.
   - All monster meshes MUST set `castShadow = true` and `receiveShadow = true`.
   - Decoration meshes or InstancedMeshes MUST set `castShadow = true` and `receiveShadow = true`.

## Scenarios

### Scenario 1: First-person camera does not clip player mesh but shadow is rendered
* **Given** a player entity with a body mesh and a first-person camera
* **When** the scene renders a frame
* **Then** the player camera (Layer 0) MUST NOT render the player's own mesh (Layer 1)
* **And** the directional light's shadow camera (Layers 0 & 1 enabled) MUST capture the player's mesh
* **And** the resulting shadow map MUST contain the player's shadow projected on the terrain

### Scenario 2: Shadow camera tracks player movement
* **Given** the player moves from coordinates (0, 0, 0) to (50, 0, 50)
* **When** the animation frame updates
* **Then** the directional light's target or position MUST be shifted on the X and Z axes to center the shadow camera's frustum at (50, 50)
* **And** terrain and entities around (50, 50) MUST continue to cast and receive high-resolution shadows

### Scenario 3: Entities cast and receive shadows
* **Given** the terrain, structures, monsters, and decoration meshes are loaded into the scene
* **When** shadows are rendered
* **Then** `receiveShadow` MUST be true on the terrain mesh
* **And** `castShadow` and `receiveShadow` MUST be true on monsters, structure meshes, and decoration meshes
