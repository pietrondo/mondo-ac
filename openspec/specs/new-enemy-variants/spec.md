# Specification: New Enemy Variants
## Description
Defines requirements for crawler (melee, spider-like) and drone (flying, shooting laser projectiles) enemy types.

## Requirements
1. **Crawler Variant Profile**:
   - The system MUST support a `'crawler'` monster variant with scale 0.8, HP 50, speed 4.0, and reddish body color.
   - The crawler variant MUST have custom articulated leg meshes representing a spider.
2. **Drone Variant Profile**:
   - The system MUST support a `'drone'` monster variant with scale 0.6, HP 40, speed 3.0, and cyan body color.
   - The drone variant MUST hover at a fixed height of 3 meters above the terrain height and fire light blue projectiles.

## Scenarios
### Scenario 1: Crawler mesh legs creation
* **Given** a crawler monster is spawned
* **When** its mesh is created
* **Then** its group MUST contain 6 or 8 cylinder segments representing legs

### Scenario 2: Drone hovers and shoots
* **Given** a drone monster is spawned
* **When** it updates its position
* **Then** its Y coordinate MUST hover 3 meters above the ground elevation
