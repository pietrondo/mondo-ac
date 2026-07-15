</Specification: Biome Decorations>
<Specification: Monster Breathing Animation>
## Description
Defines a continuous idle breathing/bobbing animation for all monster variants.

## Requirements
1. **Breathing Idle Animation**:
   - All monster meshes MUST apply a continuous breathing animation using a sine-wave scale and/or position offset over time.
   - The breathing cycle MUST be smooth and loop indefinitely.

## Scenarios
### Scenario 1: Breathing scale bobbing
* **Given** any active monster variant in the world
* **When** the monster updates its animation state
* **Then** its mesh scale or height MUST oscillate smoothly according to a sine function
