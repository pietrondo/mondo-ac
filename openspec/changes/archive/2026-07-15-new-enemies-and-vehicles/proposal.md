# Proposal: New Enemies and Vehicles

## Intent
Add spaceships/cars to allow fast exploration of large maps, introduce new enemies (drones/crawlers) to keep gameplay engaging, and improve current enemy visual models.

## Scope
### In Scope
- Create drone enemy type (flying, fires light projectiles)
- Create crawler enemy type (spider-like, melee)
- Add articulated legs and accessories to current enemies (scout, brute, stalker, golem)
- Create a steerable hovercar vehicle (fast ground traversal)
- Create a steerable spaceship vehicle (3D flight)
- KeyE interact logic to enter/exit vehicles

### Out of Scope
- Vehicle combat (firing weapons from vehicles)
- Fuel or vehicle damage systems
- Multiplayer vehicle sharing

## Capabilities
### New Capabilities
- vehicle-interaction: enter, exit, and drive hovercars and spaceships.
- new-enemy-variants: drone and crawler enemy types.

### Modified Capabilities
- monster-spawning: support spawning vehicles and new enemies in hostile biomes.

## Approach
Implement Vehicle base class and Hovercar/Spaceship subclasses. Use a control handover mechanism in the main game loop to disable standard player character controls when inside a vehicle, updating the vehicle and attaching the camera/player mesh to it. Add new monster variants and enrich their procedural geometries with details.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/entities/Player.ts` | Modified | Intercept controls and physics when driving |
| `src/entities/Monster.ts` | Modified | Add crawler/drone visual profiles and geometries |
| `src/world/monsterVariant.ts` | Modified | Add drone/crawler profiles |
| `src/main.ts` | Modified | Drive/spawning logic |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vehicle terrain clipping | Med | Align vehicle position/pitch with terrain interpolation |
| Interaction collisions | Low | Place player slightly behind vehicle when exiting |

## Rollback Plan
Revert changes to Player.ts, main.ts, and delete new vehicle/weapon/enemy logic files.

## Success Criteria
- [ ] Drones and crawlers spawn and attack correctly.
- [ ] Hovercars and spaceships can be boarded and driven with WASD.
- [ ] Exiting a vehicle returns the camera and controls to the player.
