# Proposal: Vehicle Indicators and Monster Glow

## Intent
Add floating 3D neon arrows (cone and cylinder) above each vehicle to improve visibility, glowing embers particles (cyan/red sparks) for Golem and Brute cores, camera recoil (pitch/yaw) inside `Player.ts`, and ambient particles (leaves and spores) for the plains biome.

## Scope
### In Scope
- Create floating/spinning neon indicators for vehicles
- Emit glowing ember particles from Golem chest cores and Brute spikes
- Add smooth pitch/yaw camera rotational recoil when player fires
- Support green leaves/spores ambient particles in the plains biome

### Out of Scope
- Configurable indicator shapes or custom user textures
- Advanced physical camera shaking that affects collisions

## Capabilities
### New Capabilities
- `vehicle-arrows`: neon arrows float/spin above vehicles and disappear when driving.
- `monster-glow-particles`: Golems and Brutes emit glowing embers from cores.
- `camera-rotational-recoil`: smooth pitch/yaw kick recoil upon weapon discharge.

### Modified Capabilities
- `weather-particles`: support spawning leaves/spores in the plains biome.

## Approach
Implement standard neon indicator geometries (cone + cylinder) within [Vehicle.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Vehicle.ts). Pass color parameters from subclasses [Hovercar.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Hovercar.ts) and [Spaceship.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Spaceship.ts). Add `'spark_cyan'` and `'spark_red'` to [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) with upward/outward behavior. Modify Golem/Brute updates in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) to spawn these sparks. In [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts), add `recoilPitch`/`recoilYaw` decay variables inside update calculations. In [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts), spawn plains biome ambient particles.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| [Vehicle.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Vehicle.ts) | Modified | Add `indicator: THREE.Group` and `updateIndicator` methods. |
| [Hovercar.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Hovercar.ts) | Modified | Pass color cyan to `super()`. |
| [Spaceship.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Spaceship.ts) | Modified | Pass color magenta to `super()`. |
| [particles.ts](file:///C:/Users/pietr/progetti/mondo/src/combat/particles.ts) | Modified | Add cyan/red spark particle variants. |
| [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) | Modified | Accept particle pool and spawn sparks. |
| [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) | Modified | Implement rotational camera recoil and recovery. |
| [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) | Modified | Manage indicator updates and plains biome weather. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Particle pool overflow | Medium | Use low probabilistic check (e.g., `Math.random() < 0.15`). |
| Gimbal lock/camera flip | Low | Clamp total pitch (base + recoil) to `[-Math.PI / 2 + 0.05, Math.PI / 2 - 0.05]`. |

## Rollback Plan
Revert changes to player control/camera logic, vehicle base/derived constructor changes, and custom particle structures.

## Success Criteria
- [ ] Neon arrows float/spin above vehicles and disappear when driving.
- [ ] Golems/Brutes emit glowing embers from their cores.
- [ ] Camera has smooth rotational kick recoil when firing.
- [ ] Plains biome spawns ambient leaves/spores.
