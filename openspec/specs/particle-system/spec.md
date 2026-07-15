</Specification: Monster Footstep Particles>
<Specification: Particle System>
## Description
Defines the particle system supporting smoke and dust particle movement.

## Requirements
1. **Support for smoke and dust particle movement**:
   - The system MUST support smoke particles (which drift upwards with custom low gravity and fade out) and dust particles (which emit on impact and quickly dissipate).

## Scenarios
### Scenario 1: Spawning smoke particles
* **Given** a particle spawn request of type `'smoke'`
* **When** update ticks
* **Then** the particle's Y coordinate MUST increase and its opacity decrease until deactivated
