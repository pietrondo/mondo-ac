# Specification: Water Vertex Waves

## Description
This specification defines the implementation of a dynamic, animated water surface using vertex displacement in a subdivided plane geometry, alongside tone mapping updates for enhanced graphical fidelity.

## Requirements
1. **Water Mesh Subdivision**:
   - The water geometry MUST be initialized using a `THREE.PlaneGeometry` with at least 32 segments along the width and 32 segments along the height (creating a 32x32 vertex grid).
2. **Vertex Displacement Animation**:
   - In the rendering update loop, the Y coordinate of each vertex in the water plane geometry MUST be dynamically modified.
   - The displacement formula MUST use a combination of trigonometric functions (e.g., `Math.sin`, `Math.cos`) based on the vertex's local/world coordinates (X, Z) and elapsed game time.
   - After updating the vertex positions, the geometry's normals MUST be recomputed using `geometry.computeVertexNormals()` to update specular reflections and lighting.
   - The geometry's position attribute `needsUpdate` flag MUST be set to true.
3. **Tone Mapping**:
   - The WebGL renderer MUST have ACES Filmic Tone Mapping enabled (`renderer.toneMapping = THREE.ACESFilmicToneMapping`).

## Scenarios

### Scenario 1: Water plane is constructed with sufficient vertices
* **Given** the game scene is initializing
* **When** the water mesh is created
* **Then** the plane geometry MUST have 32 width segments and 32 height segments
* **And** the total vertex count of the water geometry MUST be exactly 1089 (33 * 33 vertices)

### Scenario 2: Water surface animates dynamically over time
* **Given** the game is running and rendering frames
* **When** a frame is updated with elapsed time `t`
* **Then** each vertex Y position in the water geometry MUST vary as a function of its X/Z coordinates and time `t`
* **And** `geometry.computeVertexNormals()` MUST be called during the frame update
* **And** the vertex positions MUST be uploaded to the GPU via setting `needsUpdate = true` on the position attribute

### Scenario 3: ACES Filmic Tone Mapping is enabled
* **Given** the WebGL renderer is created
* **When** renderer settings are initialized
* **Then** `renderer.toneMapping` MUST be set to `THREE.ACESFilmicToneMapping`
