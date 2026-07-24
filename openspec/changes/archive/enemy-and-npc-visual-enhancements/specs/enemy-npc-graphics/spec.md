# Specification: Enemy and NPC Visual Enhancements

## Description
Defines visual, shader, particle, and animation enhancements for enemy monsters, bosses, and non-player characters (NPCs). This includes procedural composite multi-primitive monster geometries, custom Fresnel rim lighting shaders for improved readability in dark biomes, motion particle trails for hovering and charging enemy variants, boss phase transition particle auras with procedural dissolve death disintegration, and NPC idle breathing, head orientation/nodding, and floating 3D status indicators.

## Requirements

### Requirement 1: Composite Enemy Geometries
1. The system MUST construct enemy monster meshes using composite multi-primitive geometries including `CapsuleGeometry`, `DodecahedronGeometry`, `IcosahedronGeometry`, `CylinderGeometry`, and `TorusGeometry` based on variant profiles defined in [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts).
2. The system MUST replace single `BoxGeometry` torsos in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) with grouped hierarchical assemblies containing distinct body torsos, head/core primitives, and articulated limb components.
3. Hovering variants (`drone`, `phantom`) MUST use streamlined central core geometries (`IcosahedronGeometry` or `DodecahedronGeometry`) surrounded by outer ring or wing primitives (`TorusGeometry` or `CylinderGeometry`).
4. Heavy charger and golem variants (`brute`, `golem`, `titan`) MUST feature layered armor plates and dense multi-segmented torso and leg primitives (`CapsuleGeometry` and `CylinderGeometry`).

#### Scenario 1.1: Constructing multi-primitive composite monster mesh
- **Given** a monster entity of any variant profile is instantiated in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts)
- **When** its mesh hierarchy is constructed
- **Then** the mesh MUST consist of a parent `Group` containing at least 2 distinct geometric sub-primitives (`Capsule`, `Dodecahedron`, `Icosahedron`, `Cylinder`, or `Torus`) instead of a single isolated `BoxGeometry` torso.

#### Scenario 1.2: Drone and Phantom core and ring assembly
- **Given** a `drone` or `phantom` monster variant is spawned
- **When** generating its visual geometry
- **Then** the mesh MUST feature an `IcosahedronGeometry` or `DodecahedronGeometry` core enclosed or flanked by `TorusGeometry` or `CylinderGeometry` outer primitives.

---

### Requirement 2: Fresnel Rim Lighting
1. Enemy materials created in [materials.ts](file:///C:/Users/pietr/progetti/mondo/src/render/materials.ts) or assigned in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) MUST apply a Fresnel rim lighting shader chunk to emit edge highlights against low-light and dark backgrounds.
2. The Fresnel calculation MUST compute intensity using `pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), uFresnelPower)` and add the rim glow color (`uFresnelColor * fresnel * uFresnelIntensity`) to the final fragment output.
3. The system MUST allow configurable uniforms for `uFresnelColor` (defaulting to variant emissive/eye color or bright accent color), `uFresnelPower` (range 2.0 to 5.0), and `uFresnelIntensity` (range 0.5 to 2.0).

#### Scenario 2.1: Applying Fresnel shader to enemy mesh
- **Given** an enemy monster material is initialized
- **When** rendered in a dark environment or against dark backgrounds
- **Then** the fragment shader MUST output an augmented rim highlight along mesh silhouette edges based on the angle between the surface normal and view direction vector.

#### Scenario 2.2: Dynamic Fresnel color matching variant profile
- **Given** a monster with a specific variant profile (e.g. `golem` with cyan eyes or `brute` with yellow eyes)
- **When** assigning materials
- **Then** the material's `uFresnelColor` uniform MUST be set to match or complement the variant's signature accent color.

---

### Requirement 3: Enemy Particle Trails
1. Hovering/flying variants (`drone`, `phantom`) MUST emit continuous particle trails from rear nozzle or aura anchor points while moving.
2. Charging variants (`brute`) MUST emit ground dust and spark/flame particle trails along their movement path when moving or performing charge attacks.
3. The system MUST emit `drone` thruster trails with cyan energy particles, `phantom` trails with purple spectral particles, and `brute` charge trails with dust and flame/spark particles via [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts).
4. Particle trail emission rates MUST be throttled per frame update to prevent particle pool exhaustion.

#### Scenario 3.1: Drone flying thruster trail emission
- **Given** a `drone` variant entity moving with velocity greater than zero
- **When** updating entity visuals per frame in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts)
- **Then** cyan energy thruster particles MUST be spawned at the rear exhaust position of the drone mesh.

