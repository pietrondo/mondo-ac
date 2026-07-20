</Specification: Monster Glow Particles>
<Specification: Camera Rotational Recoil>
## Description
Defines smooth pitch/yaw camera rotational recoil and recovery upon weapon discharge.

## Requirements
1. **Rotational Kick**:
   - The camera MUST experience an upward/backwards pitch and yaw kick when the weapon fires.
2. **Smooth Recovery**:
   - The camera orientation MUST smoothly decay back to the user's view direction.
3. **Pitch Clamping**:
   - The total pitch angle MUST be clamped to prevent screen flipping.

## Scenarios
### Scenario 1: Weapon fire camera recoil
* **Given** a player fires a weapon
* **When** camera position updates
* **Then** a rotational kick is added to the camera pitch and yaw, recovering smoothly over time
