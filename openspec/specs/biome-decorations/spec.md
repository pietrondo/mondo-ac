</Specification: Building Cosmetic Details>
<Specification: Biome Decorations>
## Description
Defines mushrooms, crystals, and physics-based rolling tumbleweeds across biomes.

## Requirements
1. **Vegetation & Mineral Spawns**:
   - Forest biomes MUST spawn mushrooms; mountain biomes MUST spawn glowing crystals.
2. **Tumbleweed Physics**:
   - Desert biomes MUST spawn rolling tumbleweeds that move and rotate.
   - Tumbleweeds MUST stay aligned with the terrain heightmap.

## Scenarios
### Scenario 1: Desert tumbleweed movement
* **Given** a desert tumbleweed is spawned
* **When** the update loop runs
* **Then** the tumbleweed MUST roll across the terrain base and match the heightmap elevation
