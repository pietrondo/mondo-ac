# Change Proposal: Gameplay and Graphics Improvements for Mondo

## 1. Executive Summary
This proposal outlines the implementation plan for improving graphics quality, enhancing gameplay collision detection, adding wave animation to the water surface, and building a robust error detection boundary in **Mondo**, a 3D web game built with Three.js, TypeScript, and Vite.
These enhancements will improve visual realism, eliminate player-teleportation collision bugs, and provide graceful crash recovery/feedback mechanisms.

## 2. Scope & Objectives
We will introduce two new capabilities and modify two existing capabilities:

### New Capabilities
- **`webgl-error-overlay`**: Add robust WebGL checks and error/exception boundaries that display a graphical overlay to the user on WebGL creation failures, pointer lock exceptions, or unhandled runtime crashes.
- **`water-vertex-waves`**: Implement dynamic vertex displacement on the subdivided water plane geometry to produce realistic wave animations.

### Modified Capabilities
- **`player-movement`**: Improve the structure collision resolution algorithm in [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) using Axis-Aligned Bounding Box (AABB) minimum penetration checks to replace the current buggy push-out calculation that causes teleportation.
- **`rendering-shadows`**: Enable high-resolution shadow mapping across all key entities including the player, terrain, monsters, decorations, and structures. We will use a layer-based rendering setup to allow the first-person player to cast a shadow without clipping issues.

---

## 3. High-Level Technical Approach

### 3.1 rendering-shadows
1. **Light & Camera Shadows Setup**: Update [scene.ts](file:///C:/Users/pietr/progetti/mondo/src/render/scene.ts) to define suitable frustum bounds and resolution for the DirectionalLight shadow map, mitigating shadow acne with a bias.
2. **Follow Logic**: Update the main animation loop in [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) to keep the sun shadow camera centered on the player as they move.
3. **Casting & Receiving Shadows**:
   - Enable `castShadow` and `receiveShadow` on the terrain mesh in [terrain.ts](file:///C:/Users/pietr/progetti/mondo/src/world/terrain.ts).
   - Traverse the `structures` Group in [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts) to set `castShadow` and `receiveShadow` on child meshes.
   - Traverse the monster mesh in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts).
   - Enable `castShadow` and `receiveShadow` on `InstancedMesh` instances in [decorations.ts](file:///C:/Users/pietr/progetti/mondo/src/world/decorations.ts).
4. **First-Person Player Shadows**:
   - Keep the player mesh visible, but assign it to **Layer 1**.
   - The primary camera stays on **Layer 0** (making the player invisible to their own first-person viewport to avoid camera clipping).
   - Enable **Layer 1** on the shadow camera so the shadow renderer generates the player's shadow.

### 3.2 player-movement (Collision Fix)
- Change collision resolution with structure bounding boxes in [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts).
- Calculate overlap depth on X and Z axes, pushing the player back on the axis of *minimum penetration*.
- Update `playerBox` inside the iteration loop to support sliding along walls and resolving corners correctly.

### 3.3 webgl-error-overlay
- Implement `isWebGLAvailable` check before initializing the Three.js renderer.
- Bind `window.onerror` and `window.onunhandledrejection` to catch unhandled runtime crashes.
- Listen for `pointerlockerror` on the document to handle cases where browser security blocks the pointer lock.
- Construct a visual overlay (using modern HTML/CSS styling) with a detailed error message and a "Reload/Retry" action button if initialization fails or an unhandled crash occurs.

### 3.4 water-vertex-waves
- Update the plane geometry in [water.ts](file:///C:/Users/pietr/progetti/mondo/src/world/water.ts) to use a 32x32 vertex grid instead of a simple 1x1 plane.
- In [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts)'s main update loop, mutate the geometry's vertices using a trigonometric wave formula based on spatial coordinates and time, then trigger `geometry.computeVertexNormals()` to update specular reflections dynamically.
- Enable ACES Filmic Tone Mapping on the WebGLRenderer in [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) to enhance color presentation.

---

## 4. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Shadow performance overhead** | High | Medium | Optimize shadow map resolution (2048x2048) and narrow the shadow camera frustum. Support disabling shadows via a configuration option or falling back to lower resolution if frame rates drop. |
| **Water wave performance cost** | Medium | Low | With a 32x32 vertex grid, vertex displacement is relatively cheap (1089 vertices). Ensure the normal updates are done efficiently using Three.js built-ins. |
| **First-person clipping / layers issue** | Medium | Low | Ensure player-held items (if any are added) or parts of the body are consistently added to Layer 1, and ensure the player camera remains on Layer 0 only. |
| **Tone mapping color shifts** | Low | Low | Fine-tune the tone mapping exposure parameter in [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) to avoid making dark areas pitch-black. |

---

## 5. Rollback Plan
If any changes introduce severe performance issues or stability issues:
1. **Shadows**: Disable `renderer.shadowMap.enabled` in `main.ts` or default back to shadow camera bounds of 0, keeping meshes' shadow flags off.
2. **Collision**: Revert [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts#L189-L205)'s collision iteration loop to the original push-out logic.
3. **WebGL Error Overlay**: Can be disabled by bypassing the error boundaries in `main.ts`.
4. **Water Waves**: Revert [water.ts](file:///C:/Users/pietr/progetti/mondo/src/world/water.ts) to a `1x1` plane geometry and skip vertex modification logic in [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts).

---

## 6. Verification Plan
- **Unit / Integration Tests**:
  - Add test suite in `tests/` verifying the collision resolution algorithm mathematically using mock player states and bounding boxes.
  - Add unit tests for `isWebGLAvailable` checking both successful contexts and mock failures.
- **E2E / Visual Tests**:
  - Run Playwright tests to ensure the application loads and check that pointer lock failures or mock WebGL failures display the overlay correctly.
  - Manual testing of gameplay controls, checking for shadows and smooth player movement when colliding with structures.
