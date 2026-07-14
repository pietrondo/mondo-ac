# Tasks Breakdown: improve-gameplay-and-graphics

## Review Workload Forecast
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1 (Foundation/Graphics setup)
- [x] Enable shadows on sun directional light and configure shadow properties in [src/render/scene.ts](file:///C:/Users/pietr/progetti/mondo/src/render/scene.ts). Set shadow map resolution to 2048x2048, narrow shadow frustum bounds (left/right/top/bottom: 60, far: 500), and shadow bias (-0.0005) to eliminate shadow acne.
- [x] Enable ACES Filmic Tone Mapping on renderer (`renderer.toneMapping = THREE.ACESFilmicToneMapping`) in [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts).
- [x] Configure shadow camera layers to enable Layer 1 using `sun.shadow.camera.layers.enable(1)` in [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts).
- [x] Enable shadow casting and receiving for static terrain: set `terrain.receiveShadow = true` in [src/world/terrain.ts](file:///C:/Users/pietr/progetti/mondo/src/world/terrain.ts).
- [x] Enable shadow casting and receiving for decorations: set `castShadow = true` and `receiveShadow = true` on the instanced meshes (trees, rocks, cacti) in [src/world/decorations.ts](file:///C:/Users/pietr/progetti/mondo/src/world/decorations.ts).
- [x] Enable shadow casting and receiving for structures: traverse the `structures` Group and set `castShadow = true` and `receiveShadow = true` on all nested child meshes in [src/world/features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts).
- [x] Enable shadow casting and receiving for NPCs: traverse the NPC mesh group and set `castShadow = true` and `receiveShadow = true` on all meshes in [src/entities/NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts).
- [x] Enable shadow casting and receiving for monsters: traverse the monster mesh group and set `castShadow = true` and `receiveShadow = true` on all meshes in [src/entities/Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts).
- [x] Configure Player visibility, layer and shadows in [src/entities/Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts): ensure `this.mesh.visible = true`, traverse child meshes to assign them to Layer 1 (`child.layers.set(1)`), and set castShadow / receiveShadow flags.
- [x] Dynamically position and target the sun directional light following the player's X/Z coordinates in [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts).
- [x] Initialize `THREE.PlaneGeometry` for water with 32 width and 32 height segments in [src/world/water.ts](file:///C:/Users/pietr/progetti/mondo/src/world/water.ts).
- [x] Implement CPU trigonometric wave vertex displacement (sine/cosine waves based on `gameTime`) for water geometry position attributes and call `geometry.computeVertexNormals()` in the rendering loop in [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts).

## Phase 2 (Physics & Collision implementation)
- [x] Replace structure collision resolution in [src/entities/Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) with sliding AABB bounding box collision physics:
  - Calculate overlap distance on X and Z axis for each intersecting structure bounding box (`StructureCollider` with type `'solid'`).
  - Reposition player along the axis of minimum overlap.
  - Set the corresponding player velocity component (either X or Z) to 0.
  - Update player's bounding box coordinates iteratively within the collision loop.

## Phase 3 (Error boundary & WebGL overlay implementation)
- [x] Implement startup WebGL presence check using `WebGLRenderingContext` in [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts).
- [x] Setup global `window.onerror` and `window.onunhandledrejection` boundaries in [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts).
- [x] Implement UI for graphical error overlay: halt game loops, release pointer lock, and display the blocking `#error-overlay` container with reload button `#error-reload-btn` in [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) / [index.html](file:///C:/Users/pietr/progetti/mondo/index.html).

## Phase 4 (Verification & Tests)
- [x] Create unit tests in [tests/unit/player.test.ts](file:///C:/Users/pietr/progetti/mondo/tests/unit/player.test.ts) to verify AABB collision sliding math, including minimum penetration axis push-out, unimpeded motion on non-colliding axis, and iterative sequential resolution for multiple colliders.
- [x] Create E2E/smoke tests in [tests/e2e/smoke.spec.ts](file:///C:/Users/pietr/progetti/mondo/tests/e2e/smoke.spec.ts) to verify that missing WebGL context displays the fallback overlay, and that unhandled runtime exceptions trigger the error overlay and freeze execution loops.

## Phase 5 (Documentation & Cleanup)
- [x] Clean up any legacy collision radial push-out code, comments, or unused logic in [src/entities/Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts).
- [x] Update project documentation or inline code comments explaining player first-person shadow layer isolation (Layer 1) and sliding collision math.
