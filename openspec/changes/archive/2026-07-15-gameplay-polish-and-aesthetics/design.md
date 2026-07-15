# Technical Design: Gameplay Polish and Aesthetics

This document outlines the technical architecture and implementation details for gameplay polish, combat feedback, visual enhancements, and user interface improvements.

---

## Technical Approach

We will upgrade the weapon feedback loops, add a performant particle system for impact feedback, implement billboard health bars for monsters, and introduce contextual HUD prompts for vehicles. These changes will be integrated into the existing rendering and update loops.

---

## Architecture Decisions

### Decision: Rotational Recoil & Shell Ejection
- **Choice**: Implement pitch-kick rotation in [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts) and delegate shell physics simulation to the new particle module in [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts).
- **Alternatives**: Implement shell physics inside `WeaponView` itself.
- **Rationale**: Keeps `WeaponView` focused purely on rendering and animating the first-person weapon model. When a gun fires, `WeaponView` applies a momentary negative pitch rotation (`rotation.x`) to the weapon group, which smoothly decays back to base rotation using linear interpolation. Simultaneously, it triggers a call to `spawnShell()` in the particle manager, passing the world position and camera direction. The particle system spawns a brass-colored cylinder mesh with an ejection velocity vector (right/up/back relative to the weapon orientation) and simple gravity-bound bounce physics against the heightmap.

### Decision: Particle System Object Pooling
- **Choice**: Implement a lightweight object pool in [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) utilizing pre-allocated `THREE.Mesh` instances with shared geometry and materials.
- **Alternatives**: Dynamically instantiate and destroy `THREE.Mesh` objects on each bullet impact.
- **Rationale**: Dynamic creation causes garbage collection overhead and frame stutter during rapid firing. Pre-allocating a fixed pool of particles (e.g., 200 items) allows constant-time complexity recycling. On hit (resolved in `main.ts` and `rifleHit.ts`), the system will pull 6-10 particles from the pool. Red blood sphere meshes are spawned on monster hits, and orange spark box/sphere meshes on environment/structure hits. Particles are simulated with Euler integration (adding gravity to velocity) and fade out by decrementing scale/opacity before returning to the pool.

### Decision: Billboard Health Bars
- **Choice**: Construct a nested 3D health bar group inside [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) that copies the camera's orientation.
- **Alternatives**: Project monster 3D coordinates onto a 2D HTML overlay.
- **Rationale**: HTML projection becomes slow and jittery with many active monsters. A nested 3D group containing a background and foreground mesh is highly performant. In the monster's update loop, `healthBarGroup.quaternion.copy(camera.quaternion)` ensures it remains parallel to the screen. The foreground mesh's scale (`scale.x`) is set directly to the current HP ratio. The health bar starts invisible and becomes visible only after `hp < maxHp`.

### Decision: HUD Prompts
- **Choice**: Add an absolute-positioned styled overlay element to the HTML DOM in [hud.ts](file:///C:/Users/pietr/progetti/mondo/src/ui/hud.ts) and control it via distance checks in [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts).
- **Alternatives**: Create spatial 3D text floating above vehicles.
- **Rationale**: HTML and CSS allow easy glassmorphic styling, text shadow, and clean responsive layouts. In `main.ts`, if the player is driving (`player.activeVehicle !== null`), the prompt displays "Press E to exit". If walking, a 5-meter proximity check loops over all vehicles. If a vehicle is found, the HUD displays "Press E to board <VehicleName>" (e.g., Hovercar or Spaceship). If no vehicles are near, the prompt is hidden.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) | Create | Pool-managed particle meshes for sparks, blood, and physical ejected shells with gravity and bounce. |
| [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts) | Modify | Add pitch-kick recoil animation on fire; trigger shell ejection when shooting guns; add optical sights. |
| [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) | Modify | Add nested health bar group, update billboarding quaternion, scale foreground bar, handle variant-specific details. |
| [hud.ts](file:///C:/Users/pietr/progetti/mondo/src/ui/hud.ts) | Modify | Add HTML element and API controls for contextual vehicle prompts. |
| [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) | Modify | Perform vehicle distance checks to trigger HUD prompts; spawn hit particles on raycast impacts; update particle manager. |

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Particle Pool | Verify pool allocation, recycling behavior, and bounds capping in `particles.ts`. |
| Unit | Health Bar Scale | Verify foreground bar scale matches HP ratio accurately. |
| Manual | Recoil & Ejection | Confirm weapon pitch-kick behaves correctly and shells bounce realistically on ground. |
| Manual | Boarding Prompts | Approach Hovercar and Spaceship to confirm proximity message, and board to verify exit prompt. |
