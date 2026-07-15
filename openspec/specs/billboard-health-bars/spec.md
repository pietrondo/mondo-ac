# Specification: Billboard Health Bars

## Description
Defines 3D billboard health bars for monsters.

## Requirements
1. **Visibility**: Display 3D billboard health bar above monster. Visible only after monster takes damage.
2. **HP representation**: Scale X representing current HP ratio.
3. **Orientation**: MUST always rotate to face the camera.

## Scenarios
### Scenario 1: Visible after damage
* **Given** monster has full health
* **When** hit by projectile
* **Then** billboard health bar becomes visible and scales X to HP ratio

### Scenario 2: Rotating to camera
* **Given** monster has visible health bar
* **When** player camera moves
* **Then** health bar rotates to face camera
