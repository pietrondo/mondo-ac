# Tasks: Enemy and NPC Visual Enhancements

- [x] **Phase 1: Shared Shader & Particle Infrastructure** (`materials.ts`, `particles.ts`)
  - [x] 1.1 Implement `createFresnelMaterial()` factory function in [materials.ts](file:///C:/Users/pietr/progetti/mondo/src/render/materials.ts) using `onBeforeCompile` to inject custom GLSL uniforms (`uFresnelColor`, `uFresnelPower`, `uFresnelIntensity`) and calculate silhouette rim lighting (`pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uFresnelPower)`).
  - [x] 1.2 Extend `Particle` type definition and `ParticlePool` class in [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) to support new particle types: `thruster`, `spectral_trail`, `charge_dust`, and `boss_dissolve_ember`.
  - [x] 1.3 Add particle geometry primitives, material definitions, prewarming entries, and spawn logic for `thruster` (cyan emissive box), `spectral_trail` (purple transparent sphere), `charge_dust` (earthy brown box), and `boss_dissolve_ember` (intense orange/red box with upward velocity drift) in [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts).

- [x] **Phase 2: Composite Monster Mesh & Variant Profiles** (`monsterVariant.ts`, `Monster.ts`)
  - [x] 2.1 Expand `MonsterVariantProfile` interface in [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts) to include multi-primitive geometry configurations (`torsoType`, `headType`, `limbType`, `accentType`), scale parameters, and Fresnel accent color definitions.
  - [x] 2.2 Update all 12 variant profiles in [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts) (`scout`, `brute`, `stalker`, `golem`, `crawler`, `drone`, `sentinel`, `annihilator`, `phantom`, `titan`, `barbone`, `punk`) with detailed composite primitive specs (`Capsule`, `Dodecahedron`, `Icosahedron`, `Cylinder`, `Torus`).
  - [x] 2.3 Refactor mesh construction in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) to replace monolithic `BoxGeometry` single torso meshes with hierarchical sub-assemblies (parent `Group`, Torso mesh, `headGroup` with core/head mesh, articulated `limbGroups`, and armor/wing/accent meshes).

- [x] **Phase 3: Enemy Motion Trails & Fresnel Material Application** (`Monster.ts`)
  - [x] 3.1 Apply `createFresnelMaterial()` to monster mesh parts in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts), mapping `uFresnelColor` to variant signature emissive/eye accent colors.
  - [x] 3.2 Implement delta-time throttled (`TRAIL_INTERVAL = 0.05s`) particle trail emission in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) `update()`, spawning cyan `thruster` trails for `drone`, purple `spectral_trail` wisps for `phantom`, and ground `charge_dust`/`spark` trails for charging `brute`.
  - [x] 3.3 Add procedural articulated limb animation oscillations (leg stride movement, arm swing, hovering core bobbing, and drone blade spinning) in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) `update()`.

- [x] **Phase 4: Boss Monster Transition Shockwaves & 2-Second Dissolve Death** (`BossMonster.ts`)
  - [x] 4.1 Update `takeDamage()` phase transition handling in [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts) to trigger a 36-particle expanding radial shockwave ring of `flame`/`spark` particles when transitioning from Phase 1 to Phase 2 (60% HP) and Phase 2 to Phase 3 (25% HP).
  - [x] 4.2 Replace immediate mesh hiding (`mesh.visible = false`) on boss death in [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts) with a 2.0-second procedural noise dissolve disintegration state machine.
  - [x] 4.3 Attach noise dissolve fragment shader logic (`uDissolveThreshold` animating 0.0 to 1.0) and spawn rising `boss_dissolve_ember` particles across the boss mesh volume during the 2.0-second disintegration sequence in [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts) `update()` before removing the entity.

- [x] **Phase 5: NPC Micro-Animations, Head Orientation, & 3D Floating Status Indicators** (`NPC.ts`)
  - [x] 5.1 Restructure NPC mesh construction in [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts) into torso body, `headGroup` pivot node (head sphere, hat/helmet, facial accents), and top `indicatorGroup`.
  - [x] 5.2 Implement procedural idle sine-wave breathing scale modulation (`bodyMesh.scale.y` and `scale.xz` oscillation) and smooth proximity head orientation slerp tracking towards the player with active dialogue pitch nodding in [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts) `update()`.
  - [x] 5.3 Construct 3D primitive assembled status indicators (`!` exclamation mark using inverted tapered cylinder + sphere; `?` question mark using torus arc + cylinder + sphere) hovering above NPC heads with continuous vertical bobbing and Y-axis rotation in [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts).

- [x] **Phase 6: Verification & Tests** (`vitest run`, `tsc --noEmit`)
  - [x] 6.1 Execute `npx tsc --noEmit` to verify type safety and ensure all materials, GLSL uniform definitions, particle types, and entity methods compile without errors.
  - [x] 6.2 Run existing test suite using `npx vitest run` and add unit test coverage for composite monster mesh generation, Fresnel materials, new particle pool spawn types, boss dissolve timers, and NPC status indicator states.
