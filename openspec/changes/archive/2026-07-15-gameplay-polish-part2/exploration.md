## Exploration: Gameplay Polish Part 2

### Current State
- **Monster taking damage**: In [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts), taking damage decreases HP, shifts health bar colors, and handles death, but there is no visual hit flash feedback on the 3D model itself.
- **Camera Screen Shake**: In [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts), the camera position is set to the player's position plus `cameraHeight`, and `lookAt` is called with target coordinates based on pitch and yaw. No visual recoil or camera screen shake is applied.
- **3D Holographic Ammo Display**: In [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts), weapons are constructed using primitive meshes (`THREE.Mesh` with `THREE.BoxGeometry` / `THREE.CylinderGeometry`). While there are simple holographic reticles, there is no dynamic ammo display attached to the gun models.

### Affected Areas
- [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) — Add properties for hit flash tracking (`hitFlashTimer`), dynamically cache original material emissive properties, and update material state within `update()`.
- [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) — Add properties for screen shake (`shakeIntensity`, `shakeDecayRate`, `shakeOffset`), implement a public `addShake(amount)` method, decay shake intensity, and offset the camera position by the shake vector in the first-person update section.
- [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts) — Build a shared dynamic 2D canvas context and `THREE.CanvasTexture` showing the magazine ammo count. Construct a small plane mesh with this texture and attach it to both the rifle and shotgun models. Update the texture on changes during `update(delta, ammoCount)`.
- [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) — Call `player.addShake` on weapon fire (`handleWeaponShot`) and pass the active weapon's magazine ammo to `weaponView.update(delta, ammo)`.

### Approaches

1. **Approach 1: Emissive material caching, translation-based lookAt recoil, and CanvasTexture displays (Recommended)**
   - **Monster Hit Flash**: When a monster takes damage, set a `hitFlashTimer = 0.15` (seconds). In `update()`, traverse the 3D meshes (skipping the health bar meshes) and temporarily set `emissive` to bright red/white and `emissiveIntensity = 3.0 * (timer / 0.15)`. Cache the original emissive color and intensity on the first hit to restore them when the timer expires.
   - **Camera Screen Shake**: Maintain `shakeIntensity` (clamped to a max limit like `1.5`) decaying at a linear rate. Update `shakeOffset` with random values scaled by the intensity. Add `shakeOffset` to `camera.position` while calling `lookAt` with the unshaken forward-facing coordinates, automatically creating translational and rotational camera recoil.
   - **Holographic Ammo Display**: Initialize a single `HTMLCanvasElement` (64x32 pixels) and render ammo text in neon cyan with a soft blur shadow. Apply this canvas as a `CanvasTexture` to a small `PlaneGeometry` attached to the upper rear receiver of the rifle and shotgun models, tilted to face the camera. Update the texture on value change.
   - **Pros**: Matches flat-shaded look; highly performant; automatically preserves variant-specific emissive details (e.g. crawler glowing eyes, golem runes); zero external asset dependency.
   - **Cons**: Requires manual tuning of local display coordinates on the gun models.
   - **Effort**: Medium

2. **Approach 2: Material swapping, Euler-based rotational shake, CSS3D text overlays**
   - **Monster Hit Flash**: Completely swap out meshes' materials with a static basic red/white material during the flash, then restore original material instances.
   - **Camera Screen Shake**: Offset camera pitch/yaw/roll directly using Euler/quaternion rotation additions.
   - **Holographic Ammo Display**: Use a `CSS3DRenderer` to position a standard DOM/HTML node near the 3D gun model.
   - **Pros**: HTML text is crisp and styled via CSS; material swapping avoids traversing mesh materials.
   - **Cons**: `CSS3DRenderer` runs in a separate overlay DOM context and does not play well with standard WebGL post-processing/bloom; material swapping is memory intensive and breaks flat-shading rendering consistency.
   - **Effort**: High

### Recommendation
**Approach 1** is recommended. Caching/Lerping emissive values preserves custom monster variant aesthetics, lookAt translation offset natively yields excellent visual recoil shake, and dynamic WebGL canvas textures keep a tiny memory/draw footprint.

### Risks
- **Clipping of Ammo Display**: If the holographic plane is not positioned precisely, it might clip through gun receivers or be obscured during heavy recoil animations. We should position it slightly floating (e.g., offset by `0.02` units) above the body.
- **Emissive Cache Collision**: If multiple monsters shared the same material instance, flashing one would flash all. Since each monster dynamically instantiates unique `MeshStandardMaterial` instances in its constructor, this is not an issue.

### Ready for Proposal
Yes
