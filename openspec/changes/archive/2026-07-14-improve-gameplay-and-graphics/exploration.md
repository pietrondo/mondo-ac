# Exploration Report: Gameplay and Graphics Improvements for Mondo

This document covers the exploration and technical analysis of the proposed graphics enhancements, collision system fixes, and error detection improvements in the **Mondo** 3D web game.

---

## 1. Graphics Enhancements & Shadows

### Current State
* The sun (DirectionalLight) is instantiated in [scene.ts](file:///C:/Users/pietr/progetti/mondo/src/render/scene.ts#L17-L25). Shadow maps are enabled on the renderer and the light (`sun.castShadow = true`), but the shadow camera bounds and resolution are not adjusted.
* The default shadow camera bounds of `DirectionalLight` are small (-5 to 5), leading to shadows not rendering outside this narrow box.
* The terrain, structures, monsters, decorations, and player do not have `castShadow` or `receiveShadow` properties set to `true`.
* The player mesh is hidden (`visible = false`) in [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts#L66), which prevents shadow generation for the player.

### Proposed Solution
1. **Enable Shadow Maps on Meshes**:
   * **Terrain Mesh** in [terrain.ts](file:///C:/Users/pietr/progetti/mondo/src/world/terrain.ts): Enable `castShadow` and `receiveShadow`.
   * **Structures** in [features.ts](file:///C:/Users/pietr/progetti/mondo/src/world/features.ts): Traverse the `structures` Group and enable `castShadow` and `receiveShadow` for all `THREE.Mesh` instances.
   * **Decorations** in [decorations.ts](file:///C:/Users/pietr/progetti/mondo/src/world/decorations.ts): Enable `castShadow` and `receiveShadow` on the `THREE.InstancedMesh` instances (InstancedMesh natively supports casting/receiving shadows).
   * **Monsters** in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts): Traverse `this.mesh` in the constructor and enable `castShadow` and `receiveShadow` on all children meshes.
   * **Player** in [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts): Enable `castShadow` and `receiveShadow` on player parts.
2. **First-Person Player Shadow via Layers**:
   * Set `this.mesh.visible = true` in the `Player` constructor.
   * Set the player mesh and all its children to Three.js **Layer 1** using `child.layers.set(1)` and `this.mesh.layers.set(1)`.
   * Keep the player perspective camera on **Layer 0** (default). This makes the player mesh invisible to the player's own view, preventing camera clipping inside the player's head.
   * Enable **Layer 1** on the shadow camera: `sun.shadow.camera.layers.enable(1)`. The shadow map renderer will process Layer 0 and Layer 1, allowing the player to cast a shadow on the ground.
3. **Shadow Camera Bounds & Follow Logic**:
   * Set up bounds and shadow map resolution in `scene.ts`:
     ```typescript
     sun.shadow.camera.left = -60;
     sun.shadow.camera.right = 60;
     sun.shadow.camera.top = 60;
     sun.shadow.camera.bottom = -60;
     sun.shadow.camera.near = 0.5;
     sun.shadow.camera.far = 500;
     sun.shadow.mapSize.width = 2048;
     sun.shadow.mapSize.height = 2048;
     sun.shadow.bias = -0.0005; // Mitigates shadow acne
     ```
   * Track the player's position in `main.ts`'s loop to keep the high-resolution shadow map centered near the player:
     ```typescript
     if (sun && player && player.isAlive()) {
       sun.position.copy(player.mesh.position).add(new THREE.Vector3(100, 200, 100));
       sun.target.position.copy(player.mesh.position);
       sun.target.updateMatrixWorld();
     }
     ```

---

## 2. Gameplay Collision Fix

### Current State
In [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts#L189-L205), collision resolution with structure bounding boxes is handled by pushing the player to the center of the box plus the player radius:
```typescript
const center = new THREE.Vector3();
collider.box.getCenter(center);
const dx = this.mesh.position.x - center.x;
const dz = this.mesh.position.z - center.z;
const dist = Math.sqrt(dx * dx + dz * dz);
if (dist > 0.001) {
  const pushX = (dx / dist) * this.playerRadius;
  const pushZ = (dz / dist) * this.playerRadius;
  this.mesh.position.x = center.x + pushX;
  this.mesh.position.z = center.z + pushZ;
}
```
This causes the player to teleport directly inside the structure (very close to its center) whenever they touch its outer bounds.

### Proposed Solution
Use standard axis-aligned bounding box (AABB) intersection depth resolution:
1. Determine overlap/penetration along the X and Z axes.
2. Resolve collision along the axis of minimum penetration.
3. Update `playerBox` inside the loop to support sliding along walls and resolving corners without teleportation.

```typescript
for (const collider of this.structureColliders) {
  if (playerBox.intersectsBox(collider.box)) {
    const overlapX = Math.min(playerBox.max.x, collider.box.max.x) - Math.max(playerBox.min.x, collider.box.min.x);
    const overlapZ = Math.min(playerBox.max.z, collider.box.max.z) - Math.max(playerBox.min.z, collider.box.min.z);

    if (overlapX > 0 && overlapZ > 0) {
      if (overlapX < overlapZ) {
        // Resolve along X
        if (this.mesh.position.x > (collider.box.min.x + collider.box.max.x) / 2) {
          this.mesh.position.x += overlapX;
        } else {
          this.mesh.position.x -= overlapX;
        }
      } else {
        // Resolve along Z
        if (this.mesh.position.z > (collider.box.min.z + collider.box.max.z) / 2) {
          this.mesh.position.z += overlapZ;
        } else {
          this.mesh.position.z -= overlapZ;
        }
      }
      
      // Update playerBox for subsequent checks
      playerBox.min.x = this.mesh.position.x - this.playerRadius;
      playerBox.max.x = this.mesh.position.x + this.playerRadius;
      playerBox.min.z = this.mesh.position.z - this.playerRadius;
      playerBox.max.z = this.mesh.position.z + this.playerRadius;
    }
  }
}
```

---

## 3. Error Detection & Boundaries

### Current State
* The game lacks runtime error logging overlays. If WebGL creation fails, the application crashes silently, leaving a black screen or an empty container.
* Pointer lock failures (e.g., when the user hasn't clicked the page) throw unhandled exceptions or fail without giving feedback.

### Proposed Solution
1. **WebGL Compatibility Check**:
   Create a utility method to check if WebGL is supported by the browser:
   ```typescript
   export function isWebGLAvailable(): boolean {
     try {
       const canvas = document.createElement('canvas');
       return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
     } catch (e) {
       return false;
     }
   }
   ```
2. **Error Boundary Overlay**:
   Implement a clean visual overlay that reports initialization and runtime crashes with a retry/reload button.
3. **Pointer Lock Error Handler**:
   Listen to `pointerlockerror` on the document to log/handle cases where browser security blocks the pointer lock, updating the UI accordingly.
4. **Unhandled Runtime Listeners**:
   Set up `error` and `unhandledrejection` handlers on `window` to capture unexpected game state crashes and present the overlay.

---

## 4. Minor Graphic Tweaks

1. **Water Wave Animation**:
   * Subdivide the water plane in [water.ts](file:///C:/Users/pietr/progetti/mondo/src/world/water.ts) to a `32x32` grid:
     ```typescript
     const geometry = new THREE.PlaneGeometry(
       WORLD_SIZE * WORLD_SCALE * 1.5,
       WORLD_SIZE * WORLD_SCALE * 1.5,
       32,
       32
     );
     ```
   * In `main.ts`'s animation loop, update the vertical height (`y` coordinate) of each vertex using a sine-cosine wave formula based on time and position, then recompute normals to animate reflections.
2. **Color Grading**:
   * Enable ACES Filmic Tone Mapping on the renderer in `main.ts`:
     ```typescript
     renderer.toneMapping = THREE.ACESFilmicToneMapping;
     renderer.toneMappingExposure = 1.0;
     ```
     This maps HDR colors back to SDR monitors, enhancing color contrast, saturation, and highlight roll-off.
