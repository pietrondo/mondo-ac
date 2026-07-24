# Proposal: Enemy and NPC Visual Enhancements

## Executive Summary
This proposal outlines a major visual and aesthetic overhaul for enemies, bosses, and non-player characters (NPCs) in the game. Currently, enemies rely on rigid single-box primitives, dark environments render entities difficult to discern, movement lacks visual flair, boss deaths are abrupt, and NPCs feel static. This change introduces organic and mechanoid composite geometry structures for all 12 monster variants, high-contrast Fresnel/Rim lighting shaders, particle trails for hovering and charging enemies, dynamic phase transition auras and dissolve death effects for `BossMonster`, and idle breathing animations, head orientation/nodding, and 3D floating quest/status indicators for `NPC` entities.

## Problem Statement / Context
1. **Monolithic Box Geometry**: Monsters in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) use a single `BoxGeometry` torso with simple attachments. This results in primitive, unrefined visuals that reduce immersion and convey low visual fidelity.
2. **Low Visibility in Dark Biomes**: Dark terrain, cave interiors, and nighttime cycles make enemies blend into the background, leading to unfair player damage and poor visual contrast.
3. **Lack of Motion Trails**: Fast hover variants (`drone`, `phantom`) and charging variants (`brute`) lack motion indicators or thruster/spectral particle feedback.
4. **Abrupt Boss Disappearance**: [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts) vanishes instantly upon death (`mesh.visible = false`) without visual impact, and phase transitions lack energetic visual cues.
5. **Static NPCs**: NPCs in [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts) stand still without subtle life-like micro-animations, head movement towards the player, or clear 3D world status indicators showing available quests or interaction states.

## Proposed Solution & Scope

### In Scope
- **Organic & Mechanoid Composite Geometries**:
  - Replace single rigid boxes in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) and [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts) with multi-primitive composite meshes utilizing `CapsuleGeometry`, `DodecahedronGeometry`, `IcosahedronGeometry`, `CylinderGeometry`, `TorusGeometry`, and articulated limb/joint components.
  - Tailor composite mesh structures per variant (`scout`, `brute`, `stalker`, `golem`, `crawler`, `drone`, `sentinel`, `annihilator`, `phantom`, `titan`, `barbone`, `punk`).
- **Fresnel / Rim Lighting Shader Effects**:
  - Implement a custom shader material/modifier (via `onBeforeCompile` or custom `ShaderMaterial`) in [materials.ts](file:///C:/Users/pietr/progetti/mondo/src/render/materials.ts) / [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) adding a rim glow effect (`pow(1.0 - dot(N, V), fresnelPower)`).
  - Provide bright rim highlights for high-contrast visibility against dark or low-light backgrounds.
- **Particle Trails**:
  - Integrate continuous thruster energy trails for flying/hovering variants (`drone` - cyan energy, `phantom` - purple spectral aura) and charge impact dust/spark trails for heavy chargers (`brute`).
  - Extend [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) to support new particle trail presets.
- **BossMonster Phase Aura & Procedural Dissolve Death**:
  - Add expanding radial particle aura bursts on phase 1 -> 2 and phase 2 -> 3 transitions in [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts).
  - Implement procedural dissolve fade material effect and disintegration ember particles when the boss reaches 0 HP before mesh cleanup.
- **NPC Micro-Animations & Status Indicators**:
  - Upgrade [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts) with dynamic idle breathing scale micro-animations (`sin(time)`) and subtle head orientation / nodding toward the player during dialogue.
  - Add 3D floating bouncing status indicators (`!` exclamation mark, `?` question mark) assembled from 3D primitives (cone/cylinder + sphere) above NPC heads indicating available quests and dialogue readiness.

### Non-Goals (Out of Scope)
- Skeletal mesh bone rigging or external glTF model importing (maintaining procedural Three.js geometry approach).
- Post-processing bloom pass overhaul (relying on emissive materials and Fresnel rim shader intensity).
- Full custom quest narrative system extensions outside of visual indicators and existing dialogue hooks.

## Capabilities

### New Capabilities
- `composite-monster-meshes`: Procedural multi-primitive assembly using capsules, dodecahedrons, icosahedrons, cylinders, and toruses for all monster variants.
- `fresnel-rim-lighting`: Custom shader-based rim lighting effect on enemy materials to ensure silhouette readability in dark environments.
- `enemy-particle-trails`: Continuous thruster, spectral, and charging particle emission for hovering and charging enemy variants.
- `boss-phase-aura-dissolve`: Visual phase transition shockwaves/auras and procedural dissolve disintegration fade on boss defeat.
- `npc-life-and-indicators`: NPC breathing micro-animations, head tilt/nodding, and floating 3D quest/status markers.

### Modified Capabilities
- `particle-system`: Addition of thruster, spectral trail, and boss disintegration ember particle types in [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts).
- `monster-rendering`: Updated mesh hierarchy and material assignment in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) and profile configs in [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts).

