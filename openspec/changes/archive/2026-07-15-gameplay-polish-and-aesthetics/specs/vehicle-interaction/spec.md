# Delta Specification: Vehicle Interaction

## Base Specification
This delta specification modifies [vehicle-interaction/spec.md](file:///C:/Users/pietr/progetti/mondo/openspec/specs/vehicle-interaction/spec.md).

## Baseline Summary
Defines entering, steering, and exiting vehicles.

## Modifications & Additions
We integrate boarding HUD overlay prompts.

### Requirements
Add the following requirements:
5. **Prompt Integration**: Approaching/driving vehicles MUST update HUD overlay prompts.

### Scenarios
Add the following scenarios:
#### Scenario 3: Proximity prompt
* **Given** player is walking to hovercar
* **When** within 5 meters
* **Then** HUD shows "Press E to board Hovercar"
