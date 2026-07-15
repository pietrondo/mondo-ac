# Specification: Monster Hit Flashing

## Description
Defines requirements for monsters flashing red/white after taking damage.

## Requirements
1. **Duration**:
   - Monsters MUST flash emissive red/white for 0.15s after receiving damage.
2. **Visual Application**:
   - The flash MUST traverse the monster's meshes, skipping the health bar.
   - Original material emissive colors and intensities MUST be cached on hit and restored when the timer expires.
   - Flash emissive intensity MUST scale with remaining flash duration.

## Scenarios
### Scenario 1: Hit flash triggers
* **Given** a monster receives damage
* **Then** its mesh emissive color changes to red/white, scaling down over 0.15s

### Scenario 2: Material restoration
* **Given** a monster's hit flash timer expires
* **Then** original cached emissive properties are restored
