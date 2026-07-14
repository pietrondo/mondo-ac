# Specification: Monster Spawning

## Description
This specification defines the monster variant system, biome-specific spawn selections, golem variant properties, custom golem geometry, attack parameters, and custom projectile color rendering.

## Requirements
1. **Golem Variant Profile**:
   - The system MUST support a `'golem'` monster variant.
   - The golem variant MUST have the following attributes: scale factor of 1.6, maximum HP of 150, movement speed of 1.5, slate grey body color (`0x607D8B`), and glowing cyan eyes (`0x00E5FF`).
2. **Biome-Restricted Spawning**:
   - The monster spawning variant selection MUST accept the current biome information.
   - The golem variant MUST spawn only in `MOUNTAIN` and `DESERT` biomes.
3. **Visual Representation (Geometry)**:
   - The golem variant's mesh group MUST include custom slate grey boxes attached to represent large stone shoulders/fists to distinguish its silhouette.
4. **Attack Parameters & Projectiles**:
   - Golem attacks MUST fire giant red projectiles with a speed of 15, damage of 30, size (radius) of 0.45, and have a cooldown of 3.0 seconds.
   - Enemy projectiles MUST support custom hex color options by cloning their materials and setting the material color appropriately (resolving any hardcoded fallback bugs).

## Scenarios

### Scenario 1: Golem spawns in Mountain and Desert biomes only
* **Given** a spawning coordinate resolves to `MOUNTAIN` or `DESERT` biome
* **When** a monster variant is chosen
* **Then** the chosen variant MAY be a golem
* **And** if the biome resolves to any other biome (e.g. `PLAINS` or `FOREST`), the chosen variant MUST NOT be a golem

### Scenario 2: Golem geometry features large shoulders/fists
* **Given** a monster with the golem variant is spawned
* **When** its mesh is instantiated
* **Then** its scale factor MUST be 1.6
* **And** its body color MUST be `0x607D8B`
* **And** its eyes color MUST be `0x00E5FF`
* **And** its group MUST contain attached shoulder/fist meshes

### Scenario 3: Golem attack properties and projectile rendering
* **Given** a golem attacks the player
* **When** a projectile is spawned with color set to red (`0xff0000`) and size 0.45
* **Then** the projectile's velocity speed MUST be 15 and deal 30 damage
* **And** the projectile material MUST be cloned and have its color hex value set to `0xff0000`
