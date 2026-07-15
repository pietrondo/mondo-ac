# Exploration: Gameplay Polish and Aesthetics

This document explores how to implement gameplay polish, feedback loops, and visual enhancements for the player interaction, enemy designs, weapons feedback, and playability indicators.

---

### Current State
1. **Vehicle Entry/Exit**: Boarding and exiting is handled in `src/main.ts` by checking the distance between the player and all vehicles (Hovercar, Spaceship). When within range, pressing `KeyE` toggles active vehicle status. There is currently no UI prompt notifying the player that a vehicle can be driven or how to exit.
2. **Enemy Meshes**: Monsters in `src/entities/Monster.ts` are composed of simple primitive geometries (cubes, cylinders, spheres) colored statically via variant profiles in `src/world/monsterVariant.ts`. They lack advanced visual accents like emissive glow, articulated weapons, armor plating, moving propellers, or multiple spider-like eyes.
3. **Weapon Models**: Handled in `src/entities/WeaponView.ts`. Models are simple assemblies of solid boxes and cylinders. Recoil is purely translation-based (moves backward along the Z axis). Muzzle flash is a simple scaling cylinder. There is no shell ejection or pitch/yaw-based camera or weapon recoil rotation.
4. **Hit Particles & Health Bars**: Weapon impact calculations are resolved in `src/main.ts` and `src/combat/rifleHit.ts`. However, there are no visual feedback particles (blood sprays for monsters, metal sparks for environment) on impact. Monsters do not display health bars, making it difficult for the player to know how close they are to defeating an enemy.

---

### Affected Areas
- [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) — Coordinate vehicle state check, trigger UI prompt updates, invoke hit particle systems, and link new inputs.
- [src/ui/hud.ts](file:///C:/Users/pietr/progetti/mondo/src/ui/hud.ts) — Add interactive vehicle prompt element, style it, and add display control API methods.
- [src/entities/Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) — Upgrade mesh constructor for variants (armor, spikes, glowing runes, spider-eye clusters, drone wings/propellers) and add billboard 3D health bars above heads.
- [src/entities/WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts) — Refine model details (stocks, sights, glows), add rotation-based recoil pitch/yaw, and simulate ejected shell physics.
- [src/combat/particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) *(New File)* — Manage a pool of lightweight gravity-bound particle meshes for blood splatters and spark effects.

---

### Approaches

#### 1. Vehicle Entry/Exit Interactive HUD Prompt
*   **Approach A: Centered Floating HTML Banner (Recommended)**  
    Add a styled HTML element in [hud.ts](file:///C:/Users/pietr/progetti/mondo/src/ui/hud.ts) that is shown or hidden depending on distance checks run in the main update loop.
    *   *Pros:* Easy to implement, beautiful CSS styling (glows, borders, glassmorphism), doesn't require 3D spatial UI projection.
    *   *Cons:* Not positioned directly in the 3D world above the vehicle.
    *   *Effort:* Low.
*   **Approach B: 3D Spatial Canvas/Sprite Billboard**  
    Attach a 3D Sprite showing the "E" prompt above each vehicle.
    *   *Pros:* Feels integrated with the 3D game world.
    *   *Cons:* Harder to read from extreme angles or distances; more complex text-to-canvas rendering.
    *   *Effort:* Medium.

#### 2. Richer Enemy Mesh Details
*   **Approach A: Hierarchical Primitive Additions (Recommended)**  
    Modify the [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) constructor to append extra detailed geometries depending on the variant type:
    *   *Brute:* Add side spikes on shoulders, red emissive glowing lava cracks on body plates.
    *   *Stalker:* Make the crest emissive and add wing-like lateral blades.
    *   *Golem:* Add bulky metallic shoulder armor plates and glowing runic panels.
    *   *Crawler:* Replace the 2 eyes with a cluster of 6-8 tiny glowing red eyes (spider configuration), and add spikes on its back carapace.
    *   *Drone:* Add aerodynamic thruster wings and a dual-blade propeller that spins in the update loop.
    *   *Pros:* Extremely high performance, matches the current art style, easy to animate (spinning drone propellers).
    *   *Cons:* Requires coding manual offsets for multiple shapes.
    *   *Effort:* Medium.

#### 3. Weapon Model Fidelity, Recoil, and Shell Ejection
*   **Approach A: Enhanced Hand-Crafted Models + Global Shell Particle Array (Recommended)**  
    Upgrades [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts):
    *   *Visuals:* Add a holographic sight (glowing green plane), a buttstock, and rail lines.
    *   *Recoil:* Implement vertical pitch rotation kick `rotation.x` + minor yaw rotation noise.
    *   *Shells:* On shoot, instantiate a brass-colored cylinder capsule in the global scene. Give it a physical velocity (up, right, back relative to camera direction) and simple bounce-physics against heightmap ground.
    *   *Pros:* Visual fidelity increases drastically; shell physics and camera/gun recoil feel highly visceral.
    *   *Cons:* Shell raycasts for ground collision must be kept lightweight to prevent lag.
    *   *Effort:* Medium.

#### 4. Hit Particles and Health Bars
*   **Approach A: Canvas Textures & 3D Sprite Billboard Health Bars + Individual Mesh Particles (Recommended)**  
    *   *Health Bars:* Attach a nested health bar group above the monster's head. Set its quaternion to copy the camera's orientation every frame to keep it facing the screen. Update the foreground scale factor based on HP percentage. Only show it once the monster has been damaged.
    *   *Hit Particles:* Maintain a list of active particle objects in a new file [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts). When a shot lands, spawn 6-10 small meshes. If hit object is a monster -> red blood particles. If environment/miss -> glowing orange sparks.
    *   *Pros:* Bilboarding is smooth and fast; particles look volumetric and scatter realistically.
    *   *Cons:* Needs clean integration with main game loop updates.
    *   *Effort:* Medium.

---

### Recommendation
Proceed with **Approach A** for all four areas. Hand-crafted primitive visual details match the stylized look of the game and can be implemented with high performant efficiency. Physical ejected shells and volumetric spark/blood particles will elevate the action gameplay feeling significantly, while billboard health bars provide immediate visual feedback.

---

### Risks
- **Performance overhead of particles and shells**: If the player shoots rapidly, spawning many individual meshes for shells and particles could cause garbage collection stutter or draw call spikes. *Mitigation:* Cap active particle counts (e.g. max 100 particles, max 20 shells) and reuse objects using basic object pools.
- **Weapon mesh layout alignment**: Adding extra components (sights, stock) to the weapon models might block the camera if offsets are incorrect. *Mitigation:* Tuning coordinate offsets carefully and testing rifle/shotgun views.

---

### Ready for Proposal
Yes
