# Proposal: Gameplay Polish and Aesthetics

## Intent
Improve player feedback and game visuals by adding interactive vehicle prompts, impact particles (blood/sparks), enemy billboard health bars, and enhanced weapon sights, rotational recoil, and ejected shell physics.

## Scope
### In Scope
- Vehicle boarding HUD prompts when in range.
- Particle systems for hit feedback (red blood for monsters, sparks for environment).
- 3D billboard health bars attached above monsters.
- Weapon model enhancements (sights, stocks) and recoil rotation.
- Physical brass shell ejection and ground bounce.
- Detail upgrades for enemy meshes (glowing accents, armor, propellers, eyes).

### Out of Scope
- Fully custom 3D model files (using Three.js primitives instead).
- Particle lighting/shadows.
- Non-ui vehicle indicators (e.g. outline shaders).

## Capabilities
### New Capabilities
- `hit-feedback-particles`: Volumetric blood and spark particle effects.
- `billboard-health-bars`: Camera-facing health indicators above monsters.
- `vehicle-boarding-prompts`: Dynamic HUD prompt informing players how to enter/exit vehicles.

### Modified Capabilities
- `vehicle-interaction`: Handover states modified to trigger HUD updates.
- `new-enemy-variants`: Visual detail enhancements for crawling and flying drones/monsters.

## Approach
- Add central interactive HUD prompts in `src/ui/hud.ts` triggered during range checks in `src/main.ts`.
- Upgrade `src/entities/Monster.ts` constructor to add variant-specific details (spikes, propellers, multiple eyes) and manage 3D billboard health bars that face the camera.
- Implement physics-based ejected shells and hit-feedback particles in a new module `src/combat/particles.ts`.
- Update `src/entities/WeaponView.ts` to add holographic sights, vertical pitch recoil, and trigger shell creation.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/main.ts` | Modified | Coordinate prompt states and trigger particles |
| `src/ui/hud.ts` | Modified | Display HUD enter/exit prompts |
| `src/entities/Monster.ts` | Modified | Build enemy accessories and billboard health bars |
| `src/entities/WeaponView.ts` | Modified | Weapon mesh details, recoil rotation, and shell triggers |
| `src/combat/particles.ts` | New | Spawning/physics for hit particles and ejected shells |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Particle performance drop | Low | Use basic object pooling and cap max active count |
| Weapon sight blocking view | Med | Carefully calibrate local offsets in WeaponView |

## Rollback Plan
Revert changes to `src/main.ts`, `src/ui/hud.ts`, `src/entities/Monster.ts`, `src/entities/WeaponView.ts`, and delete `src/combat/particles.ts`.

## Success Criteria
- [ ] Interactive HUD prompts display for entering/exiting vehicles.
- [ ] Bullets spawn blood particles on monster hits and spark particles on ground/walls.
- [ ] Monsters display billboard health bars after taking damage.
- [ ] Weapons show holographic sights, rotate back on recoil, and eject bouncing shells.
