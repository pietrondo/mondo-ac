</sdd-spec>
<Specification: Vehicle Arrows>
## Description
Defines floating 3D neon arrow indicators above unoccupied vehicles to show their locations.

## Requirements
1. **Indicator Presence**:
   - The system MUST render a floating neon 3D arrow above unoccupied vehicles.
2. **Animation**:
   - The indicator MUST continuously spin and bob vertically.
3. **Visibility Toggle**:
   - The indicator MUST be hidden when a player enters the vehicle, and shown again upon exit.

## Scenarios
### Scenario 1: Arrow animates on parked vehicle
* **Given** a vehicle is unoccupied
* **When** rendered
* **Then** the neon indicator MUST be visible, spinning and bobbing

### Scenario 2: Arrow hidden when driving
* **Given** a player is driving a vehicle
* **Then** the neon arrow is hidden
