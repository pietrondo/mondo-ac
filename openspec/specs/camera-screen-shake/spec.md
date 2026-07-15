# Specification: Camera Screen Shake

## Description
Defines requirements for first-person camera screen shake on fire/damage.

## Requirements
1. **Trigger & Decay**:
   - Camera screen shake MUST trigger on weapon fire and when player takes damage.
   - Shake intensity MUST decay linearly to zero over time.
2. **Offset Application**:
   - Position offsets MUST be random vectors scaled by current shake intensity.
   - Positional offsets MUST be added to the camera position, while lookAt target remains stable.

## Scenarios
### Scenario 1: Shake on weapon fire
* **Given** a player fires their weapon
* **When** camera updates its position
* **Then** a random offset is added to camera position and decays over time

### Scenario 2: Stable targeting
* **Given** screen shake is active
* **Then** camera position is offset but lookAt target remains unchanged