#### Scenario 3.2: Phantom spectral aura trail emission
- **Given** a `phantom` variant entity moving through the world
- **When** updating entity visuals per frame
- **Then** purple spectral trail particles MUST be spawned behind the phantom entity position.

#### Scenario 3.3: Brute charge particle emission
- **Given** a `brute` variant entity moving towards a target or executing a charge attack
- **When** its velocity exceeds the movement threshold
- **Then** ground dust and spark particles MUST be spawned at the base of the brute entity mesh.

---

### Requirement 4: Boss Transition & Dissolve Death
1. `BossMonster` entities in [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts) MUST trigger dynamic radial particle aura bursts and shockwaves upon entering new combat phases (Phase 1 -> Phase 2, Phase 2 -> Phase 3).
2. Upon reaching 0 HP, `BossMonster` MUST NOT immediately vanish (`mesh.visible = false`); it MUST execute a 2.0-second procedural dissolve disintegration effect before destroying or removing the entity mesh.
3. During the 2.0-second dissolve sequence, the boss material MUST animate a dissolve threshold parameter from 0.0 (opaque) to 1.0 (fully dissolved/invisible) while spawning rising ember/disintegration particles from the mesh bounds.

#### Scenario 4.1: Boss phase transition particle aura
- **Given** a `BossMonster` reaches a phase transition health threshold
- **When** `onPhaseChange` is triggered
- **Then** an expanding radial particle aura shockwave MUST be emitted from the boss's center position.

#### Scenario 4.2: Procedural 2-second dissolve disintegration death
- **Given** a `BossMonster` health reaches 0 HP
- **When** death is triggered
- **Then** the boss mesh MUST remain visible for 2.0 seconds, gradually dissolving via a shader dissolve threshold from 0.0 to 1.0 while rising ember particles spawn around its volume, after which the mesh is removed from the scene.

---

### Requirement 5: NPC Life & Indicators
1. `NPC` entities in [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts) MUST perform continuous idle breathing micro-animations using vertical scale modulation (`scale.y` modulation with a sine wave function `sin(time * speed)`).
2. `NPC` entities MUST orient their head group (`headGroup`) toward the player position when the player enters interaction proximity, incorporating subtle pitch nodding during active dialogue.
3. `NPC` entities MUST display floating 3D status indicators assembled from 3D primitives (such as cylinder/cone + sphere shapes for `!` exclamation and `?` question mark indicators) positioned above the NPC head.
4. Floating 3D status indicators MUST perform continuous vertical bobbing (`y` position sine oscillation) and slow Y-axis rotation to maintain visual prominence.

#### Scenario 5.1: NPC idle breathing micro-animation
- **Given** an `NPC` entity active in the scene
- **When** time updates each frame
- **Then** the NPC body mesh vertical scale (`scale.y`) MUST oscillate subtly according to a sine function.

#### Scenario 5.2: NPC head rotation and nodding towards player
- **Given** a player character moves within interaction distance of an `NPC`
- **When** updating NPC frame logic
- **Then** the NPC's `headGroup` MUST smoothly rotate to face the player's position, and execute pitch nodding during active dialogue.

#### Scenario 5.3: Floating 3D status indicator bobbing and rotation
- **Given** an `NPC` with an active quest or interaction status
- **When** rendered in the 3D world
- **Then** a 3D primitive indicator (`!` or `?`) MUST float above the NPC's head, bobbing vertically and rotating continuously around its Y-axis.