## Proposed Architecture & Technical Approach
1. **Enemy Mesh Reconstruction**:
   - In [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts), define detailed composite part configurations.
   - In [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts), replace basic `BoxGeometry` torso with a grouped hierarchy: torso (dodecahedron/capsule), head/core (icosahedron/sphere), articulated limbs (cylinders/capsules with pivot groups), and decorative armor plates.
2. **Fresnel Rim Lighting Shader**:
   - Create a factory function `createFresnelMaterial` in [materials.ts](file:///C:/Users/pietr/progetti/mondo/src/render/materials.ts) or extend `MeshStandardMaterial.onBeforeCompile` to inject custom uniforms (`uFresnelColor`, `uFresnelPower`, `uFresnelIntensity`) into the fragment shader.
   - Compute `float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), uFresnelPower);` and add `uFresnelColor * fresnel * uFresnelIntensity` to final fragment color.
3. **Particle Trails**:
   - In [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) `update()`, check entity variant and velocity.
   - For `drone` and `phantom`, emit thruster/spectral particles at rear nozzle/tail positions. For charging `brute`, emit ground dust and flame/spark trails.
4. **Boss Transition & Dissolve Effect**:
   - In [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts), spawn radial particle rings when `onPhaseChange` fires.
   - On death, switch materials to a noise/threshold dissolve shader or animated alpha cut-out over 2.0 seconds while spawning rising ember particles.
5. **NPC Enhancements**:
   - In [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts), add `headGroup` and `indicatorGroup`.
   - Animate `body.scale.y` with subtle sine oscillation for breathing. Interpolate `headGroup.rotation` toward player position with gentle pitch nodding when talking.
   - Construct floating 3D exclamation and question mark primitives that hover and bob above NPC heads based on status.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts) | Modified | Expand profile structures to define multi-part geometries and colors per variant. |
| [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) | Modified | Implement composite mesh construction, Fresnel materials, limb hierarchy, and trail emission. |
| [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts) | Modified | Implement phase transition particle aura and procedural dissolve death animation. |
| [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts) | Modified | Add idle breathing scale, head node tilt/nodding, and floating 3D status indicators. |
| [materials.ts](file:///C:/Users/pietr/progetti/mondo/src/render/materials.ts) | Modified | Add Fresnel rim lighting material creator / shader chunk modifier. |
| [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) | Modified | Support spectral trails, thruster exhaust, and dissolve ember particle types. |

## Key Tradeoffs & Risks

| Risk / Tradeoff | Likelihood | Mitigation |
|------------------|------------|------------|
| **Increased Draw Calls / Triangles**: Composite geometries add multiple meshes per monster. | Medium | Reuse shared geometries (`CapsuleGeometry`, `CylinderGeometry`) across instances and keep polygon counts moderate (e.g., 6-12 radial segments). |
| **Shader Compilation Overhead**: Custom `onBeforeCompile` or `ShaderMaterial` modifications could trigger compile stutters. | Low | Warm up Fresnel shaders during scene loading and share material instances across variants. |
| **Particle Pool Saturation**: Continuous trails for multiple hovering/charging enemies could deplete `ParticlePool`. | Medium | Throttle particle emission rates based on delta time (`Math.random() < 0.3` or fixed time accumulator) and recycle inactive pool elements. |
| **NPC Indicator Z-Fighting / Occlusion**: Floating indicators could clip through tall NPC hats or structures. | Low | Calculate indicator height relative to top of hat/head mesh + padding offset. |

## Success Criteria
- [ ] Monster meshes generate composite organic/mechanoid shapes using `Capsule`, `Dodecahedron`, `Icosahedron`, `Cylinder`, and `Torus` geometries per variant.
- [ ] Enemies feature Fresnel/Rim Lighting shader effects producing clear edge highlights against dark backdrops.
- [ ] Flying (`drone`, `phantom`) and charging (`brute`) variants emit smooth particle trails during movement.
- [ ] `BossMonster` emits radial particle auras during phase transitions and procedurally dissolves with ember particles upon death.
- [ ] NPCs display idle breathing micro-animations, head orientation/nodding when approached, and floating 3D quest/status indicators.

## Rollback Plan
If performance degradation or rendering issues occur:
1. Revert changes to [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts), [monsterVariant.ts](file:///C:/Users/pietr/progetti/mondo/src/world/monsterVariant.ts), and [BossMonster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/BossMonster.ts) using Git.
2. Revert [NPC.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/NPC.ts), [materials.ts](file:///C:/Users/pietr/progetti/mondo/src/render/materials.ts), and [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) back to single-box and basic particle setups.
