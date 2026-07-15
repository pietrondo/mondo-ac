# Exploration: Realism and Aesthetics Upgrade

This document explores how to design and implement visual upgrades for structures, biome decorations, and monster feedback to make the world feel more dynamic, alive, and immersive.

---

### Current State
1. **Lighthouse Spotlight Beam**: In [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts), the lighthouse is built from static cylinder bands and a yellow glowing core sphere with a static yellow PointLight. It does not have a volumetric rotating spotlight beam.
2. **House Details**: In [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts), the house is simple: basic block walls, a brown cone roof, a door, and a foundation. It lacks a chimney, chimney particle emissions, and windows with glowing light.
3. **Castle and Tower Details**: In [structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts), castles and towers use flat cylinder and box geometries with basic flat-shaded gray colors. They have no stone texture depth (relief blocks) and no window openings or glowing window panels.
4. **Monster Animations and Steps**: In [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts), monsters have static body meshes that move without breathing/bobbing animations (drones float statically, land-based variants walk rigidly). Heavy variants (`brute` and `golem`) make no impact steps and produce no ground dust particles when walking.
5. **Biome Details**: In [decorations.ts](file:///C:/Users/pietr/progetti/mondo/src/world/decorations.ts), biome spawns are limited to standard green/brown trees, capsules for cacti, and grey icosahedrons for rocks. There are no tumbleweeds in the Desert, mushrooms in the Forest, or crystals in the Mountains.

---

### Affected Areas
- [src/world/structures.ts](file:///C:/Users/pietr/progetti/mondo/src/world/structures.ts) — Integrate spotlight beam group (cone) into `createLighthouse`, chimney box and emissive window plates into `createHouse`, stone relief blocks and arched glowing windows into `createTower`/`createCastle`.
- [src/combat/particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) — Add new `smoke` particle type with a positive gravity (rising) and sine-wave wind drift, and optimize capacity to handle smoke and step dust.
- [src/entities/Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) — Save reference to body mesh, apply sine-wave scaling for breathing/bobbing in `update()`, add walk-step tracker, and spawn dust particles from the pool for `brute`/`golem`.
- [src/world/decorations.ts](file:///C:/Users/pietr/progetti/mondo/src/world/decorations.ts) — Define mushroom cap/stem instanced meshes, glowing crystals instanced meshes, and rolling tumbleweeds instanced mesh with boundary-wrapped physics update loops.
- [src/main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) — Pass the particle pool to monsters in the update loop, cache lighthouses and chimneys on load, and tick their rotations/particles. Also, trigger the tumbleweed simulation update.

---

### Approaches

#### 1. Rotating Spotlight Beam & Light Source
*   **Approach A: Volumetric Additive Cone Mesh + Update Loop Rotation (Recommended)**  
    Create an open-ended cone geometry rotated along the horizontal plane. Offset the geometry so the tip of the cone is at the origin of a pivot group at `y = 13.2`. Use `AdditiveBlending`, transparent yellow, and disable `depthWrite` to simulate a volumetric light shaft. In the main update loop, increment Y-rotation of the pivot group.
    *   *Pros:* Visually striking, high performance, matches low-poly aesthetics, respects occlusion.
    *   *Cons:* Light shaft doesn't dynamically collide with solid obstacles (goes through walls, but matches stylized look).
    *   *Effort:* Low.
*   **Approach B: Dynamic SpotLight with Shadows**  
    Instead of a transparent cone mesh, use a `THREE.SpotLight` pointing outward and rotate it.
    *   *Pros:* Casts dynamic shadows, looks realistic when hitting walls.
    *   *Cons:* Pointing a shadow-casting spotlight into the distance is extremely heavy on performance; lacks the dense volumetric "fog beam" visual unless combined with expensive screen-space volumetric shaders.
    *   *Effort:* High.

#### 2. Chimney Smoke and Walk Dust Particles
*   **Approach A: Shared Rise/Drift Particle Pool System (Recommended)**  
    Add a `'smoke'` particle type to `ParticlePool` that has positive gravity (rises up) and slight horizontal noise/wind drift. For chimneys, cache their positions and spawn particles at intervals. For walking giants, spawn smoke particles at their feet when a walk step timer triggers.
    *   *Pros:* Extremely efficient (reuses existing particle system architecture), clean, customizable physics parameters.
    *   *Cons:* Needs minor pool size expansion to prevent starvation.
    *   *Effort:* Medium.
*   **Approach B: Individual Particle Emitters on Entities**  
    Create independent Three.js particle systems for every chimney and every heavy monster.
    *   *Pros:* High degree of configuration for each emitter.
    *   *Cons:* Too many draw calls, excessive memory usage, harder to manage lifetime/clean-up.
    *   *Effort:* High.

#### 3. Biome Details (Tumbleweeds, Mushrooms, Crystals)
*   **Approach A: Instanced Mesh and Custom Motion Updates (Recommended)**  
    Render all new biome details as instanced meshes to maintain high performance. For static items (mushrooms, crystals), place them in the grid loop. For tumbleweeds, keep a lightweight state array tracking positions, velocities, and rotation, and update their instance matrices in the loop so they roll over the desert ground.
    *   *Pros:* Extremely fast rendering, tumbleweeds move realistically along heightmap, caps memory.
    *   *Cons:* Requires custom matrix manipulation, but standard for low-poly games.
    *   *Effort:* Medium.
*   **Approach B: Individual Mesh Objects for Tumbleweeds**  
    Instantiate each tumbleweed as a separate `THREE.Mesh` in the scene.
    *   *Pros:* Simpler code for moving and rotating.
    *   *Cons:* Destroys performance in large desert areas (hundreds of individual draw calls).
    *   *Effort:* Low.

---

### Recommendation
Proceed with **Approach A** for all requirements. Volumetric transparent cones using additive blending perfectly simulate volumetric beams with minimal cost. A shared, lightweight particle pool is ideal for chimney smoke and ground dust. Instanced meshes with a custom update cycle for tumbleweeds provide high-performance organic environment dynamics.

---

### Risks
- **Instanced Matrix Syncing**: If matrix indices become misaligned, tumbleweeds may fly or spawn in wrong places. *Mitigation:* Maintain a strict one-to-one mapping between the state array index and the `InstancedMesh` instance index.
- **Draw Call Overhead**: Adding multiple new instanced meshes (mushrooms, crystals, tumbleweeds) adds new draw calls. *Mitigation:* Ensure each biome decoration type uses a single shared instanced mesh geometry and material for the whole world.

---

### Ready for Proposal
Yes
