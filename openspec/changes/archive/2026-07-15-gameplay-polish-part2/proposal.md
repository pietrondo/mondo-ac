# Proposal: Gameplay Polish Part 2

## Intent
Improve visual and physical feedback during combat by implementing monster hit flashing, first-person camera screen shake on action events, and a holographic dynamic ammo display directly on weapon models.

## Scope
### In Scope
- Flash monster 3D geometries red/white temporarily when they receive damage.
- Implement random camera offsets (screen shake) decaying over time when firing or taking damage.
- Add a floating 3D text plane displaying current/max ammo on the weapon model.

### Out of Scope
- Screen shake options/configuration slider in settings.
- Custom text formatting/colors of the holographic display from player settings.
- Individual hit location indicators/markers on the player's crosshairs.

## Capabilities
### New Capabilities
- `holographic-ammo-display`: dynamic ammo counts rendered on 3D weapon models.
- `camera-screen-shake`: tactile recoil/damage camera feedback.
- `monster-hit-flashing`: visual confirmation of hits on monsters.

### Modified Capabilities
- `weapon-rendering`: render weapons with dynamic textures.

## Approach
Implement Approach 1 from exploration.
- **Monster Hit Flash**: Store a `hitFlashTimer` in [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts). When hit, set to 0.15s. In `update()`, traverse the monster model's meshes (excluding health bar), caching original emissive values on first hit, and set `emissive` to red/white scaling with the timer.
- **Camera Screen Shake**: Maintain `shakeIntensity` decaying linearly in [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts). Offset camera position relative to lookAt target using a random vector scaled by intensity.
- **Holographic Ammo Display**: In [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts), create a shared `CanvasTexture` from an offscreen 2D canvas showing ammo. Attach a `PlaneGeometry` displaying this texture to weapon models and update the texture context on state changes.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts) | Modified | Add screen shake state, decay rate, and camera transformation offsets |
| [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts) | Modified | Add flash timer, material emissive caching, and update/traverse loops |
| [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts) | Modified | Create HTMLCanvasElement, CanvasTexture, plane mesh, and update method |
| [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts) | Modified | Trigger camera shake on weapon fire and pass ammo states to WeaponView |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ammo display clipping | Low | Position display plane slightly floating (offset by 0.02 units) |
| Performance overhead from canvas updates | Low | Re-render the canvas/update texture only when the ammo count changes |

## Rollback Plan
Discard edits to [Player.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Player.ts), [Monster.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/Monster.ts), [WeaponView.ts](file:///C:/Users/pietr/progetti/mondo/src/entities/WeaponView.ts), and [main.ts](file:///C:/Users/pietr/progetti/mondo/src/main.ts), reverting to the previous commit.

## Success Criteria
- [ ] Monsters flash red/white when shot.
- [ ] Camera shakes on weapon fire and player damage.
- [ ] Dynamic ammo counts display on the weapon model.
