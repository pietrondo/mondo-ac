</Specification: Monster Footstep Particles>
<Delta for Particle System>
## ADDED Requirements

### Requirement: Support for smoke and dust particle movement
The system MUST support smoke particles (which drift upwards with custom low gravity and fade out) and dust particles (which emit on impact and quickly dissipate).

#### Scenario: Spawning smoke particles
- GIVEN a particle spawn request of type `'smoke'`
- WHEN update ticks
- THEN the particle's Y coordinate MUST increase and its opacity decrease until deactivated
</Delta for Particle System>
