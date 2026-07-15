# Specification: Vehicle Interaction
## Description
Defines requirements for player entering, steering, and exiting hovercars (ground traversal) and spaceships (3D flying).

## Requirements
1. **Boarding Interaction**:
   - The player MUST be able to enter a vehicle by pressing KeyE when within 5 meters of it.
   - Upon boarding, the player controls MUST be mapped to the vehicle. Walking movement MUST be disabled.
2. **Hovercar Traversal**:
   - The hovercar MUST move along the terrain surface, steering with AD, accelerating with W, and reversing with S.
3. **Spaceship Traversal**:
   - The spaceship MUST support full 3D flight: yaw steering with AD, throttle with WS, and vertical elevation/climbing with Space and descending with Shift.
4. **Exiting Interaction**:
   - The player MUST be able to exit the vehicle by pressing KeyE.
   - Upon exit, the player MUST be positioned slightly behind the vehicle and control MUST return to the walking player.
5. **Prompt Integration**:
   - Approaching/driving vehicles MUST update HUD overlay prompts.

## Scenarios
### Scenario 1: Entering a hovercar
* **Given** a player is within 4 meters of a hovercar
* **When** the player presses KeyE
* **Then** the player is marked as driving and default walking movement is disabled
* **And** the camera is attached to the hovercar

### Scenario 2: Exiting a spaceship
* **Given** a player is driving a spaceship
* **When** the player presses KeyE
* **Then** the player is placed on the ground near the spaceship and walking controls are restored

### Scenario 3: Proximity prompt
* **Given** player is walking to hovercar
* **When** within 5 meters
* **Then** HUD shows "Press E to board Hovercar"

