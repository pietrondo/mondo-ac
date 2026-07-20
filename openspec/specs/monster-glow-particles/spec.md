</Specification: Vehicle Arrows>
<Specification: Monster Glow Particles>
## Description
Defines requirements for glowing ember particle emissions from monster variant cores.

## Requirements
1. **Golem Core Glow**:
   - Golem variants MUST periodically emit cyan spark particles from their chest cores.
2. **Brute Core Glow**:
   - Brute variants MUST periodically emit red spark particles from their spikes.
3. **Spawning Mechanics**:
   - Embers MUST drift slowly upwards and fade out, limited by a probabilistic rate to prevent pool exhaustion.

## Scenarios
### Scenario 1: Golem chest sparks
* **Given** a Golem is spawned
* **When** update ticks
* **Then** it MUST emit cyan spark particles from its chest core location
