# Proposal: Realism and Aesthetics Upgrade

## Intent
Add realistic visual details to structures (rotating volumetric lighthouse spotlights, house chimneys with smoke particles, tower/castle stone reliefs and lit windows), biomes (forest mushrooms, mountain crystals, desert rolling tumbleweeds), and enemies (breathing animation for all, footstep dust for heavy Brute/Golem variants) to increase immersion and player engagement.

## Scope
### In Scope
- Create rotating volumetric spotlight beam on lighthouses.
- Add chimneys (emitting smoke particles) and lit windows to houses.
- Implement stone reliefs and glowing arched window panels on towers and castles.
- Add forest mushrooms, mountain crystals, and physics-based desert rolling tumbleweeds.
- Implement monster breathing animations (sine-wave scaling/bobbing).
- Generate footstep dust particles for heavy monsters (Brute/Golem) on step intervals.

### Out of Scope
- Full block/brick texture mapping (relying on low-poly geometry).
- Weather systems or global wind changes.
- Destructible buildings or decoration collision physics.

## Capabilities
### New Capabilities
- `rotating-lighthouse-beam`: Volumetric spotlight cone rotating dynamically.
- `building-cosmetic-details`: Chimneys, smoke effects, stone relief accents, and lit windows.
- `biome-decorations`: Forest mushrooms, mountain crystals, and physics-driven tumbleweeds.
- `monster-breathing-animation`: Dynamic scale/position bobbing for all monster types.
- `monster-footstep-particles`: Dust particles emitted from walking heavy monster variants.

### Modified Capabilities
- `particle-system`: Support smoke and dust particle movement.

## Approach
- **Structures**: Add transparent, additive-blended cone meshes for lighthouse beams. Model chimneys and window plates directly into building models, and tick their rotations and smoke particle spawns in the main loop.
- **Biomes**: Spawn forest mushrooms, crystals, and tumbleweeds using instanced meshes. Move and wrap tumbleweeds along heightmap coordinates in the update loop.
- **Monsters**: Apply sine-wave scaling to monster meshes. Track steps in `Monster.ts` and spawn ground-impact particles from the shared `ParticlePool` for heavy variants.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/world/structures.ts` | Modified | Add chimneys, relief blocks, window panels, and spotlight geometry |
| `src/world/decorations.ts` | Modified | Define instanced meshes and tumbleweed physics updates |
| `src/entities/Monster.ts` | Modified | Implement breathing animation and footstep tracking |
| `src/combat/particles.ts` | Modified | Define smoke/dust particle properties and behaviors |
| `src/main.ts` | Modified | Update spotlight rotation, tumbleweeds, and particle loops |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Render performance drops | Low | Use instanced meshes and reusable particle pools |
| Tumbleweed heightmap alignment | Med | Interpolate height directly from world elevation functions |

## Rollback Plan
Revert changes to `structures.ts`, `decorations.ts`, `Monster.ts`, `particles.ts`, and `main.ts` in Git.

## Success Criteria
- [ ] Lighthouse spotlight rotates continuously.
- [ ] Chimneys emit rising smoke particles.
- [ ] Towers/castles display stone reliefs and lit windows.
- [ ] Mushrooms, mountain crystals, and rolling tumbleweeds render correctly.
- [ ] Monsters breathe/bob and heavy variants spawn footstep dust.
