# Design: Gameplay Polish Part 2

## Technical Approach

### Hit Flashing & Screen Shake
- **Monster Hit Flashing**: A `hitFlashTimer` (0.15s) is tracked in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts). When damaged, we set this timer. In the update loop, if the timer is active, we traverse all child meshes of the monster (excluding [healthBarGroup](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts#L188)). On the first hit, we cache the original `emissive` color and `emissiveIntensity` in a map. We then set the material's emissive color to red/white and scale `emissiveIntensity` to `3.0 * (hitFlashTimer / 0.15)`. When the timer expires, we restore cached values.
- **Camera Screen Shake**: A `shakeIntensity` (max 1.5) and decay rate are tracked in [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts). It is triggered on weapon fire in `main.ts` and on receiving projectile damage in `Player.ts`. The offset is computed as a random vector scaled by the current intensity: `offset = randomVector * shakeIntensity`. In `Player.ts`, we add this offset to the camera position *after* computing the stable position, but we keep the `lookAt` target position unshaken.

### Holographic Ammo Display
- We render the ammo display onto a small `PlaneGeometry` attached to the weapon models in [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts).
- **Coordinates & Positioning**:
  - **Rifle**: Place at `x = 0.0, y = 0.11, z = 0.15` (rear receiver, floating 0.02 units above the body box at `y = 0.09`) tilted 15 degrees back.
  - **Shotgun**: Place at `x = 0.0, y = 0.13, z = 0.1` (top of receiver, floating 0.02 units above the body box at `y = 0.11`) tilted 15 degrees back.
- **Rendering**: A shared offscreen `HTMLCanvasElement` (64x32px) and a `CanvasTexture` display `"active / reserve"` ammo (e.g. `30 / 90`) using a neon cyan fill and drop shadow on a transparent background. To optimize performance, the canvas context is redrawn and texture's `needsUpdate = true` is set only when the weapon's ammo values change.

### Environmental Clouds
- We introduce `CloudManager` in `src/world/clouds.ts` to manage 15-20 low-poly cloud clusters.
- **Spawning**: Each cluster is a `THREE.Group` composed of 3-5 overlapping white boxes with randomized scale (`10` to `25` units) and slight offsets. Spawned at a fixed altitude `y = 90`.
- **Drifting & Wrap-around**: Clouds move slowly along a drift vector (e.g. `(0.8, 0, 0.4)` m/s). The world boundary is calculated as `worldHalf = 128 * WORLD_SCALE` (1024m). If a cloud cluster's position exceeds `1024` on X or Z, its coordinate is wrapped around to `-1024` (and vice-versa) to maintain constant cloud density.

### Biome Weather Particles
- We extend [ParticlePool](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) to support ambient weather particle types: `'snow' \| 'sand' \| 'leaf'`.
- **Geometries & Materials**:
  - `snow`: white 0.05m cube, `MeshBasicMaterial`.
  - `sand`: sandy-yellow 0.04m cube, `MeshBasicMaterial`.
  - `leaf`: green/orange 0.06m flat box, `MeshBasicMaterial`.
- **Physics**: In `update()`, ambient particles bypass ground bounce. Snow drifts vertically down with a minor horizontal sine wave. Sand storm particles move at high horizontal velocity (wind). Leaves wobble side-to-side while falling slowly.
- **Spawning**: In `main.ts`, we check the player's biome using [BiomeMap.getBiome()](file:///C:/Users/pietr/progetti/mondo/src/world/biomeMap.ts#L31). If the biome matches `snow`/`mountain` (snow), `desert` (sand), or `forest` (leaves), we spawn particles in a cylinder or bounding volume centered around the player's position (e.g. range of 20-30m, above player eye level for falling particles) to ensure they are visible.

---

## Architecture Decisions

### Decision: Decoupled Screen Shake Offset
- **Choice**: Offset the camera position during the final frame rendering, rather than adding it to the player's mesh coordinates.
- **Rationale**: Keeps physics collision bounds unaffected by camera shake and avoids cumulative errors in movement.

### Decision: Optimized Canvas Texture Updates
- **Choice**: Only redraw the 2D canvas and set `needsUpdate = true` on weapon state changes (fire/reload/switch).
- **Rationale**: Avoids costly CPU-to-GPU texture uploads every frame.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/combat/particles.ts` | Modify | Support `'snow' \| 'sand' \| 'leaf'` particle types, materials, and specialized physics. |
| `src/entities/Player.ts` | Modify | Add `shakeIntensity` property, decay logic, and final camera positional offset during updates. |
| `src/entities/Monster.ts` | Modify | Add `hitFlashTimer`, material cache mapping, and recursive emissive updating in `update()`. |
| `src/entities/WeaponView.ts` | Modify | Instantiate canvas and texture, attach plane meshes to rifle and shotgun, and update texture on ammo changes. |
| `src/world/clouds.ts` | Create | Create `CloudManager` handling cloud groups spawning, drift velocity, and wrap-around. |
| `src/main.ts` | Modify | Spawn weather particles around player, update `CloudManager`, pass ammo count updates to `WeaponView`. |

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Monster Hit Flash | Validate `hitFlashTimer` decrement and emissive property restoration. |
| Unit | Camera Screen Shake | Verify `shakeIntensity` decay and that position offset matches expected bounds. |
| Unit | Cloud Wrap-around | Set a cloud's position beyond `1024` and confirm its position wraps to `-1024`. |
| Integration | Weather Spawning | Verify weather particles spawn around player position and map to the active biome. |
