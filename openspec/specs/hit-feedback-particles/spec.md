# Specification: Hit Feedback Particles

## Description
Defines requirements for hit particles.

## Requirements
1. **Enemy Hit**: Spawns 6-10 red blood meshes on enemy hit.
2. **Other Hit**: Spawns 6-10 orange spark meshes on other hit.
3. **Physics**: Particles MUST fall to ground and fade out.

## Scenarios
### Scenario 1: Enemy Hit
* **Given** projectile hits enemy
* **When** hit feedback triggers
* **Then** 6-10 red blood meshes spawn and fade out

### Scenario 2: Environment Hit
* **Given** projectile hits wall
* **When** hit feedback triggers
* **Then** 6-10 orange spark meshes spawn and fall
