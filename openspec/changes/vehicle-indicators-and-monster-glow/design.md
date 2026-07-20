# Technical Design: Vehicle Indicators, Monster Glow, Camera Recoil & Weather

## Technical Approach

### 1. Floating 3D Neon Arrow Indicator
To guide the player to vehicles, we will implement a spinning, bobbing 3D neon arrow placed 3.5 units directly above each vehicle's mesh.
* **Mesh Construction**: Inside [Vehicle.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Vehicle.ts), we will construct a `THREE.Group` indicator. It will consist of a cylinder stem (`CylinderGeometry`) positioned at `y = 0.3` and a cone pointer (`ConeGeometry`) positioned at `y = 0` rotated 180 degrees ($ \pi $ radians) around the X-axis so it points downwards.
* **Material**: We will style the arrow with a bright, emissive material (`MeshBasicMaterial` with color `0x00ffcc`).
* **Animation & Visibility**: In the main update loop of [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts), we will animate the arrow's rotation (`rotation.y += delta * 2`) and vertical oscillation (`position.y = 3.5 + Math.sin(gameTime * 4) * 0.25`). The arrow will be hidden when the player is active inside the vehicle (`visible = !isDriving`).

### 2. Glowing Embers for Monsters
We will introduce glowing particle embers that drift slowly upward and outward from monsters to emphasize their supernatural variants.
* **Particle Additions**: In [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts), we will add `spark_cyan` and `spark_red` particle types using a tiny box geometry and basic colored materials (`0x00ffff` and `0xff3333`).
* **Embers Physics**: In the physics update loop, cyan and red sparks will use a positive gravity parameter (e.g., `pGravity = 0.6`) to float upward, with a random horizontal sine-wave drift to spread outward.
* **Monster Integration**: In [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts), the `update` method will accept the `ParticlePool`. Using a frame-rate-independent probability (`Math.random() < delta * 4`), monsters will spawn embers. Red variants (`brute`, `crawler`) will emit red embers, while other variants will emit cyan embers.

### 3. Camera Recoil Decay
To improve weapon feel, we will add procedural recoil that decays back to center.
* **Player State**: In [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts), we will introduce `recoilPitch` and `recoilYaw` instance fields.
* **Recoil Kinematics**: When a firearm is successfully discharged in `handleWeaponShot` in [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts), we will increment `player.recoilPitch` (e.g. `0.05` for rifle, `0.12` for shotgun) and add a randomized horizontal kick to `player.recoilYaw`.
* **Interpolation & Clamping**: In `Player.update()`, both recoil offsets will lerp-decay to zero: `this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, delta * 12)`. The final look direction vector will use the combined angles (`pitch + recoilPitch` and `yaw + recoilYaw`). The total pitch is clamped to $ [-\pi/2 + 0.1, \pi/2 - 0.1] $ to prevent flipping.

### 4. Plains Biome Weather Spores
* **Weather Map**: In [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts), we will extend the active weather particle check to map `BiomeType.PLAINS` to the `'leaf'` particle type. This spawns green leaves/spores floating around the player.

---

## Architecture Decisions

### Decision: Decoupled Recoil Offsets
* **Choice**: Apply recoil as temporary additive offsets (`recoilPitch`/`recoilYaw`) that decay to zero.
* **Alternative**: Directly rotate the player's base `pitch` and `yaw` coordinates.
* **Rationale**: Directly altering base rotation coordinates makes it difficult to return precisely to the initial target crosshair position. Decoupled offsets ensure the camera automatically returns to the starting aim point after firing.

---

## File Changes

| File | Action | Description |
|---|---|---|
| [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) | Modify | Define `spark_cyan` and `spark_red` geometries/materials. Add upward float physics to their updates. |
| [Vehicle.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Vehicle.ts) | Modify | Define `indicatorArrow: THREE.Group` built from a cylinder and cone. Attach it to `this.mesh`. |
| [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) | Modify | Add `recoilPitch` and `recoilYaw`. Decay them via lerp, clamp combined pitch, and apply to `camera.lookAt`. |
| [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) | Modify | Accept `ParticlePool` in `update`. Probabilistically spawn `spark_red` / `spark_cyan` based on variant. |
| [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) | Modify | Pass `particlePool` to monsters. Update/render arrow indicators. Kick recoil on fire. Add plains leaf weather. |

---

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Manual | 3D Neon Arrow | Verify visual placement, orientation, bobbing/spinning, and hiding behavior when boarding. |
| Manual | Embers & Weather | Verify that cyan/red sparks drift upward from monsters and green leaves fall in plains biomes. |
| Manual | Camera Recoil | Confirm camera kicks back/up on firing and decays smoothly back to the original aim angle. |
