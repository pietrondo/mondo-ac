# Specification: Vehicle Boarding Prompts

## Description
Defines HUD vehicle prompts.

## Requirements
1. **Overlay**: Styled HTML HUD overlay.
2. **Boarding**: Displays "Press E to board Hovercar/Spaceship" when in range (5 meters) of a vehicle.
3. **Exiting**: Displays "Press E to exit" when driving.

## Scenarios
### Scenario 1: Boarding prompt
* **Given** player is within 4 meters of a spaceship
* **When** not driving
* **Then** HUD displays "Press E to board Spaceship"

### Scenario 2: Exit prompt
* **Given** player is driving
* **When** active
* **Then** HUD displays "Press E to exit"
